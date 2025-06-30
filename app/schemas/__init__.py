# Schemas package
from app.schemas.base import BaseResponse, PaginatedResponse
from app.schemas.auth import TokenData, UserResponse, UserPreferencesUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.location import LocationCreate, LocationResponse, LocationSearchRequest, LocationSearchResponse
from app.schemas.tour import TourCreate, TourResponse, TourGenerationRequest

__all__ = [
    "BaseResponse", 
    "PaginatedResponse",
    "TokenData", 
    "UserResponse", 
    "UserPreferencesUpdate",
    "UserCreate", 
    "UserUpdate",
    "LocationCreate", 
    "LocationResponse", 
    "LocationSearchRequest", 
    "LocationSearchResponse",
    "TourCreate", 
    "TourResponse", 
    "TourGenerationRequest"
]