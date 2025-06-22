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
                title="",  # Will be filled after generation
                description="",
                content="",  # Will be filled after generation
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
            
            # Generate tour content using AI
            content_data = await self.ai_service.generate_tour_content(
                location=location,
                interests=request.interests,
                duration_minutes=request.duration_minutes,
                language=request.language
            )
            
            # Generate audio from content
            audio_data = await self.ai_service.generate_audio(
                text=content_data["content"],
                voice=settings.OPENAI_TTS_VOICE,
                speed=1.0
            )
            
            # Store audio file (for now, we'll use cache - in production, use cloud storage)
            audio_key = f"audio:tour:{tour_id}"
            await self.cache.set(audio_key, audio_data.decode('latin-1'), ttl=86400 * 30)
            audio_url = f"/api/tours/{tour_id}/audio"
            
            # Update tour in database
            from database import async_session_factory
            async with async_session_factory() as db:
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
            logger.error(f"Background generation failed for tour {tour_id}: {str(e)}")
            
            # Update tour status to error
            try:
                from database import async_session_factory
                async with async_session_factory() as db:
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
    ) -> List[Tour]:
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
            return list(tours)
            
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
            # Verify user owns the tour
            tour = await self.get_tour(db, tour_id, user)
            
            if tour.status != "ready" or not tour.audio_url:
                raise TourServiceError("Audio not available for this tour")
            
            # Get audio from cache
            audio_key = f"audio:tour:{tour_id}"
            audio_data = await self.cache.get(audio_key)
            
            if not audio_data:
                raise TourServiceError("Audio data not found")
            
            return audio_data.encode('latin-1')
            
        except TourServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to get tour audio {tour_id}: {str(e)}")
            raise TourServiceError(f"Failed to get tour audio: {str(e)}")
    
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
                "metadata": location.metadata or {}
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
                language=request.language
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

# Global tour service instance
tour_service = TourService()