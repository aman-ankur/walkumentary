from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from app.schemas.base import IDMixin, TimestampMixin
from app.schemas.location import LocationResponse

class TranscriptSegment(BaseModel):
    """Individual transcript segment with timing information"""
    startTime: float = Field(..., description="Start time in seconds")
    endTime: float = Field(..., description="End time in seconds") 
    text: str = Field(..., min_length=1, description="Transcript text content")

class TourBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    content: str = Field(..., min_length=10)
    duration_minutes: int = Field(..., ge=5, le=300)
    interests: List[str] = Field(default=[], max_items=10)
    language: str = Field(default="en", pattern="^[a-z]{2}$")

class TourCreate(TourBase):
    location_id: uuid.UUID
    user_id: uuid.UUID

class TourUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = Field(None, min_length=10)
    duration_minutes: Optional[int] = Field(None, ge=5, le=300)
    interests: Optional[List[str]] = Field(None, max_items=10)
    language: Optional[str] = Field(None, pattern="^[a-z]{2}$")
    status: Optional[str] = Field(None, pattern="^(generating|ready|error)$")

class TourResponse(TourBase, IDMixin, TimestampMixin):
    audio_url: Optional[str] = None
    transcript: Optional[List[TranscriptSegment]] = Field(None, description="Timestamped transcript segments")
    location: LocationResponse
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    status: str
    user_id: uuid.UUID
    
    class Config:
        from_attributes = True

class TourGenerationRequest(BaseModel):
    location_id: uuid.UUID
    interests: List[str] = Field(default=[], max_items=5)
    duration_minutes: int = Field(default=30, ge=10, le=180)
    language: str = Field(default="en", pattern="^[a-z]{2}$")
    narration_style: str = Field(default="conversational", max_length=50)
    voice: Optional[str] = None

class TourGenerationResponse(BaseModel):
    tour_id: uuid.UUID
    status: str
    message: str
    estimated_completion: Optional[datetime] = None