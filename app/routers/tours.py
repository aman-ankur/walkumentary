from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
import io

from database import get_db
from auth import get_current_active_user
from models.user import User
from schemas.tour import (
    TourGenerationRequest,
    TourGenerationResponse,
    TourResponse
)
from services.tour_service import tour_service, TourServiceError, TourNotFoundError

router = APIRouter()

@router.post("/generate", response_model=TourGenerationResponse)
async def generate_tour(
    request: TourGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new tour with AI-powered content and audio"""
    try:
        tour = await tour_service.generate_tour(db, current_user, request)
        
        return TourGenerationResponse(
            tour_id=tour.id,
            status=tour.status,
            message="Tour generation started. Content and audio will be ready shortly."
        )
        
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tour: {str(e)}"
        )

@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(
    tour_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tour by ID with full details"""
    try:
        tour = await tour_service.get_tour(db, tour_id, current_user)
        return tour
        
    except TourNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found"
        )
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tour: {str(e)}"
        )

@router.get("/user/tours")
async def get_user_tours(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tours for current user with pagination"""
    try:
        tours = await tour_service.get_user_tours(db, current_user, limit, offset)
        return tours
        
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user tours: {str(e)}"
        )

@router.get("/{tour_id}/status")
async def get_tour_status(
    tour_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tour generation status and progress"""
    try:
        status_info = await tour_service.get_tour_status(db, tour_id, current_user)
        return status_info
        
    except TourNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found"
        )
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tour status: {str(e)}"
        )

@router.get("/{tour_id}/audio")
async def get_tour_audio(
    tour_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tour audio file for playback"""
    try:
        audio_data = await tour_service.get_tour_audio(db, tour_id, current_user)
        
        # Return audio as streaming response
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=tour_{tour_id}.mp3",
                "Accept-Ranges": "bytes"
            }
        )
        
    except TourNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found"
        )
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tour audio: {str(e)}"
        )

@router.delete("/{tour_id}")
async def delete_tour(
    tour_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a tour and its associated audio"""
    try:
        await tour_service.delete_tour(db, tour_id, current_user)
        return {"message": "Tour deleted successfully"}
        
    except TourNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found"
        )
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tour: {str(e)}"
        )

@router.post("/estimate-cost")
async def estimate_tour_cost(
    request: TourGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Estimate cost for tour generation"""
    try:
        cost_estimate = await tour_service.estimate_generation_cost(db, request)
        return cost_estimate
        
    except TourServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to estimate cost: {str(e)}"
        )