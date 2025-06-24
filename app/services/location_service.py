"""Location service for geocoding and place search using Nominatim API."""

import asyncio
import httpx
import json
from typing import List, Optional, Tuple, Dict, Any
from urllib.parse import urlencode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func

from models.location import Location
from schemas.location import LocationResponse
from services.cache_service import cache_service
import uuid

class LocationService:
    """Service for location search and geocoding operations."""
    
    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org"
        self.cache = cache_service
        self.timeout = 10
        self.headers = {
            "User-Agent": "Walkumentary/1.0 (contact@walkumentary.app)"
        }
    
    async def search_locations(
        self,
        query: str,
        coordinates: Optional[Tuple[float, float]] = None,
        radius: int = 1000,
        limit: int = 10,
        db: AsyncSession = None
    ) -> Dict[str, Any]:
        """
        Search for locations using text query with Nominatim API.
        
        Args:
            query: Search text
            coordinates: Optional center point for proximity search
            radius: Search radius in meters
            limit: Maximum number of results
            db: Database session for caching results
            
        Returns:
            Dict with locations, suggestions, and total count
        """
        # Generate cache key
        cache_key = f"location_search:{query}:{coordinates}:{radius}:{limit}"
        
        # Try cache first
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            return cached_result
        
        try:
            # Build search parameters
            params = {
                "q": query,
                "format": "json",
                "addressdetails": 1,
                "extratags": 1,
                "limit": min(limit, 50),  # Cap at 50 for API limits
                "dedupe": 1
            }
            
            # Add viewbox for proximity search if coordinates provided
            if coordinates:
                lat, lng = coordinates
                # Create a small bounding box around the coordinates
                delta = radius / 111320  # Rough conversion from meters to degrees
                params["viewbox"] = f"{lng-delta},{lat+delta},{lng+delta},{lat-delta}"
                params["bounded"] = 1
            
            # Make API request
            url = f"{self.base_url}/search?" + urlencode(params)
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                nominatim_results = response.json()
                
            # Process results
            locations = []
            suggestions = set()
            
            for item in nominatim_results:
                # Extract location data
                location_data = self._parse_nominatim_result(item)
                if location_data:
                    locations.append(location_data)
                    
                # Extract suggestions for autocomplete
                if "display_name" in item:
                    parts = item["display_name"].split(",")
                    for part in parts[:3]:  # Take first 3 parts for suggestions
                        cleaned = part.strip()
                        if cleaned and len(cleaned) > 2:
                            suggestions.add(cleaned)
            
            # Sort locations by relevance (Nominatim provides them sorted by importance)
            # If coordinates provided, sort by distance
            if coordinates and locations:
                locations = self._sort_by_distance(locations, coordinates)
            
            result = {
                "locations": locations[:limit],
                "suggestions": list(suggestions)[:10],  # Limit suggestions
                "total": len(locations)
            }
            
            # Cache the result for 1 hour
            await self.cache.set_json(cache_key, result, ttl=3600)
            
            return result
            
        except httpx.RequestError as e:
            # Return fallback results from database if API fails
            return await self._fallback_search(query, db)
        except Exception as e:
            # Log error and return empty results
            print(f"Location search error: {e}")
            return {"locations": [], "suggestions": [], "total": 0}
    
    async def detect_nearby_locations(
        self,
        coordinates: Tuple[float, float],
        radius: int = 1000,
        limit: int = 10,
        db: AsyncSession = None
    ) -> Dict[str, Any]:
        """
        Detect nearby points of interest using reverse geocoding.
        
        Args:
            coordinates: (latitude, longitude) tuple
            radius: Search radius in meters
            limit: Maximum number of results
            db: Database session
            
        Returns:
            Dict with nearby locations
        """
        lat, lng = coordinates
        cache_key = f"nearby:{lat}:{lng}:{radius}:{limit}"
        
        # Try cache first
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            return cached_result
        
        try:
            # Use reverse geocoding to get the area info
            reverse_params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "extratags": 1,
                "zoom": 16  # Detailed level
            }
            
            reverse_url = f"{self.base_url}/reverse?" + urlencode(reverse_params)
            
            # Search for nearby POIs
            search_params = {
                "format": "json",
                "addressdetails": 1,
                "extratags": 1,
                "limit": limit * 2,  # Get more to filter
                "viewbox": f"{lng-0.01},{lat+0.01},{lng+0.01},{lat-0.01}",
                "bounded": 1
            }
            
            # Search for common POI types
            poi_types = [
                "tourism=attraction",
                "historic=monument",
                "amenity=restaurant",
                "tourism=museum",
                "leisure=park"
            ]
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get reverse geocoding info
                reverse_response = await client.get(reverse_url, headers=self.headers)
                
                # Search for POIs
                poi_results = []
                for poi_type in poi_types:
                    search_params["q"] = f"[{poi_type}]"
                    search_url = f"{self.base_url}/search?" + urlencode(search_params)
                    
                    try:
                        poi_response = await client.get(search_url, headers=self.headers)
                        if poi_response.status_code == 200:
                            poi_results.extend(poi_response.json())
                    except:
                        continue  # Skip failed POI type searches
            
            # Process and filter results
            locations = []
            seen_locations = set()
            
            for item in poi_results:
                location_data = self._parse_nominatim_result(item)
                if location_data and location_data["name"] not in seen_locations:
                    # Check if within radius
                    item_lat = float(item.get("lat", 0))
                    item_lng = float(item.get("lon", 0))
                    distance = self._calculate_distance(lat, lng, item_lat, item_lng)
                    
                    if distance <= radius:
                        location_data["distance"] = round(distance)
                        locations.append(location_data)
                        seen_locations.add(location_data["name"])
            
            # Sort by distance and limit results
            locations = sorted(locations, key=lambda x: x.get("distance", float("inf")))[:limit]
            
            result = {
                "locations": locations,
                "center": coordinates,
                "radius": radius
            }
            
            # Cache for 30 minutes (nearby locations change less frequently)
            await self.cache.set_json(cache_key, result, ttl=1800)
            
            return result
            
        except Exception as e:
            print(f"Nearby detection error: {e}")
            return {"locations": [], "center": coordinates, "radius": radius}
    
    def _parse_nominatim_result(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse a Nominatim result item into our location format."""
        try:
            # Extract basic info
            name = item.get("display_name", "").split(",")[0].strip()
            if not name:
                return None
            
            # Extract coordinates
            lat = float(item.get("lat", 0))
            lng = float(item.get("lon", 0))
            
            # Extract address details
            address = item.get("address", {})
            
            # Determine location type
            location_type = self._determine_location_type(item)
            
            # Extract additional metadata
            metadata = {
                "place_id": item.get("place_id"),
                "osm_id": item.get("osm_id"),
                "osm_type": item.get("osm_type"),
                "importance": item.get("importance", 0),
                "extratags": item.get("extratags", {})
            }
            
            return {
                "name": name,
                "description": self._generate_description(item),
                "latitude": lat,
                "longitude": lng,
                "country": address.get("country"),
                "city": address.get("city") or address.get("town") or address.get("village"),
                "location_type": location_type,
                "location_metadata": metadata
            }
            
        except (ValueError, TypeError):
            return None
    
    def _determine_location_type(self, item: Dict[str, Any]) -> str:
        """Determine the type of location from Nominatim result."""
        osm_type = item.get("type", "").lower()
        category = item.get("class", "").lower()
        
        # Map OSM types to our location types
        type_mapping = {
            "attraction": "tourist_attraction",
            "museum": "museum",
            "monument": "monument",
            "castle": "castle",
            "church": "religious",
            "restaurant": "restaurant",
            "cafe": "restaurant",
            "park": "park",
            "beach": "beach",
            "mountain": "mountain",
            "lake": "lake",
            "river": "river"
        }
        
        # Check exact matches first
        if osm_type in type_mapping:
            return type_mapping[osm_type]
        
        # Check category
        if category in type_mapping:
            return type_mapping[category]
        
        # Default based on category
        if category == "tourism":
            return "tourist_attraction"
        elif category == "amenity":
            return "amenity"
        elif category == "historic":
            return "historic"
        elif category == "natural":
            return "natural"
        else:
            return "place"
    
    def _generate_description(self, item: Dict[str, Any]) -> str:
        """Generate a description from Nominatim result."""
        address = item.get("address", {})
        osm_type = item.get("type", "")
        
        parts = []
        
        # Add type information
        if osm_type:
            parts.append(osm_type.replace("_", " ").title())
        
        # Add location context
        location_parts = []
        for key in ["suburb", "city", "town", "village", "state", "country"]:
            if key in address and address[key]:
                location_parts.append(address[key])
        
        if location_parts:
            parts.append("in " + ", ".join(location_parts[:2]))
        
        return " ".join(parts) if parts else "Point of interest"
    
    def _sort_by_distance(
        self, 
        locations: List[Dict[str, Any]], 
        center: Tuple[float, float]
    ) -> List[Dict[str, Any]]:
        """Sort locations by distance from center point."""
        center_lat, center_lng = center
        
        for location in locations:
            if location.get("latitude") and location.get("longitude"):
                distance = self._calculate_distance(
                    center_lat, center_lng,
                    location["latitude"], location["longitude"]
                )
                location["distance"] = round(distance)
            else:
                location["distance"] = float("inf")
        
        return sorted(locations, key=lambda x: x.get("distance", float("inf")))
    
    def _calculate_distance(
        self, 
        lat1: float, lng1: float, 
        lat2: float, lng2: float
    ) -> float:
        """Calculate distance between two points using Haversine formula."""
        import math
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in meters
        r = 6371000
        
        return c * r
    
    async def _fallback_search(self, query: str, db: AsyncSession) -> Dict[str, Any]:
        """Fallback search using local database when API is unavailable."""
        if not db:
            return {"locations": [], "suggestions": [], "total": 0}
        
        try:
            # Search in local database
            stmt = select(Location).where(
                Location.name.ilike(f"%{query}%")
            ).limit(10)
            
            result = await db.execute(stmt)
            locations = result.scalars().all()
            
            location_data = []
            for loc in locations:
                location_data.append({
                    "id": str(loc.id),
                    "name": loc.name,
                    "description": loc.description,
                    "latitude": float(loc.latitude) if loc.latitude else None,
                    "longitude": float(loc.longitude) if loc.longitude else None,
                    "country": loc.country,
                    "city": loc.city,
                    "location_type": loc.location_type,
                    "location_metadata": loc.location_metadata or {},
                    "created_at": loc.created_at.isoformat() if loc.created_at else None,
                    "updated_at": loc.updated_at.isoformat() if loc.updated_at else None
                })
            
            return {
                "locations": location_data,
                "suggestions": [loc.name for loc in locations[:5]],
                "total": len(location_data)
            }
            
        except Exception as e:
            print(f"Fallback search error: {e}")
            return {"locations": [], "suggestions": [], "total": 0}
    
    async def store_external_location(
        self, 
        location_data: Dict[str, Any], 
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Store an external location in the database for tour generation.
        
        Args:
            location_data: Location data from external API
            db: Database session
            
        Returns:
            Stored location with database ID
        """
        try:
            # For now, always create new location to avoid complex duplicate checking
            # TODO: Add proper duplicate detection later
            
            # Create new location
            new_location = Location(
                id=uuid.uuid4(),
                name=location_data.get("name", "Unknown Location"),
                description=location_data.get("description"),
                latitude=location_data.get("latitude"),
                longitude=location_data.get("longitude"),
                country=location_data.get("country"),
                city=location_data.get("city"),
                location_type=location_data.get("location_type", "place"),
                location_metadata=location_data.get("location_metadata", {})
            )
            
            db.add(new_location)
            await db.commit()
            await db.refresh(new_location)
            
            return {
                "id": str(new_location.id),
                "name": new_location.name,
                "description": new_location.description,
                "latitude": float(new_location.latitude) if new_location.latitude else None,
                "longitude": float(new_location.longitude) if new_location.longitude else None,
                "country": new_location.country,
                "city": new_location.city,
                "location_type": new_location.location_type,
                "location_metadata": new_location.location_metadata or {}
            }
            
        except Exception as e:
            await db.rollback()
            import traceback
            print(f"Location storage error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            print(f"Location data: {location_data}")
            raise Exception(f"Failed to store location: {str(e)}")