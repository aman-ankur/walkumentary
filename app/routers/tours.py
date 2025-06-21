from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from database import get_db
from auth import get_current_active_user
from models.user import User
from schemas.tour import (
    TourGenerationRequest,
    TourGenerationResponse,
    TourResponse
)

router = APIRouter()

@router.post("/generate", response_model=TourGenerationResponse)
async def generate_tour(
    request: TourGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new tour"""
    try:
        # For now, return mock data - will implement actual tour generation later
        tour_id = uuid.uuid4()
        
        return TourGenerationResponse(
            tour_id=tour_id,
            status="generating",
            message="Tour generation started"
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
    """Get tour by ID"""
    try:
        # For now, return 404 - will implement actual tour retrieval later
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tour: {str(e)}"
        )

@router.get("/user/tours", response_model=List[TourResponse])
async def get_user_tours(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tours for current user"""
    try:
        # For now, return empty list - will implement actual user tours retrieval later
        return []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user tours: {str(e)}"
        )