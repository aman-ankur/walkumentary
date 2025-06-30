from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Union
from datetime import datetime
import uuid
from app.schemas.base import IDMixin, TimestampMixin

class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    location_type: Optional[str] = Field(None, max_length=50)

class LocationCreate(LocationBase):
    location_metadata: Optional[dict] = Field(default={})

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    location_type: Optional[str] = Field(None, max_length=50)
    location_metadata: Optional[dict] = None

class LocationResponse(LocationBase):
    id: Optional[Union[str, uuid.UUID]] = None  # Accept UUID or string
    image_url: Optional[str] = None
    location_metadata: dict = Field(default={})
    distance: Optional[float] = None  # Distance in meters for proximity searches
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @property
    def coordinates(self) -> Optional[Tuple[float, float]]:
        if self.latitude and self.longitude:
            return (self.latitude, self.longitude)
        return None
    
    class Config:
        from_attributes = True

class LocationSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    coordinates: Optional[Tuple[float, float]] = None
    radius: Optional[int] = Field(default=1000, ge=100, le=10000)
    limit: Optional[int] = Field(default=10, ge=1, le=50)

class LocationSearchResponse(BaseModel):
    locations: List[LocationResponse]
    suggestions: List[str] = []
    total: int

class GPSDetectionRequest(BaseModel):
    coordinates: Tuple[float, float] = Field(..., description="[latitude, longitude]")
    radius: int = Field(default=1000, ge=100, le=5000)

class NearbyLocationsResponse(BaseModel):
    locations: List[LocationResponse]
    center: Tuple[float, float]
    radius: int