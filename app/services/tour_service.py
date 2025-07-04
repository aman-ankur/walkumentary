"""
Tour service for managing tour generation, retrieval, and audio processing.
Handles the complete tour lifecycle from generation to audio creation.
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from models.tour import Tour
from models.location import Location
from models.user import User
from schemas.tour import TourCreate, TourUpdate, TourResponse, TourGenerationRequest
from services.ai_service import ai_service
from services.cache_service import cache_service
from config import settings

logger = logging.getLogger(__name__)

class TourServiceError(Exception):
    """Base exception for tour service errors"""
    pass

class TourNotFoundError(TourServiceError):
    """Raised when tour is not found"""
    pass

class TourGenerationError(TourServiceError):
    """Raised when tour generation fails"""
    pass

class TourService:
    """
    Service for managing tours and their lifecycle.
    
    Features:
    - Tour content generation using AI
    - Audio generation and storage
    - Tour status management
    - User tour history
    - Background processing
    """
    
    def __init__(self):
        self.ai_service = ai_service
        self.cache = cache_service
    
    async def generate_tour(
        self,
        db: AsyncSession,
        user: User,
        request: TourGenerationRequest
    ) -> Tour:
        """
        Generate a new tour for the user.
        
        Args:
            db: Database session
            user: Current user
            request: Tour generation request
            
        Returns:
            Tour object with initial status "generating"
        """
        try:
            # Get location details
            location = await self._get_location(db, request.location_id)
            if not location:
                raise TourServiceError(f"Location {request.location_id} not found")
            
            # Create tour record with generating status
            tour_data = TourCreate(
                title="Generating...",  # Placeholder that meets min_length=1
                description="Tour content is being generated",
                content="Tour content is being generated. Please wait...",  # Placeholder that meets min_length=10
                duration_minutes=request.duration_minutes,
                interests=request.interests,
                language=request.language,
                location_id=request.location_id,
                user_id=user.id
            )
            
            tour = Tour(**tour_data.model_dump())
            tour.status = "generating"
            
            db.add(tour)
            await db.commit()
            await db.refresh(tour)
            
            # Start background generation
            asyncio.create_task(self._generate_tour_content_background(tour.id, location, request))
            
            logger.info(f"Tour generation started for user {user.id}, tour {tour.id}")
            return tour
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to start tour generation: {str(e)}")
            raise TourGenerationError(f"Failed to start tour generation: {str(e)}")
    
    async def _generate_tour_content_background(
        self,
        tour_id: uuid.UUID,
        location: Dict[str, Any],
        request: TourGenerationRequest
    ) -> None:
        """Background task to generate tour content and audio"""
        try:
            logger.info(f"Starting background generation for tour {tour_id}")

            # ----------------- 1. Generate textual content -----------------
            try:
                content_data = await self.ai_service.generate_tour_content(
                    location=location,
                    interests=request.interests,
                    duration_minutes=request.duration_minutes,
                    language=request.language,
                    narration_style=request.narration_style if hasattr(request, "narration_style") else "conversational",
                )
            except Exception as e:
                # Capture stack-trace for easier debugging
                logger.exception("LLM content generation failed")
                await self._set_tour_error(tour_id, f"LLM error: {str(e)}")
                return

            # Persist title/content immediately and log milestone
            await self._save_content(tour_id, content_data, status="content_ready")
            logger.info(
                "LLM content generated",
                extra={
                    "tour_id": str(tour_id),
                    "chars": len(content_data["content"]),
                    "provider": content_data["metadata"]["actual_provider"],
                    "model": content_data["metadata"]["model"],
                },
            )

            # ----------------- 2. Generate audio (TTS) ---------------------
            audio_data: Optional[bytes] = None
            try:
                import asyncio, time
                audio_text = self._truncate_for_tts(content_data["content"])
                t0 = time.perf_counter()
                audio_data = await asyncio.wait_for(
                    self.ai_service.generate_audio(
                        text=audio_text,
                        voice=request.voice if hasattr(request, "voice") and request.voice else settings.OPENAI_TTS_VOICE,
                        speed=1.2,
                    ),
                    timeout=60,
                )
                logger.info(
                    "TTS generated",
                    extra={
                        "tour_id": str(tour_id),
                        "ms": int((time.perf_counter() - t0) * 1000),
                        "bytes": len(audio_data) if audio_data else 0,
                    },
                )
            except asyncio.TimeoutError:
                logger.warning("TTS generation timed out – proceeding without audio for now")
            except Exception:
                logger.exception("TTS generation failed – proceeding without audio")

            # Store audio file (for now, we'll use cache - in production, use cloud storage)
            audio_key = f"audio:tour:{tour_id}"
            import base64
            audio_url: Optional[str] = None
            if audio_data:
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                await self.cache.set(audio_key, audio_b64, ttl=86400 * 30)
                audio_url = f"{settings.API_BASE_URL}/tours/{tour_id}/audio"
            
            # Update tour in database
            from database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Tour).where(Tour.id == tour_id))
                tour = result.scalar_one_or_none()
                
                if tour:
                    tour.title = content_data["title"]
                    tour.content = content_data["content"]
                    tour.audio_url = audio_url
                    tour.status = "ready"
                    tour.llm_provider = content_data["metadata"]["actual_provider"]
                    tour.llm_model = content_data["metadata"]["model"]
                    tour.generation_params = content_data["metadata"]
                    
                    await db.commit()
                    logger.info(f"Tour {tour_id} generation completed successfully")
                else:
                    logger.error(f"Tour {tour_id} not found during content update")
                    
        except Exception as e:
            logger.exception(f"Background generation failed for tour {tour_id}")
            
            # Update tour status to error
            try:
                from database import AsyncSessionLocal
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(Tour).where(Tour.id == tour_id))
                    tour = result.scalar_one_or_none()
                    
                    if tour:
                        tour.status = "error"
                        tour.description = f"Generation failed: {str(e)}"
                        await db.commit()
                        
            except Exception as update_error:
                logger.error(f"Failed to update tour status to error: {str(update_error)}")
    
    async def get_tour(
        self,
        db: AsyncSession,
        tour_id: uuid.UUID,
        user: User
    ) -> Tour:
        """
        Get tour by ID for the current user.
        
        Args:
            db: Database session
            tour_id: Tour ID
            user: Current user
            
        Returns:
            Tour object with location details
        """
        try:
            result = await db.execute(
                select(Tour)
                .options(selectinload(Tour.location))
                .where(and_(Tour.id == tour_id, Tour.user_id == user.id))
            )
            
            tour = result.scalar_one_or_none()
            if not tour:
                raise TourNotFoundError(f"Tour {tour_id} not found")
            
            return tour
            
        except TourNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to get tour {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to get tour: {str(e)}")
    
    async def get_user_tours(
        self,
        db: AsyncSession,
        user: User,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all tours for the current user.
        
        Args:
            db: Database session
            user: Current user
            limit: Maximum number of tours to return
            offset: Number of tours to skip
            
        Returns:
            List of tour objects with location details
        """
        try:
            result = await db.execute(
                select(Tour)
                .options(selectinload(Tour.location))
                .where(Tour.user_id == user.id)
                .order_by(Tour.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            tours = result.scalars().all()
            
            # Convert to response format with proper string IDs
            tour_responses = []
            for tour in tours:
                tour_data = {
                    "id": str(tour.id),
                    "title": tour.title,
                    "description": tour.description,
                    "content": tour.content,
                    "audio_url": tour.audio_url,
                    "duration_minutes": tour.duration_minutes,
                    "interests": tour.interests or [],
                    "language": tour.language,
                    "llm_provider": tour.llm_provider,
                    "llm_model": tour.llm_model,
                    "status": tour.status,
                    "user_id": str(tour.user_id),
                    "created_at": tour.created_at.isoformat() if tour.created_at else None,
                    "updated_at": tour.updated_at.isoformat() if tour.updated_at else None,
                    "location": {
                        "id": str(tour.location.id),
                        "name": tour.location.name,
                        "description": tour.location.description,
                        "latitude": float(tour.location.latitude) if tour.location.latitude else None,
                        "longitude": float(tour.location.longitude) if tour.location.longitude else None,
                        "country": tour.location.country,
                        "city": tour.location.city,
                        "location_type": tour.location.location_type,
                        "location_metadata": tour.location.location_metadata or {},
                        "image_url": tour.location.image_url,
                        "created_at": tour.location.created_at.isoformat() if tour.location.created_at else None,
                        "updated_at": tour.location.updated_at.isoformat() if tour.location.updated_at else None
                    }
                }
                tour_responses.append(tour_data)
            
            return tour_responses
            
        except Exception as e:
            logger.error(f"Failed to get user tours for {user.id}: {str(e)}")
            raise TourServiceError(f"Failed to get user tours: {str(e)}")
    
    async def get_tour_audio(
        self,
        db: AsyncSession,
        tour_id: uuid.UUID,
        user: User
    ) -> bytes:
        """
        Get audio data for a tour.
        
        Args:
            db: Database session
            tour_id: Tour ID
            user: Current user
            
        Returns:
            Audio data as bytes
        """
        try:
            logger.info(f"Getting audio for tour {tour_id} by user {user.id}")
            
            # Verify user owns the tour
            tour = await self.get_tour(db, tour_id, user)
            logger.info(f"Tour found: status={tour.status}, audio_url={tour.audio_url}")
            
            if tour.status not in ("ready", "content_ready"):
                logger.error(f"Tour status is {tour.status}, audio not yet available")
                raise TourServiceError(f"Tour is not ready (status: {tour.status})")
            
            if not tour.audio_url:
                logger.error("Tour has no audio_url")
                raise TourServiceError("Audio not available for this tour")
            
            # Get audio from cache
            audio_key = f"audio:tour:{tour_id}"
            logger.info(f"Looking for audio in cache with key: {audio_key}")
            audio_b64 = await self.cache.get(audio_key)
            
            if not audio_b64:
                logger.error(f"Audio data not found in cache for key: {audio_key}")
                logger.info(f"Attempting to regenerate missing audio for tour {tour_id}")
                
                # Try to regenerate audio from existing content
                if tour.content:
                    try:
                        # Generate audio from existing content (truncate to TTS limit)
                        audio_text = tour.content[:4000]
                        if len(tour.content) > 4000:
                            last_period = audio_text.rfind('.')
                            if last_period > 3500:
                                audio_text = audio_text[:last_period + 1]
                        
                        logger.info(f"Regenerating audio for {len(audio_text)} characters")
                        audio_data = await self.ai_service.generate_audio(
                            text=audio_text,
                            voice=request.voice if hasattr(request, "voice") and request.voice else settings.OPENAI_TTS_VOICE,
                            speed=1.2
                        )
                        
                        # Store regenerated audio
                        import base64
                        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                        await self.cache.set(audio_key, audio_b64, ttl=86400 * 30)
                        
                        # Update audio_url so future calls skip regen
                        if not tour.audio_url:
                            tour.audio_url = f"{settings.API_BASE_URL}/tours/{tour_id}/audio"
                            await db.commit()
                        
                        logger.info(f"Successfully regenerated and cached audio for tour {tour_id}")
                        return base64.b64decode(audio_b64)
                        
                    except Exception as regen_error:
                        logger.error(f"Failed to regenerate audio: {regen_error}")
                        raise TourServiceError("Audio data not found and regeneration failed")
                else:
                    raise TourServiceError("Audio data not found and no content available for regeneration")
            
            logger.info(f"Found audio data in cache, length: {len(audio_b64)}")
            import base64
            try:
                audio_bytes = base64.b64decode(audio_b64)
                logger.info(f"Successfully decoded audio, byte length: {len(audio_bytes)}")
                return audio_bytes
            except Exception as decode_error:
                logger.error(f"Failed to decode base64 audio: {decode_error}")
                raise TourServiceError(f"Failed to decode audio data: {decode_error}")
            
        except TourServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to get tour audio {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to get tour audio: {str(e)}")
    
    async def regenerate_tour_audio(
        self,
        db: AsyncSession,
        tour_id: uuid.UUID,
        user: User
    ) -> None:
        """
        Regenerate audio for an existing tour.
        
        Args:
            db: Database session
            tour_id: Tour ID
            user: Current user
        """
        try:
            logger.info(f"Regenerating audio for tour {tour_id} by user {user.id}")
            
            # Verify user owns the tour
            tour = await self.get_tour(db, tour_id, user)
            
            if not tour.content:
                raise TourServiceError("Tour has no content to generate audio from")
            
            # Generate audio from existing content (truncate to TTS limit)
            audio_text = tour.content[:4000]  # Leave some buffer
            if len(tour.content) > 4000:
                # Find last complete sentence within limit
                last_period = audio_text.rfind('.')
                if last_period > 3500:  # Ensure reasonable length
                    audio_text = audio_text[:last_period + 1]
            
            logger.info(f"Generating audio for {len(audio_text)} characters")
            audio_data = await self.ai_service.generate_audio(
                text=audio_text,
                voice=request.voice if hasattr(request, "voice") and request.voice else settings.OPENAI_TTS_VOICE,
                speed=1.2
            )
            
            # Store audio file in cache
            audio_key = f"audio:tour:{tour_id}"
            import base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            await self.cache.set(audio_key, audio_b64, ttl=86400 * 30)
            
            # Update audio_url in database if not set
            if not tour.audio_url:
                tour.audio_url = f"{settings.API_BASE_URL}/tours/{tour_id}/audio"
                await db.commit()
            
            logger.info(f"Successfully regenerated audio for tour {tour_id}")
            
        except TourServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to regenerate tour audio {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to regenerate tour audio: {str(e)}")
    
    async def delete_tour(
        self,
        db: AsyncSession,
        tour_id: uuid.UUID,
        user: User
    ) -> bool:
        """
        Delete a tour for the current user.
        
        Args:
            db: Database session
            tour_id: Tour ID
            user: Current user
            
        Returns:
            True if deleted successfully
        """
        try:
            # Get tour to verify ownership
            tour = await self.get_tour(db, tour_id, user)
            
            # Delete audio from cache
            audio_key = f"audio:tour:{tour_id}"
            await self.cache.delete(audio_key)
            
            # Delete tour from database
            await db.delete(tour)
            await db.commit()
            
            logger.info(f"Tour {tour_id} deleted by user {user.id}")
            return True
            
        except TourNotFoundError:
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete tour {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to delete tour: {str(e)}")
    
    async def get_tour_status(
        self,
        db: AsyncSession,
        tour_id: uuid.UUID,
        user: User
    ) -> Dict[str, Any]:
        """
        Get tour generation status.
        
        Args:
            db: Database session
            tour_id: Tour ID
            user: Current user
            
        Returns:
            Status information
        """
        try:
            tour = await self.get_tour(db, tour_id, user)
            
            return {
                "tour_id": tour.id,
                "status": tour.status,
                "title": tour.title,
                "progress": self._calculate_progress(tour.status),
                "has_audio": bool(tour.audio_url),
                "created_at": tour.created_at,
                "updated_at": tour.updated_at
            }
            
        except Exception as e:
            logger.error(f"Failed to get tour status {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to get tour status: {str(e)}")
    
    def _calculate_progress(self, status: str) -> int:
        """Calculate progress percentage based on status"""
        progress_map = {
            "generating": 50,
            "ready": 100,
            "error": 0
        }
        return progress_map.get(status, 0)
    
    async def _get_location(self, db: AsyncSession, location_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get location details for tour generation"""
        try:
            result = await db.execute(select(Location).where(Location.id == location_id))
            location = result.scalar_one_or_none()
            
            if not location:
                return None
            
            return {
                "id": str(location.id),
                "name": location.name,
                "description": location.description,
                "city": location.city,
                "country": location.country,
                "coordinates": [float(location.latitude), float(location.longitude)] if location.latitude and location.longitude else None,
                "type": location.location_type,
                "metadata": location.location_metadata or {}
            }
            
        except Exception as e:
            logger.error(f"Failed to get location {location_id}: {str(e)}")
            return None
    
    async def estimate_generation_cost(
        self,
        db: AsyncSession,
        request: TourGenerationRequest
    ) -> Dict[str, Any]:
        """Estimate cost for tour generation"""
        try:
            location = await self._get_location(db, request.location_id)
            if not location:
                raise TourServiceError(f"Location {request.location_id} not found")
            
            # Get cost estimate from AI service
            cost_estimate = await self.ai_service.estimate_generation_cost(
                location=location,
                interests=request.interests,
                duration_minutes=request.duration_minutes,
                language=request.language,
                narration_style=request.narration_style if hasattr(request, "narration_style") else "conversational",
            )
            
            # Add audio generation cost estimate
            estimated_content_length = request.duration_minutes * 200  # ~200 chars per minute
            audio_cost = (estimated_content_length / 1000) * 0.015  # TTS cost
            
            total_cost = cost_estimate["estimated_cost"] + audio_cost
            
            return {
                "content_generation": cost_estimate,
                "audio_generation": {
                    "estimated_cost": round(audio_cost, 4),
                    "estimated_characters": estimated_content_length
                },
                "total_estimated_cost": round(total_cost, 4),
                "cached": cost_estimate["cached"]
            }
            
        except Exception as e:
            logger.error(f"Failed to estimate generation cost: {str(e)}")
            raise TourServiceError(f"Failed to estimate cost: {str(e)}")

    # ---------------- Helper utilities ----------------

    async def _update_tour_status(self, tour_id: uuid.UUID, status: str):
        """Update only status field quickly"""
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Tour).where(Tour.id == tour_id))
            tour = result.scalar_one_or_none()
            if tour:
                tour.status = status
                await db.commit()

    async def _set_tour_error(self, tour_id: uuid.UUID, message: str):
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Tour).where(Tour.id == tour_id))
            tour = result.scalar_one_or_none()
            if tour:
                tour.status = "error"
                tour.description = message[:255]
                await db.commit()

    def _truncate_for_tts(self, text: str) -> str:
        """Trim text to ~2500 chars so TTS returns faster and end cleanly on a sentence."""
        max_len = 2500
        t = text[:max_len]
        if len(text) > max_len:
            # Try to avoid cutting words; backtrack to last period in the last 20 % of slice
            last_period = t.rfind('.')
            if last_period > int(max_len * 0.8):
                t = t[: last_period + 1]
        return t

    async def _save_content(self, tour_id: uuid.UUID, content_data: dict, status: str = "content_ready"):
        """Persist generated title/content and update status in one quick transaction."""
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Tour).where(Tour.id == tour_id))
            tour = result.scalar_one_or_none()
            if tour:
                tour.title = content_data["title"]
                tour.content = content_data["content"]
                tour.status = status
                # Store minimal metadata so we don't lose provider info if audio step fails later
                tour.llm_provider = content_data["metadata"]["actual_provider"]
                tour.llm_model = content_data["metadata"]["model"]
                tour.generation_params = content_data["metadata"]
                await db.commit()

# Global tour service instance
tour_service = TourService()