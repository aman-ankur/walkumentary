from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class UserPreferences(BaseModel):
    interests: List[str] = Field(default=[])
    language: str = Field(default="en")
    default_tour_duration: int = Field(default=30, ge=10, le=180)
    audio_speed: float = Field(default=1.0, ge=0.5, le=2.0)
    theme: str = Field(default="light")

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: UserPreferences
    is_active: bool
    
    class Config:
        from_attributes = True

class UserPreferencesUpdate(BaseModel):
    interests: Optional[List[str]] = Field(None, max_items=10)
    language: Optional[str] = Field(None, pattern="^[a-z]{2}$")
    default_tour_duration: Optional[int] = Field(None, ge=10, le=180)
    audio_speed: Optional[float] = Field(None, ge=0.5, le=2.0)
    theme: Optional[str] = Field(None, pattern="^(light|dark)$")

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse