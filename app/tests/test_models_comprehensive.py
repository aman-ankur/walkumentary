"""
Comprehensive tests for database models.
"""
import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from app.models.user import User
from app.models.location import Location
from app.models.tour import Tour
from app.models.cache import CacheEntry


class TestUserModel:
    """Test User model functionality."""
    
    def test_user_creation(self, test_db_session, sample_user_data):
        """Test creating a new user."""
        user = User(**sample_user_data)
        test_db_session.add(user)
        test_db_session.commit()
        
        assert user.id is not None
        assert user.email == sample_user_data["email"]
        assert user.full_name == sample_user_data["full_name"]
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_user_preferences_default(self, test_db_session):
        """Test user preferences default values."""
        user = User(email="test@example.com")
        test_db_session.add(user)
        test_db_session.commit()
        
        assert user.interests == []
        assert user.language == "en"
        assert user.default_tour_duration == 30
    
    def test_user_preferences_custom(self, test_db_session):
        """Test custom user preferences."""
        preferences = {
            "interests": ["history", "culture"],
            "language": "es",
            "default_tour_duration": 45
        }
        user = User(email="test@example.com", preferences=preferences)
        test_db_session.add(user)
        test_db_session.commit()
        
        assert user.interests == ["history", "culture"]
        assert user.language == "es"
        assert user.default_tour_duration == 45
    
    def test_user_email_unique_constraint(self, test_db_session):
        """Test that user email must be unique."""
        user1 = User(email="test@example.com")
        user2 = User(email="test@example.com")
        
        test_db_session.add(user1)
        test_db_session.commit()
        
        test_db_session.add(user2)
        with pytest.raises(Exception):  # IntegrityError
            test_db_session.commit()


class TestLocationModel:
    """Test Location model functionality."""
    
    def test_location_creation(self, test_db_session, sample_location_data):
        """Test creating a new location."""
        location = Location(**sample_location_data)
        test_db_session.add(location)
        test_db_session.commit()
        
        assert location.id is not None
        assert location.name == sample_location_data["name"]
        assert location.latitude == Decimal(str(sample_location_data["latitude"]))
        assert location.longitude == Decimal(str(sample_location_data["longitude"]))
        assert location.created_at is not None
    
    def test_location_coordinates_property(self, test_db_session):
        """Test coordinates property returns tuple of floats."""
        location = Location(
            name="Test Location",
            latitude=Decimal("40.7128"),
            longitude=Decimal("-74.0060")
        )
        test_db_session.add(location)
        test_db_session.commit()
        
        coordinates = location.coordinates
        assert coordinates is not None
        assert isinstance(coordinates, tuple)
        assert len(coordinates) == 2
        assert coordinates[0] == 40.7128
        assert coordinates[1] == -74.0060
    
    def test_location_coordinates_none_when_missing(self, test_db_session):
        """Test coordinates property returns None when lat/lng missing."""
        location = Location(name="Test Location")
        test_db_session.add(location)
        test_db_session.commit()
        
        assert location.coordinates is None
    
    def test_location_metadata(self, test_db_session):
        """Test location metadata JSON field."""
        metadata = {
            "opening_hours": "9 AM - 5 PM",
            "website": "https://example.com",
            "phone": "+1-555-0123"
        }
        location = Location(
            name="Test Location",
            location_metadata=metadata
        )
        test_db_session.add(location)
        test_db_session.commit()
        
        assert location.location_metadata == metadata


class TestTourModel:
    """Test Tour model functionality."""
    
    def test_tour_creation(self, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test creating a new tour."""
        # Create dependencies
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        # Create tour
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        assert tour.id is not None
        assert tour.title == sample_tour_data["title"]
        assert tour.duration_minutes == sample_tour_data["duration_minutes"]
        assert tour.status == sample_tour_data["status"]
        assert tour.user_id == user.id
        assert tour.location_id == location.id
    
    def test_tour_relationships(self, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test tour relationships with user and location."""
        # Create dependencies
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        # Create tour
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        # Test relationships
        assert tour.user == user
        assert tour.location == location
        assert tour in user.tours
        assert tour in location.tours
    
    def test_tour_transcript_json(self, test_db_session, sample_user_data, sample_location_data):
        """Test tour transcript JSON field."""
        # Create dependencies
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        transcript = [
            {"startTime": 0, "endTime": 5, "text": "Welcome to the tour."},
            {"startTime": 5, "endTime": 10, "text": "Let's begin exploring."}
        ]
        
        tour = Tour(
            title="Test Tour",
            content="Test content",
            duration_minutes=15,
            transcript=transcript,
            user_id=user.id,
            location_id=location.id
        )
        test_db_session.add(tour)
        test_db_session.commit()
        
        assert tour.transcript == transcript
    
    def test_tour_default_values(self, test_db_session, sample_user_data, sample_location_data):
        """Test tour default values."""
        # Create dependencies
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        tour = Tour(
            title="Test Tour",
            content="Test content",
            duration_minutes=15,
            user_id=user.id,
            location_id=location.id
        )
        test_db_session.add(tour)
        test_db_session.commit()
        
        assert tour.status == "generating"
        assert tour.language == "en"
        assert tour.interests == []
        assert tour.generation_params == {}


class TestCacheEntryModel:
    """Test CacheEntry model functionality."""
    
    def test_cache_entry_creation(self, test_db_session):
        """Test creating a cache entry."""
        cache_entry = CacheEntry(
            cache_key="test:key:123",
            cache_value='{"data": "test"}',
            cache_type="json",
            ttl_seconds=3600
        )
        test_db_session.add(cache_entry)
        test_db_session.commit()
        
        assert cache_entry.id is not None
        assert cache_entry.cache_key == "test:key:123"
        assert cache_entry.cache_value == '{"data": "test"}'
        assert cache_entry.cache_type == "json"
        assert cache_entry.ttl_seconds == 3600
        assert cache_entry.hit_count == 0
    
    def test_cache_entry_unique_key_constraint(self, test_db_session):
        """Test that cache keys must be unique."""
        entry1 = CacheEntry(cache_key="duplicate:key", cache_value="value1")
        entry2 = CacheEntry(cache_key="duplicate:key", cache_value="value2")
        
        test_db_session.add(entry1)
        test_db_session.commit()
        
        test_db_session.add(entry2)
        with pytest.raises(Exception):  # IntegrityError
            test_db_session.commit()
    
    def test_cache_entry_default_type(self, test_db_session):
        """Test default cache type."""
        cache_entry = CacheEntry(
            cache_key="test:key",
            cache_value="test value"
        )
        test_db_session.add(cache_entry)
        test_db_session.commit()
        
        assert cache_entry.cache_type == "json"