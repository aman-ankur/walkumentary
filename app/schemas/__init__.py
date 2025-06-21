# Schemas package
from .base import BaseResponse, PaginatedResponse
from .auth import TokenData, UserResponse, UserPreferencesUpdate
from .user import UserCreate, UserUpdate
from .location import LocationCreate, LocationResponse, LocationSearchRequest, LocationSearchResponse
from .tour import TourCreate, TourResponse, TourGenerationRequest

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