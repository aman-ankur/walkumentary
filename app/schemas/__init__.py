# Schemas package
from schemas.base import BaseResponse, PaginatedResponse
from schemas.auth import TokenData, UserResponse, UserPreferencesUpdate
from schemas.user import UserCreate, UserUpdate
from schemas.location import LocationCreate, LocationResponse, LocationSearchRequest, LocationSearchResponse
from schemas.tour import TourCreate, TourResponse, TourGenerationRequest

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