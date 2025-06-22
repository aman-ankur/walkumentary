from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from auth import get_current_active_user
from models.user import User
from schemas.location import (
    LocationSearchRequest, 
    LocationSearchResponse,
    GPSDetectionRequest,
    NearbyLocationsResponse,
    LocationResponse,
    LocationCreate
)
from services.location_service import LocationService

router = APIRouter()
location_service = LocationService()

@router.get("/search", response_model=LocationSearchResponse)
async def search_locations(
    query: str,
    coordinates: str = None,
    radius: int = 1000,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Search for locations using text query"""
    try:
        # Parse coordinates if provided
        coords = None
        if coordinates:
            lat, lng = map(float, coordinates.split(','))
            coords = (lat, lng)
        
        # Use location service to search
        result = await location_service.search_locations(
            query=query,
            coordinates=coords,
            radius=radius,
            limit=limit,
            db=db
        )
        
        # Convert to response format
        locations = [LocationResponse(**loc) for loc in result["locations"]]
        
        return LocationSearchResponse(
            locations=locations,
            suggestions=result["suggestions"],
            total=result["total"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid coordinates format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect", response_model=NearbyLocationsResponse)
async def detect_nearby_locations(
    request: GPSDetectionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Detect nearby locations using GPS coordinates"""
    try:
        # Use location service to detect nearby locations
        result = await location_service.detect_nearby_locations(
            coordinates=request.coordinates,
            radius=request.radius,
            limit=10,
            db=db
        )
        
        # Convert to response format
        locations = [LocationResponse(**loc) for loc in result["locations"]]
        
        return NearbyLocationsResponse(
            locations=locations,
            center=result["center"],
            radius=result["radius"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/store", response_model=LocationResponse)
async def store_external_location(
    location_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Store an external location in database for tour generation"""
    try:
        # Use location service to store the location
        stored_location = await location_service.store_external_location(location_data, db)
        return stored_location
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recognize")
async def recognize_location_from_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Recognize location from uploaded image"""
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # For now, return mock data - will implement actual AI service later
        return {
            "identified": False, 
            "message": "Image recognition not yet implemented"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))