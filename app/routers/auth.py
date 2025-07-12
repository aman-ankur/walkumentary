from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.auth import get_current_active_user, create_user, get_user_by_email
from app.models.user import User
from app.schemas.auth import UserResponse, UserPreferencesUpdate, AuthResponse
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user"""
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Update user fields
        if user_update.full_name is not None:
            current_user.full_name = user_update.full_name
        
        if user_update.avatar_url is not None:
            current_user.avatar_url = user_update.avatar_url
        
        if user_update.preferences is not None:
            # Update preferences
            current_preferences = current_user.preferences or {}
            if user_update.preferences.interests is not None:
                current_preferences["interests"] = user_update.preferences.interests
            if user_update.preferences.language is not None:
                current_preferences["language"] = user_update.preferences.language
            if user_update.preferences.default_tour_duration is not None:
                current_preferences["default_tour_duration"] = user_update.preferences.default_tour_duration
            if user_update.preferences.audio_speed is not None:
                current_preferences["audio_speed"] = user_update.preferences.audio_speed
            if user_update.preferences.theme is not None:
                current_preferences["theme"] = user_update.preferences.theme
            
            current_user.preferences = current_preferences
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.patch("/me/preferences", response_model=UserResponse)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user preferences"""
    try:
        # Get current preferences or initialize empty dict
        current_preferences = current_user.preferences or {}
        
        # Update only provided fields
        if preferences.interests is not None:
            current_preferences["interests"] = preferences.interests
        if preferences.language is not None:
            current_preferences["language"] = preferences.language
        if preferences.default_tour_duration is not None:
            current_preferences["default_tour_duration"] = preferences.default_tour_duration
        if preferences.audio_speed is not None:
            current_preferences["audio_speed"] = preferences.audio_speed
        if preferences.theme is not None:
            current_preferences["theme"] = preferences.theme
        
        current_user.preferences = current_preferences
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}"
        )

@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate current user account"""
    try:
        current_user.is_active = False
        await db.commit()
        
        return {"message": "Account deactivated successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate account: {str(e)}"
        )