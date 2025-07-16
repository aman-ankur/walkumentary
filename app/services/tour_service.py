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

from app.models.tour import Tour
from app.models.location import Location
from app.models.user import User
from app.schemas.tour import TourCreate, TourUpdate, TourResponse, TourGenerationRequest
from .ai_service import ai_service
from .cache_service import cache_service
from .location_service import location_service
from app.config import settings
from app.utils.transcript_generator import TranscriptGenerator

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
            logger.info(f"🚀 Starting background generation for tour {tour_id}")
            logger.info(f"📍 Location: {location.get('name', 'Unknown')} ({location.get('latitude', 0)}, {location.get('longitude', 0)})")
            logger.info(f"⚙️  Parameters: interests={request.interests}, duration={request.duration_minutes}min, language={request.language}")

            # ----------------- 1. Generate textual content -----------------
            logger.info(f"🤖 Step 1: Starting LLM content generation...")
            try:
                content_data = await self.ai_service.generate_tour_content(
                    location=location,
                    interests=request.interests,
                    duration_minutes=request.duration_minutes,
                    language=request.language,
                    narration_style=request.narration_style if hasattr(request, "narration_style") else "conversational",
                )
                logger.info(f"✅ LLM content generated successfully: {len(content_data['content'])} chars, provider={content_data['metadata']['actual_provider']}")
            except Exception as e:
                # Capture stack-trace for easier debugging
                logger.exception("❌ LLM content generation failed")
                await self._set_tour_error(tour_id, f"LLM error: {str(e)}")
                return

            # Persist title/content immediately and log milestone
            await self._save_content(tour_id, content_data, status="content_ready")
            logger.info(f"💾 Content saved to database with status='content_ready'")
            logger.info(
                f"📊 Content metrics: {len(content_data['content'])} chars, {content_data['metadata']['actual_provider']}/{content_data['metadata']['model']}",
            )

            # ----------------- 1.5. Process walkable stops (if present) -----------------
            logger.info(f"🗺️  Step 2: Processing walkable stops...")
            geocoded_stops = []
            try:
                geocoded_stops = await self._process_walkable_tour_content(content_data, location)
                if geocoded_stops:
                    logger.info(f"✅ Successfully geocoded {len(geocoded_stops)} walkable stops")
                    
                    # Update tour with walkable stops data
                    try:
                        await self._save_walkable_stops(tour_id, content_data, geocoded_stops)
                        logger.info(f"💾 Walkable stops data saved to database")
                    except Exception as save_error:
                        logger.error(f"❌ Failed to save walkable stops: {save_error}")
                        # Continue with tour generation even if saving walkable stops fails
                else:
                    logger.warning("⚠️  No walkable stops processed (geocoding may have failed)")
            except Exception as e:
                logger.error(f"❌ Walkable stops processing failed: {e}")
                # Continue with tour generation even if walkable stops fail
            
            logger.info("🎵 Step 3: Starting audio generation...")

            # ----------------- 2. Generate audio (TTS) ---------------------
            audio_data: Optional[bytes] = None
            try:
                import asyncio, time
                full_text = content_data["content"]
                
                # Use chunked generation for long content, simple generation for short content
                if len(full_text) > 4000:
                    logger.info(f"📝 Long content detected: {len(full_text)} chars - using chunked TTS generation")
                    audio_text = full_text  # Use full text with chunking
                else:
                    logger.info(f"📝 Short content: {len(full_text)} chars - using standard TTS generation")
                    audio_text = self._truncate_for_tts(full_text)
                
                voice = request.voice if hasattr(request, "voice") and request.voice else settings.OPENAI_TTS_VOICE
                logger.info(f"🎤 Generating audio: voice={voice}, speed=1.2")
                
                t0 = time.perf_counter()
                if len(full_text) > 4000:
                    # Use chunked generation with longer timeout for multiple API calls
                    audio_data = await asyncio.wait_for(
                        self.ai_service.generate_audio_chunked(
                            text=audio_text,
                            voice=voice,
                            speed=1.2,
                        ),
                        timeout=300,  # 5 minutes for chunked generation
                    )
                else:
                    # Use standard generation
                    audio_data = await asyncio.wait_for(
                        self.ai_service.generate_audio(
                            text=audio_text,
                            voice=voice,
                            speed=1.2,
                        ),
                        timeout=180,  # 3 minutes for standard generation
                    )
                
                duration_ms = int((time.perf_counter() - t0) * 1000)
                audio_size = len(audio_data) if audio_data else 0
                logger.info(f"✅ TTS generated successfully: {audio_size} bytes in {duration_ms}ms")
                
            except asyncio.TimeoutError:
                timeout_duration = "300s" if len(content_data["content"]) > 4000 else "180s"
                logger.warning(f"⏰ TTS generation timed out ({timeout_duration}) – proceeding without audio")
            except Exception as e:
                logger.exception(f"❌ TTS generation failed: {str(e)} – proceeding without audio")

            # Store audio file (for now, we'll use cache - in production, use cloud storage)
            audio_key = f"audio:tour:{tour_id}"
            import base64
            audio_url: Optional[str] = None
            if audio_data:
                logger.info(f"💾 Caching audio data: {len(audio_data)} bytes")
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                await self.cache.set(audio_key, audio_b64, ttl=86400 * 30)
                audio_url = f"{settings.API_BASE_URL}/tours/{tour_id}/audio"
                logger.info(f"🔗 Audio URL set: {audio_url}")
            else:
                logger.warning("⚠️  No audio data to cache - tour will be text-only")

            # ----------------- 3. Generate transcript segments -----------------
            transcript_segments = None
            try:
                # Estimate audio duration (for transcript timing)
                estimated_duration = TranscriptGenerator.estimate_audio_duration(
                    content_data["content"], 
                    words_per_minute=150
                )
                
                # Generate transcript segments
                transcript_segments = TranscriptGenerator.generate_transcript_segments(
                    content_data["content"],
                    estimated_duration
                )
                
                if transcript_segments and len(transcript_segments) > 0:
                    logger.info(
                        "Transcript generated",
                        extra={
                            "tour_id": str(tour_id),
                            "segments": len(transcript_segments),
                            "duration": estimated_duration
                        }
                    )
                else:
                    logger.warning(f"Transcript generation returned empty segments for tour {tour_id}")
                    transcript_segments = []  # Set to empty array instead of None
            except Exception as e:
                logger.error(f"Transcript generation failed for tour {tour_id}: {e}")
                transcript_segments = []  # Set to empty array instead of None
            
            # Update tour in database
            from app.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Tour).where(Tour.id == tour_id))
                tour = result.scalar_one_or_none()
                
                if tour:
                    tour.title = content_data["title"]
                    tour.content = content_data["content"]
                    tour.audio_url = audio_url
                    tour.transcript = transcript_segments  # Add transcript to tour
                    tour.status = "ready"
                    tour.llm_provider = content_data["metadata"]["actual_provider"]
                    tour.llm_model = content_data["metadata"]["model"]
                    tour.generation_params = content_data["metadata"]
                    
                    await db.commit()
                    logger.info(f"🎉 Tour generation completed successfully!")
                    logger.info(f"📊 Final metrics: {len(transcript_segments) if transcript_segments else 0} transcript segments")
                    logger.info(f"🔄 Status updated to 'ready' for tour {tour_id}")
                    
                    # Verify the update was committed by re-reading
                    await db.refresh(tour)
                    logger.info(f"✅ Database commit verified: status={tour.status}, title='{tour.title}'")
                else:
                    logger.error(f"❌ Tour {tour_id} not found during final update!")
                    
        except Exception as e:
            logger.exception(f"Background generation failed for tour {tour_id}")
            
            # Update tour status to error
            try:
                from app.database import AsyncSessionLocal
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
                    "transcript": tour.transcript,  # Include transcript in response
                    "duration_minutes": tour.duration_minutes,
                    "interests": tour.interests or [],
                    "language": tour.language,
                    "llm_provider": tour.llm_provider,
                    "llm_model": tour.llm_model,
                    "status": tour.status,
                    "user_id": str(tour.user_id),
                    "created_at": tour.created_at.isoformat() if tour.created_at else None,
                    "updated_at": tour.updated_at.isoformat() if tour.updated_at else None,
                    # Walkable tour fields (safely handle missing attributes)
                    "walkable_stops": getattr(tour, 'walkable_stops', None) or [],
                    "total_walking_distance": getattr(tour, 'total_walking_distance', None),
                    "estimated_walking_time": getattr(tour, 'estimated_walking_time', None),
                    "difficulty_level": getattr(tour, 'difficulty_level', None) or "easy",
                    "route_type": getattr(tour, 'route_type', None) or "walkable",
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
                        audio_text = self._truncate_for_tts(tour.content)
                        
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
            audio_text = self._truncate_for_tts(tour.content)
            
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
            
            # Force refresh from database to ensure we have latest status
            await db.refresh(tour)
            
            status_response = {
                "tour_id": tour.id,
                "status": tour.status,
                "title": tour.title,
                "progress": self._calculate_progress(tour.status),
                "has_audio": bool(tour.audio_url),
                "created_at": tour.created_at,
                "updated_at": tour.updated_at
            }
            
# Removed debug logging - issues identified and fixed
            
            return status_response
            
        except Exception as e:
            logger.error(f"Failed to get tour status {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to get tour status: {str(e)}")
    
    def _calculate_progress(self, status: str) -> int:
        """Calculate progress percentage based on status"""
        progress_map = {
            "generating": 50,
            "content_ready": 80,
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
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Tour).where(Tour.id == tour_id))
            tour = result.scalar_one_or_none()
            if tour:
                tour.status = status
                await db.commit()

    async def _set_tour_error(self, tour_id: uuid.UUID, message: str):
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Tour).where(Tour.id == tour_id))
            tour = result.scalar_one_or_none()
            if tour:
                tour.status = "error"
                tour.description = message[:255]
                await db.commit()

    def _truncate_for_tts(self, text: str) -> str:
        """Trim text to OpenAI TTS character limit and end cleanly on a sentence."""
        max_len = 4000  # OpenAI TTS limit is 4096, using 4000 for safety buffer
        t = text[:max_len]
        if len(text) > max_len:
            # Try to avoid cutting words; backtrack to last period in the last 20% of slice
            last_period = t.rfind('.')
            if last_period > int(max_len * 0.8):  # 80% of 4000 = 3200
                t = t[: last_period + 1]
        return t
    
    def _chunk_text_for_tts(self, text: str, max_chunk_size: int = 4000) -> List[str]:
        """Split long text into chunks suitable for TTS, preserving sentence boundaries."""
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        remaining_text = text
        
        while remaining_text:
            if len(remaining_text) <= max_chunk_size:
                chunks.append(remaining_text)
                break
                
            # Find a good breaking point
            chunk = remaining_text[:max_chunk_size]
            
            # Try to break at sentence boundary first
            last_period = chunk.rfind('.')
            last_exclamation = chunk.rfind('!')
            last_question = chunk.rfind('?')
            
            # Use the latest sentence ending
            sentence_break = max(last_period, last_exclamation, last_question)
            
            if sentence_break > int(max_chunk_size * 0.6):  # At least 60% through the chunk
                split_point = sentence_break + 1
            else:
                # No good sentence break, try paragraph break
                last_double_newline = chunk.rfind('\n\n')
                if last_double_newline > int(max_chunk_size * 0.5):
                    split_point = last_double_newline + 2
                else:
                    # Fall back to word boundary
                    last_space = chunk.rfind(' ')
                    split_point = last_space if last_space > int(max_chunk_size * 0.8) else max_chunk_size
            
            chunks.append(remaining_text[:split_point].strip())
            remaining_text = remaining_text[split_point:].strip()
        
        return [chunk for chunk in chunks if chunk]  # Remove empty chunks

    async def _save_content(self, tour_id: uuid.UUID, content_data: dict, status: str = "content_ready"):
        """Persist generated title/content and update status in one quick transaction."""
        from app.database import AsyncSessionLocal
        
        # 🔍 Log what we're about to save
        title = content_data.get("title", "")
        content = content_data.get("content", "")
        logger.info(f"💾 Saving content to database for tour {tour_id}:")
        logger.info(f"   📝 Title: '{title}'")
        logger.info(f"   📖 Content length: {len(content)} characters")
        logger.info(f"   📊 Status: {status}")
        logger.info(f"   📄 Content preview (first 200 chars): {content[:200]}...")
        if len(content) > 200:
            logger.info(f"   📄 Content preview (last 200 chars): ...{content[-200:]}")
        
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
                
                # 🔍 Verify what was actually saved
                await db.refresh(tour)
                logger.info(f"✅ Content saved successfully:")
                logger.info(f"   📝 Saved title: '{tour.title}'")
                logger.info(f"   📖 Saved content length: {len(tour.content)} characters")
                logger.info(f"   📊 Saved status: {tour.status}")
            else:
                logger.error(f"❌ Tour {tour_id} not found when trying to save content!")

    async def _save_walkable_stops(self, tour_id: uuid.UUID, content_data: dict, geocoded_stops: list):
        """Save walkable stops data to the tour"""
        try:
            from app.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Tour).where(Tour.id == tour_id))
                tour = result.scalar_one_or_none()
                if tour:
                    # Save walkable stops data - check if fields exist
                    try:
                        # Check if walkable fields exist before setting them
                        if hasattr(tour, 'walkable_stops'):
                            tour.walkable_stops = geocoded_stops
                        if hasattr(tour, 'total_walking_distance'):
                            tour.total_walking_distance = content_data.get("total_walking_distance")
                        if hasattr(tour, 'estimated_walking_time'):
                            tour.estimated_walking_time = content_data.get("estimated_walking_time")
                        if hasattr(tour, 'difficulty_level'):
                            tour.difficulty_level = content_data.get("difficulty_level", "easy")
                        if hasattr(tour, 'route_type'):
                            tour.route_type = "walkable"
                        await db.commit()
                        logger.info(f"Saved walkable stops data for tour {tour_id}")
                    except Exception as field_error:
                        logger.error(f"Error saving walkable fields for tour {tour_id}: {field_error}")
                        # If database schema issues, continue without saving walkable data
                        await db.rollback()
                        logger.warning("Continuing without saving walkable data - database schema might be missing fields")
                else:
                    logger.error(f"Tour {tour_id} not found when saving walkable stops")
        except Exception as e:
            logger.error(f"Critical error in _save_walkable_stops for tour {tour_id}: {e}")
            import traceback
            logger.error(f"_save_walkable_stops traceback: {traceback.format_exc()}")
            raise e

    async def _process_walkable_tour_content(self, content_data: dict, location: dict) -> list:
        """Process AI-generated content to extract and geocode walkable stops"""
        try:
            # Extract structured stops from AI response
            walkable_stops = content_data.get("walkable_stops", [])
            
            # Validate walkable stops format
            if not walkable_stops or not isinstance(walkable_stops, list):
                logger.info("No walkable stops found in AI response or invalid format")
                return []
            
            # Filter out invalid stop entries
            valid_stops = []
            for stop in walkable_stops:
                if isinstance(stop, dict) and stop.get('name'):
                    valid_stops.append(stop)
                else:
                    logger.warning(f"Skipping invalid stop entry: {stop}")
            
            if not valid_stops:
                logger.info("No valid walkable stops found after validation")
                return []
            
            walkable_stops = valid_stops
            
            # Geocode each stop using existing location service
            geocoded_stops = []
            for i, stop in enumerate(walkable_stops):
                try:
                    # Add delay between requests to avoid rate limiting
                    if i > 0:
                        import asyncio
                        await asyncio.sleep(1)  # 1 second delay between geocoding requests
                    
                    coordinates = await self._geocode_stop(stop, location)
                    if coordinates:
                        geocoded_stop = {
                            **stop,
                            "latitude": coordinates["lat"],
                            "longitude": coordinates["lng"],
                            "geocoding_accuracy": coordinates.get("accuracy", "unknown"),
                            "distance_from_main": self._calculate_walking_distance(
                                location, coordinates
                            )
                        }
                        geocoded_stops.append(geocoded_stop)
                        logger.info(f"Successfully geocoded stop {i+1}: {stop['name']}")
                    else:
                        logger.warning(f"Failed to geocode stop {i+1}: {stop['name']}")
                except Exception as e:
                    logger.error(f"Error geocoding stop {i+1} ({stop.get('name', 'unknown')}): {e}")
                    continue
            
            # Validate walking feasibility
            if geocoded_stops:
                try:
                    feasibility = self._validate_walking_feasibility([location] + geocoded_stops)
                    logger.info(f"Route feasibility: {feasibility}")
                    
                    if not feasibility["is_feasible"]:
                        logger.warning(f"Route not feasible: {feasibility.get('total_distance', 'unknown')}m total distance")
                        # Still return the stops but log the warning
                except Exception as feasibility_error:
                    logger.error(f"Route feasibility check failed: {feasibility_error}")
                    import traceback
                    logger.error(f"Feasibility check traceback: {traceback.format_exc()}")
                    # Continue anyway - feasibility check is not critical
            
            logger.info(f"Successfully processed {len(geocoded_stops)}/{len(walkable_stops)} walkable stops")
            return geocoded_stops
            
        except Exception as e:
            logger.error(f"Error processing walkable tour content: {e}")
            return []

    async def _geocode_stop(self, stop: dict, main_location: dict) -> Optional[dict]:
        """Geocode individual stop using location service"""
        
        # Build simplified search query - complex queries are failing
        stop_name = stop.get('name', '')
        city = main_location.get('city', '')
        country = main_location.get('country', '')
        
        # Clean up descriptive stop names like "Back to the Eiffel Tower"
        cleaned_name = stop_name
        if "back to the" in stop_name.lower():
            # Extract the actual location name
            cleaned_name = stop_name.lower().replace("back to the ", "").replace("back to ", "")
            cleaned_name = cleaned_name.title()
        elif "return to" in stop_name.lower():
            cleaned_name = stop_name.lower().replace("return to the ", "").replace("return to ", "")
            cleaned_name = cleaned_name.title()
        
        # Try different query variations, starting with most specific
        search_queries = [
            f"{cleaned_name}, {city}",  # Simple: "Eiffel Tower, Paris"
            f"{cleaned_name}, {city}, {country}",  # Medium: "Eiffel Tower, Paris, France"  
            cleaned_name,  # Fallback: just the name
        ]
        
        # Add park-specific queries for venue names that might be inside parks
        park_venues = ['pavilion', 'theatre', 'theater', 'garden', 'monument', 'statue', 'fountain']
        if any(venue in cleaned_name.lower() for venue in park_venues):
            # Add broader search queries for park venues
            search_queries.extend([
                f"{cleaned_name} near {city}",  # "Rose Garden near Amsterdam"
                f"{cleaned_name} {city} park",  # "Rose Garden Amsterdam park"
            ])
        
        search_query = search_queries[0]  # Start with the simplest
        
        try:
            # Use existing location service search with proximity to main location
            main_coords = None
            if main_location.get('coordinates'):
                main_coords = main_location['coordinates']
            elif 'latitude' in main_location and 'longitude' in main_location:
                main_coords = [main_location['latitude'], main_location['longitude']]
            
            # Try different query formats until one succeeds
            for query in search_queries:
                if not query.strip():
                    continue
                    
                logger.info(f"Geocoding stop '{stop.get('name', 'unknown')}' with query: '{query}' near {main_coords}")
                
                search_result = await location_service.search_locations(
                    query=query,
                    coordinates=main_coords,
                    radius=2000,  # 2km radius for walkable tours
                    limit=1
                )
                
                logger.info(f"Search result for '{stop.get('name', 'unknown')}': {search_result}")
                
                if search_result and search_result.get("locations") and len(search_result["locations"]) > 0:
                    result = search_result["locations"][0]
                    logger.info(f"Successfully geocoded '{stop.get('name', 'unknown')}' to lat={result['latitude']}, lng={result['longitude']}")
                    return {
                        "lat": result["latitude"],
                        "lng": result["longitude"],
                        "accuracy": "geocoded"
                    }
                else:
                    logger.warning(f"No results found for stop '{stop.get('name', 'unknown')}' with query '{query}'")
                
        except Exception as e:
            logger.error(f"Exception while geocoding stop {stop.get('name', 'unknown')}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
        
        return None

    def _calculate_walking_distance(self, loc1: dict, loc2: dict) -> float:
        """Calculate walking distance between two locations using Haversine formula"""
        from math import radians, cos, sin, asin, sqrt
        
        # Extract coordinates
        if 'coordinates' in loc1:
            lat1, lon1 = loc1['coordinates']
        else:
            lat1, lon1 = loc1.get('latitude', 0), loc1.get('longitude', 0)
            
        lat2, lon2 = loc2.get('lat', 0), loc2.get('lng', 0)
        
        # Check for invalid coordinates (0,0 means geocoding failed)
        if (lat1 == 0 and lon1 == 0) or (lat2 == 0 and lon2 == 0):
            return float('inf')  # Return infinite distance for invalid coordinates
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return c * r * 1000  # Return distance in meters

    def _validate_walking_feasibility(self, route_locations: list, max_total_distance: float = 2000) -> dict:
        """Validate that route is feasible for walking"""
        if len(route_locations) < 2:
            return {"is_feasible": True, "total_distance": 0, "max_leg_distance": 0}
        
        total_distance = 0
        leg_distances = []
        
        for i in range(len(route_locations) - 1):
            leg_distance = self._calculate_walking_distance(route_locations[i], route_locations[i+1])
            # Skip infinite distances (failed geocoding)
            if leg_distance == float('inf'):
                continue
            leg_distances.append(leg_distance)
            total_distance += leg_distance
        
        max_leg_distance = max(leg_distances) if leg_distances else 0
        avg_leg_distance = sum(leg_distances) / len(leg_distances) if leg_distances else 0
        
        return {
            "is_feasible": total_distance <= max_total_distance and max_leg_distance <= 500,  # Max 500m between stops
            "total_distance": total_distance,
            "max_leg_distance": max_leg_distance,
            "average_leg_distance": avg_leg_distance,
            "estimated_walking_time_minutes": total_distance / 80 if total_distance > 0 else 0  # Assume 80m/min walking speed
        }

# Global tour service instance
tour_service = TourService()