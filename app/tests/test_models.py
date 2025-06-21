"""Tests for database models."""
import pytest
from datetime import datetime, timezone
import uuid
from sqlalchemy.exc import IntegrityError

from models.base import BaseModel
from models.user import User
from models.location import Location
from models.tour import Tour
from models.cache import CacheEntry


class TestBaseModel:
    """Test BaseModel functionality."""
    
    def test_base_model_creation(self, db_session):
        """Test basic model creation with auto-generated fields."""
        # Create a simple model using BaseModel
        user = User(email="test@example.com", full_name="Test User")
        db_session.add(user)
        db_session.commit()
        
        # Check auto-generated fields
        assert user.id is not None
        assert isinstance(user.id, str)
        assert len(user.id) == 36  # UUID length
        assert user.created_at is not None
        assert user.updated_at is not None
        assert user.created_at <= user.updated_at
    
    def test_base_model_update_timestamp(self, db_session):
        """Test that updated_at changes on model update."""
        user = User(email="test@example.com", full_name="Test User")
        db_session.add(user)
        db_session.commit()
        
        original_updated_at = user.updated_at
        
        # Update the user
        user.full_name = "Updated User"
        db_session.commit()
        
        # updated_at should change
        assert user.updated_at > original_updated_at


class TestUserModel:
    """Test User model functionality."""
    
    def test_user_creation_minimal(self, db_session):
        """Test creating user with minimal required fields."""
        user = User(email="test@example.com", full_name="Test User")
        db_session.add(user)
        db_session.commit()
        
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.preferences == {}
        assert user.is_active is True
        assert user.hashed_password is None
    
    def test_user_creation_full(self, db_session):
        """Test creating user with all fields."""
        preferences = {"theme": "dark", "language": "en", "notifications": True}
        user = User(
            email="full@example.com",
            full_name="Full User",
            hashed_password="hashed_password_123",
            preferences=preferences,
            is_active=False
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.email == "full@example.com"
        assert user.full_name == "Full User"
        assert user.hashed_password == "hashed_password_123"
        assert user.preferences == preferences
        assert user.is_active is False
    
    def test_user_email_unique_constraint(self, db_session):
        """Test that email must be unique."""
        user1 = User(email="unique@example.com", full_name="User 1")
        user2 = User(email="unique@example.com", full_name="User 2")
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_preferences_json_field(self, db_session):
        """Test JSON preferences field functionality."""
        complex_preferences = {
            "theme": "dark",
            "language": "en",
            "notifications": {
                "email": True,
                "push": False,
                "sms": True
            },
            "dashboard": {
                "layout": "grid",
                "items": ["weather", "calendar", "news"]
            }
        }
        
        user = User(
            email="json@example.com",
            full_name="JSON User",
            preferences=complex_preferences
        )
        db_session.add(user)
        db_session.commit()
        
        # Retrieve and verify JSON data
        retrieved_user = db_session.query(User).filter_by(email="json@example.com").first()
        assert retrieved_user.preferences == complex_preferences
        assert retrieved_user.preferences["notifications"]["email"] is True
    
    def test_user_string_representation(self, db_session):
        """Test user string representation."""
        user = User(email="repr@example.com", full_name="Repr User")
        expected = "<User(email='repr@example.com', full_name='Repr User')>"
        assert str(user) == expected


class TestLocationModel:
    """Test Location model functionality."""
    
    def test_location_creation_minimal(self, db_session):
        """Test creating location with minimal required fields."""
        location = Location(
            name="Test Location",
            latitude=40.7128,
            longitude=-74.0060
        )
        db_session.add(location)
        db_session.commit()
        
        assert location.name == "Test Location"
        assert location.latitude == 40.7128
        assert location.longitude == -74.0060
        assert location.address is None
        assert location.location_type is None
        assert location.metadata == {}
    
    def test_location_creation_full(self, db_session):
        """Test creating location with all fields."""
        metadata = {
            "cuisine": "italian",
            "rating": 4.5,
            "price_range": "$$",
            "features": ["outdoor_seating", "wifi", "parking"]
        }
        
        location = Location(
            name="Full Restaurant",
            latitude=40.7128,
            longitude=-74.0060,
            address="123 Main St, New York, NY 10001",
            location_type="restaurant",
            metadata=metadata
        )
        db_session.add(location)
        db_session.commit()
        
        assert location.name == "Full Restaurant"
        assert location.latitude == 40.7128
        assert location.longitude == -74.0060
        assert location.address == "123 Main St, New York, NY 10001"
        assert location.location_type == "restaurant"
        assert location.metadata == metadata
    
    def test_location_coordinates_precision(self, db_session):
        """Test that coordinates are stored with proper precision."""
        location = Location(
            name="Precise Location",
            latitude=40.712812345678,
            longitude=-74.006098765432
        )
        db_session.add(location)
        db_session.commit()
        
        # Check precision is maintained
        assert abs(location.latitude - 40.712812345678) < 0.000001
        assert abs(location.longitude - (-74.006098765432)) < 0.000001
    
    def test_location_metadata_json_field(self, db_session):
        """Test JSON metadata field functionality."""
        complex_metadata = {
            "business_info": {
                "hours": {
                    "monday": "9:00-22:00",
                    "tuesday": "9:00-22:00",
                    "closed": ["sunday"]
                },
                "contact": {
                    "phone": "+1-555-123-4567",
                    "website": "https://example.com"
                }
            },
            "amenities": ["wifi", "parking", "accessible"],
            "ratings": {
                "google": 4.5,
                "yelp": 4.2,
                "tripadvisor": 4.7
            }
        }
        
        location = Location(
            name="Complex Location",
            latitude=40.7128,
            longitude=-74.0060,
            metadata=complex_metadata
        )
        db_session.add(location)
        db_session.commit()
        
        # Retrieve and verify JSON data
        retrieved = db_session.query(Location).filter_by(name="Complex Location").first()
        assert retrieved.metadata == complex_metadata
        assert retrieved.metadata["business_info"]["hours"]["monday"] == "9:00-22:00"
    
    def test_location_string_representation(self, db_session):
        """Test location string representation."""
        location = Location(
            name="Repr Location",
            latitude=40.7128,
            longitude=-74.0060
        )
        expected = "<Location(name='Repr Location', lat=40.7128, lon=-74.006)>"
        assert str(location) == expected


class TestTourModel:
    """Test Tour model functionality."""
    
    def test_tour_creation_minimal(self, db_session, mock_user, mock_location):
        """Test creating tour with minimal required fields."""
        # Add dependencies
        db_session.add(mock_user)
        db_session.add(mock_location)
        db_session.commit()
        
        tour = Tour(
            title="Test Tour",
            user_id=mock_user.id,
            location_id=mock_location.id
        )
        db_session.add(tour)
        db_session.commit()
        
        assert tour.title == "Test Tour"
        assert tour.user_id == mock_user.id
        assert tour.location_id == mock_location.id
        assert tour.content is None
        assert tour.status == "draft"
        assert tour.generation_metadata == {}
    
    def test_tour_creation_full(self, db_session, mock_user, mock_location):
        """Test creating tour with all fields."""
        # Add dependencies
        db_session.add(mock_user)
        db_session.add(mock_location)
        db_session.commit()
        
        generation_metadata = {
            "ai_model": "gpt-4",
            "generation_time": "2023-10-01T12:00:00Z",
            "prompt_version": "1.2",
            "quality_score": 0.95
        }
        
        tour = Tour(
            title="Full Tour",
            content="This is a comprehensive tour content...",
            user_id=mock_user.id,
            location_id=mock_location.id,
            status="published",
            generation_metadata=generation_metadata
        )
        db_session.add(tour)
        db_session.commit()
        
        assert tour.title == "Full Tour"
        assert tour.content == "This is a comprehensive tour content..."
        assert tour.status == "published"
        assert tour.generation_metadata == generation_metadata
    
    def test_tour_status_values(self, db_session, mock_user, mock_location):
        """Test tour status field accepts valid values."""
        # Add dependencies
        db_session.add(mock_user)
        db_session.add(mock_location)
        db_session.commit()
        
        valid_statuses = ["draft", "published", "archived"]
        
        for status in valid_statuses:
            tour = Tour(
                title=f"Tour {status}",
                user_id=mock_user.id,
                location_id=mock_location.id,
                status=status
            )
            db_session.add(tour)
            db_session.commit()
            
            assert tour.status == status
    
    def test_tour_foreign_key_relationships(self, db_session, mock_user, mock_location):
        """Test tour foreign key relationships."""
        # Add dependencies
        db_session.add(mock_user)
        db_session.add(mock_location)
        db_session.commit()
        
        tour = Tour(
            title="Relationship Tour",
            user_id=mock_user.id,
            location_id=mock_location.id
        )
        db_session.add(tour)
        db_session.commit()
        
        # Test relationships work
        assert tour.user_id == mock_user.id
        assert tour.location_id == mock_location.id
    
    def test_tour_string_representation(self, db_session, mock_user, mock_location):
        """Test tour string representation."""
        # Add dependencies
        db_session.add(mock_user)
        db_session.add(mock_location)
        db_session.commit()
        
        tour = Tour(
            title="Repr Tour",
            user_id=mock_user.id,
            location_id=mock_location.id,
            status="published"
        )
        expected = "<Tour(title='Repr Tour', status='published')>"
        assert str(tour) == expected


class TestCacheEntryModel:
    """Test CacheEntry model functionality."""
    
    def test_cache_entry_creation(self, db_session):
        """Test creating cache entry."""
        expires_at = datetime.now(timezone.utc)
        
        entry = CacheEntry(
            key="test_key",
            value='{"data": "test_value"}',
            expires_at=expires_at
        )
        db_session.add(entry)
        db_session.commit()
        
        assert entry.key == "test_key"
        assert entry.value == '{"data": "test_value"}'
        assert entry.expires_at == expires_at
    
    def test_cache_entry_no_expiration(self, db_session):
        """Test creating cache entry without expiration."""
        entry = CacheEntry(
            key="permanent_key",
            value='{"data": "permanent_value"}'
        )
        db_session.add(entry)
        db_session.commit()
        
        assert entry.key == "permanent_key"
        assert entry.expires_at is None
    
    def test_cache_entry_key_unique_constraint(self, db_session):
        """Test that cache key must be unique."""
        entry1 = CacheEntry(key="unique_key", value='{"data": "value1"}')
        entry2 = CacheEntry(key="unique_key", value='{"data": "value2"}')
        
        db_session.add(entry1)
        db_session.commit()
        
        db_session.add(entry2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_cache_entry_large_value(self, db_session):
        """Test storing large JSON value."""
        large_value = '{"items": [' + ','.join([f'{{"id": {i}, "data": "{"x" * 100}"}}' for i in range(1000)]) + ']}'
        
        entry = CacheEntry(
            key="large_key",
            value=large_value
        )
        db_session.add(entry)
        db_session.commit()
        
        assert entry.value == large_value
        assert len(entry.value) > 100000  # Ensure it's actually large
    
    def test_cache_entry_string_representation(self, db_session):
        """Test cache entry string representation."""
        entry = CacheEntry(
            key="repr_key",
            value='{"data": "repr_value"}'
        )
        expected = "<CacheEntry(key='repr_key')>"
        assert str(entry) == expected