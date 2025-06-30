from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from app.schemas.base import IDMixin, TimestampMixin
from app.schemas.auth import UserPreferences

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    preferences: Optional[UserPreferences] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[UserPreferences] = None

class UserInDB(UserBase, IDMixin, TimestampMixin):
    preferences: UserPreferences
    is_active: bool
    
    class Config:
        from_attributes = True