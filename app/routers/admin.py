"""
Admin routes for monitoring usage, costs, and system health.
These endpoints provide insights into AI service usage and costs.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from database import get_db
from auth import get_current_active_user
from models.user import User
from services.usage_tracker import usage_tracker
from services.ai_service import ai_service

router = APIRouter()

@router.get("/usage")
async def get_usage_summary(
    period: str = "today",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get usage summary for monitoring costs and consumption.
    
    Query parameters:
    - period: "today", "yesterday", "this_month", "last_month"
    """
    try:
        summary = await usage_tracker.get_usage_summary(period)
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage summary: {str(e)}"
        )

@router.get("/cost-breakdown")
async def get_cost_breakdown(
    period: str = "this_month",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed cost breakdown by service and provider.
    
    Query parameters:
    - period: "this_month", "last_month"
    """
    try:
        breakdown = await usage_tracker.get_cost_breakdown(period)
        return breakdown
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cost breakdown: {str(e)}"
        )

@router.get("/provider-status")
async def get_provider_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get status of all AI providers"""
    try:
        status_info = await ai_service.get_provider_status()
        return status_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get provider status: {str(e)}"
        )

@router.post("/reset-usage")
async def reset_usage_counters(
    period: str = "today",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset usage counters (admin function).
    
    Query parameters:
    - period: "today", "this_month"
    """
    try:
        # Note: In production, add admin role check here
        success = await usage_tracker.reset_usage(period)
        
        if success:
            return {"message": f"Usage counters reset for period: {period}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reset usage counters"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset usage: {str(e)}"
        )