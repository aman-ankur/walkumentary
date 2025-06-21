"""Tests for location service."""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import httpx
from decimal import Decimal

from services.location_service import LocationService
from services.cache_service import CacheService


class TestLocationService:
    """Test LocationService methods."""
    
    @pytest.fixture
    def location_service(self):
        """Create LocationService instance with mocked cache."""
        cache_service = Mock(spec=CacheService)
        return LocationService(cache_service)
    
    def test_validate_coordinates_valid(self, location_service):
        """Test coordinate validation with valid coordinates."""
        # Valid coordinates
        assert location_service._validate_coordinates(40.7128, -74.0060) is True
        assert location_service._validate_coordinates(0, 0) is True
        assert location_service._validate_coordinates(-90, -180) is True
        assert location_service._validate_coordinates(90, 180) is True
    
    def test_validate_coordinates_invalid(self, location_service):
        """Test coordinate validation with invalid coordinates."""
        # Invalid latitude
        assert location_service._validate_coordinates(91, 0) is False
        assert location_service._validate_coordinates(-91, 0) is False
        
        # Invalid longitude
        assert location_service._validate_coordinates(0, 181) is False
        assert location_service._validate_coordinates(0, -181) is False
        
        # Invalid types
        assert location_service._validate_coordinates("40.7", "-74.0") is False
        assert location_service._validate_coordinates(None, 0) is False
    
    def test_parse_coordinates_valid_string(self, location_service):
        """Test coordinate parsing with valid string."""
        result = location_service._parse_coordinates("40.7128,-74.0060")
        assert result == (40.7128, -74.0060)
        
        result = location_service._parse_coordinates("40.7128, -74.0060")
        assert result == (40.7128, -74.0060)
        
        result = location_service._parse_coordinates(" 40.7128 , -74.0060 ")
        assert result == (40.7128, -74.0060)
    
    def test_parse_coordinates_invalid_string(self, location_service):
        """Test coordinate parsing with invalid string."""
        assert location_service._parse_coordinates("40.7128") is None
        assert location_service._parse_coordinates("40.7128,-74.0060,10") is None
        assert location_service._parse_coordinates("invalid,coords") is None
        assert location_service._parse_coordinates("") is None
        assert location_service._parse_coordinates("40.7128,") is None
    
    def test_parse_coordinates_tuple(self, location_service):
        """Test coordinate parsing with tuple."""
        result = location_service._parse_coordinates((40.7128, -74.0060))
        assert result == (40.7128, -74.0060)
        
        result = location_service._parse_coordinates((Decimal("40.7128"), Decimal("-74.0060")))
        assert result == (40.7128, -74.0060)
    
    def test_parse_coordinates_invalid_tuple(self, location_service):
        """Test coordinate parsing with invalid tuple."""
        assert location_service._parse_coordinates((40.7128,)) is None
        assert location_service._parse_coordinates((40.7128, -74.0060, 10)) is None
        assert location_service._parse_coordinates(("40.7128", "-74.0060")) is None
    
    def test_calculate_distance(self, location_service):
        """Test distance calculation using Haversine formula."""
        # Distance between NYC and Philadelphia (approximately 130 km)
        nyc_lat, nyc_lon = 40.7128, -74.0060
        philly_lat, philly_lon = 39.9526, -75.1652
        
        distance = location_service._calculate_distance(nyc_lat, nyc_lon, philly_lat, philly_lon)
        
        # Should be approximately 130 km
        assert 125 <= distance <= 135
    
    def test_calculate_distance_same_point(self, location_service):
        """Test distance calculation for same point."""
        distance = location_service._calculate_distance(40.7128, -74.0060, 40.7128, -74.0060)
        assert distance == 0.0
    
    def test_calculate_distance_antipodal(self, location_service):
        """Test distance calculation for antipodal points."""
        # Approximately opposite points on Earth
        distance = location_service._calculate_distance(40.7128, -74.0060, -40.7128, 105.9940)
        
        # Should be close to half the Earth's circumference (about 20,000 km)
        assert 19000 <= distance <= 21000
    
    def test_generate_cache_key(self, location_service):
        """Test cache key generation."""
        # Test with string query
        key = location_service._generate_cache_key("New York", None, None)
        assert key == "location_search:new york:None:None"
        
        # Test with coordinates
        key = location_service._generate_cache_key(None, 40.7128, -74.0060)
        assert key == "location_search:None:40.7128:-74.006"
        
        # Test with all parameters
        key = location_service._generate_cache_key("restaurant", 40.7128, -74.0060)
        assert key == "location_search:restaurant:40.7128:-74.006"
    
    def test_format_location_display_name(self, location_service):
        """Test location display name formatting."""
        # Test with full address
        address = {
            "name": "Central Park",
            "road": "Central Park West",
            "city": "New York",
            "state": "NY",
            "country": "USA"
        }
        result = location_service._format_location_display_name("Central Park", address)
        assert result == "Central Park, Central Park West, New York, NY"
        
        # Test with minimal address
        address = {"city": "New York", "country": "USA"}
        result = location_service._format_location_display_name("Central Park", address)
        assert result == "Central Park, New York, USA"
        
        # Test with empty address
        result = location_service._format_location_display_name("Central Park", {})
        assert result == "Central Park"
    
    def test_determine_location_type(self, location_service):
        """Test location type determination."""
        assert location_service._determine_location_type("restaurant", "amenity") == "restaurant"
        assert location_service._determine_location_type("hotel", "tourism") == "hotel"
        assert location_service._determine_location_type("museum", "tourism") == "museum"
        assert location_service._determine_location_type("shop", "shop") == "shop"
        assert location_service._determine_location_type("unknown", "unknown") == "place"
    
    def test_build_nominatim_params_query_only(self, location_service):
        """Test Nominatim parameters building with query only."""
        params = location_service._build_nominatim_params("New York", None, None, 10)
        
        expected = {
            "q": "New York",
            "format": "json",
            "addressdetails": 1,
            "limit": 10,
            "dedupe": 1
        }
        assert params == expected
    
    def test_build_nominatim_params_coordinates_only(self, location_service):
        """Test Nominatim parameters building with coordinates only."""
        params = location_service._build_nominatim_params(None, 40.7128, -74.0060, 5)
        
        expected = {
            "lat": 40.7128,
            "lon": -74.0060,
            "format": "json",
            "addressdetails": 1,
            "limit": 5,
            "zoom": 18
        }
        assert params == expected
    
    def test_build_nominatim_params_all(self, location_service):
        """Test Nominatim parameters building with all parameters."""
        params = location_service._build_nominatim_params("restaurant", 40.7128, -74.0060, 15)
        
        expected = {
            "q": "restaurant",
            "lat": 40.7128,
            "lon": -74.0060,
            "format": "json",
            "addressdetails": 1,
            "limit": 15,
            "zoom": 18
        }
        assert params == expected
    
    def test_process_nominatim_response_valid(self, location_service):
        """Test processing valid Nominatim response."""
        raw_response = [
            {
                "place_id": 123456,
                "display_name": "Central Park, Manhattan, NY, USA",
                "lat": "40.7829",
                "lon": "-73.9654",
                "type": "park",
                "class": "leisure",
                "importance": 0.9,
                "address": {
                    "name": "Central Park",
                    "city": "New York",
                    "state": "NY",
                    "country": "USA"
                }
            }
        ]
        
        result = location_service._process_nominatim_response(raw_response, None, None)
        
        assert len(result) == 1
        location = result[0]
        assert location["name"] == "Central Park"
        assert location["latitude"] == 40.7829
        assert location["longitude"] == -73.9654
        assert location["location_type"] == "park"
        assert location["address"] == "Central Park, New York, NY, USA"
        assert "distance" not in location
    
    def test_process_nominatim_response_with_distance(self, location_service):
        """Test processing Nominatim response with distance calculation."""
        raw_response = [
            {
                "place_id": 123456,
                "display_name": "Test Location",
                "lat": "40.7829",
                "lon": "-73.9654",
                "type": "restaurant",
                "class": "amenity",
                "importance": 0.8,
                "address": {"name": "Test Location"}
            }
        ]
        
        result = location_service._process_nominatim_response(raw_response, 40.7128, -74.0060)
        
        assert len(result) == 1
        location = result[0]
        assert "distance" in location
        assert isinstance(location["distance"], float)
        assert location["distance"] > 0
    
    def test_process_nominatim_response_empty(self, location_service):
        """Test processing empty Nominatim response."""
        result = location_service._process_nominatim_response([], None, None)
        assert result == []
    
    def test_process_nominatim_response_invalid_data(self, location_service):
        """Test processing Nominatim response with invalid data."""
        raw_response = [
            {
                "place_id": 123456,
                # Missing required fields
                "type": "restaurant"
            }
        ]
        
        result = location_service._process_nominatim_response(raw_response, None, None)
        assert len(result) == 0  # Should skip invalid entries
    
    @pytest.mark.asyncio
    async def test_search_locations_cached(self, location_service):
        """Test searching locations with cached result."""
        # Mock cache to return cached result
        cached_result = [{"name": "Cached Location", "latitude": 40.7128, "longitude": -74.0060}]
        location_service.cache_service.get.return_value = cached_result
        
        result = await location_service.search_locations("New York")
        
        assert result == cached_result
        location_service.cache_service.get.assert_called_once()
        location_service.cache_service.set.assert_not_called()
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.get')
    async def test_search_locations_api_success(self, mock_get, location_service, mock_nominatim_response):
        """Test searching locations with successful API call."""
        # Mock cache to return None (no cached result)
        location_service.cache_service.get.return_value = None
        
        # Mock HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_nominatim_response
        mock_get.return_value = mock_response
        
        result = await location_service.search_locations("New York")
        
        assert len(result) == 1
        assert result[0]["name"] == "Test Location"
        assert result[0]["latitude"] == 40.7128
        assert result[0]["longitude"] == -74.0060
        
        # Verify cache was called
        location_service.cache_service.get.assert_called_once()
        location_service.cache_service.set.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.get')
    async def test_search_locations_api_error(self, mock_get, location_service):
        """Test searching locations with API error."""
        # Mock cache to return None
        location_service.cache_service.get.return_value = None
        
        # Mock HTTP error
        mock_get.side_effect = httpx.RequestError("Connection failed")
        
        result = await location_service.search_locations("New York")
        
        assert result == []
        location_service.cache_service.get.assert_called_once()
        location_service.cache_service.set.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_search_locations_invalid_coordinates(self, location_service):
        """Test searching locations with invalid coordinates."""
        result = await location_service.search_locations(None, 91, 0)  # Invalid latitude
        assert result == []
        
        result = await location_service.search_locations(None, 0, 181)  # Invalid longitude
        assert result == []
    
    @pytest.mark.asyncio
    async def test_search_locations_no_parameters(self, location_service):
        """Test searching locations with no parameters."""
        result = await location_service.search_locations(None, None, None)
        assert result == []