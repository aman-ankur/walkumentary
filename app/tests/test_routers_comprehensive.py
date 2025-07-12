"""
Comprehensive tests for API routers.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
import uuid
from fastapi.testclient import TestClient

from models.user import User
from models.location import Location
from models.tour import Tour


class TestAuthRouter:
    """Test authentication router endpoints."""
    
    def test_auth_callback_success(self, test_client):
        """Test successful authentication callback."""
        with patch('routers.auth.supabase') as mock_supabase:
            # Mock successful auth
            mock_supabase.auth.exchange_code_for_session.return_value = {
                "access_token": "mock_token",
                "user": {
                    "id": "user_123",
                    "email": "test@example.com",
                    "user_metadata": {"full_name": "Test User"}
                }
            }
            
            response = test_client.post("/auth/callback", json={"code": "auth_code"})
            
            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "mock_token"
            assert data["user"]["email"] == "test@example.com"
    
    def test_auth_callback_invalid_code(self, test_client):
        """Test authentication callback with invalid code."""
        with patch('routers.auth.supabase') as mock_supabase:
            # Mock auth failure
            mock_supabase.auth.exchange_code_for_session.side_effect = Exception("Invalid code")
            
            response = test_client.post("/auth/callback", json={"code": "invalid_code"})
            
            assert response.status_code == 400
    
    def test_logout(self, test_client):
        """Test user logout."""
        with patch('routers.auth.supabase') as mock_supabase:
            mock_supabase.auth.sign_out.return_value = {"error": None}
            
            response = test_client.post("/auth/logout")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Logged out successfully"


class TestLocationRouter:
    """Test location router endpoints."""
    
    def test_search_locations(self, test_client):
        """Test location search endpoint."""
        with patch('routers.locations.LocationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.search_locations = AsyncMock(return_value=[
                {
                    "name": "Central Park",
                    "latitude": 40.7829,
                    "longitude": -73.9654,
                    "location_type": "park"
                }
            ])
            
            response = test_client.get("/locations/search?q=Central Park")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Central Park"
    
    def test_search_locations_empty_query(self, test_client):
        """Test location search with empty query."""
        response = test_client.get("/locations/search?q=")
        
        assert response.status_code == 422  # Validation error
    
    def test_detect_location(self, test_client):
        """Test GPS location detection endpoint."""
        with patch('routers.locations.LocationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.find_nearby_locations = AsyncMock(return_value=[
                {
                    "name": "Nearby Landmark",
                    "latitude": 40.7829,
                    "longitude": -73.9654,
                    "distance": 150
                }
            ])
            
            response = test_client.post("/locations/detect", json={
                "latitude": 40.7829,
                "longitude": -73.9654
            })
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Nearby Landmark"
    
    def test_detect_location_invalid_coordinates(self, test_client):
        """Test location detection with invalid coordinates."""
        response = test_client.post("/locations/detect", json={
            "latitude": 91.0,  # Invalid latitude
            "longitude": -73.9654
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_recognize_image_placeholder(self, test_client):
        """Test image recognition endpoint (placeholder)."""
        # Create a mock image file
        with patch('routers.locations.recognize_location_from_image') as mock_recognize:
            mock_recognize.return_value = {
                "location": "Recognized Landmark",
                "confidence": 0.85,
                "coordinates": [40.7829, -73.9654]
            }
            
            # Simulate file upload
            files = {"image": ("test.jpg", b"fake_image_data", "image/jpeg")}
            response = test_client.post("/locations/recognize", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data["location"] == "Recognized Landmark"
            assert data["confidence"] == 0.85


class TestTourRouter:
    """Test tour router endpoints."""
    
    def test_generate_tour(self, test_client, test_db_session, sample_user_data, sample_location_data):
        """Test tour generation endpoint."""
        # Create user and location
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        with patch('routers.tours.AIService') as mock_ai_service:
            mock_instance = mock_ai_service.return_value
            mock_instance.generate_tour_content = AsyncMock(return_value="Generated tour content")
            
            with patch('routers.tours.get_current_user') as mock_get_user:
                mock_get_user.return_value = user
                
                response = test_client.post("/tours/generate", json={
                    "location_id": str(location.id),
                    "interests": ["history", "culture"],
                    "duration_minutes": 30,
                    "language": "en",
                    "narrative_style": "educational",
                    "pace": "moderate",
                    "voice_id": "alloy"
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["title"] is not None
                assert data["status"] == "generating"
                assert data["location_id"] == str(location.id)
    
    def test_get_user_tours(self, test_client, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test getting user's tours."""
        # Create user, location, and tour
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        with patch('routers.tours.get_current_user') as mock_get_user:
            mock_get_user.return_value = user
            
            response = test_client.get("/tours/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["title"] == sample_tour_data["title"]
    
    def test_get_tour_by_id(self, test_client, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test getting specific tour by ID."""
        # Create user, location, and tour
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        with patch('routers.tours.get_current_user') as mock_get_user:
            mock_get_user.return_value = user
            
            response = test_client.get(f"/tours/{tour.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == sample_tour_data["title"]
            assert data["id"] == str(tour.id)
    
    def test_get_tour_not_found(self, test_client):
        """Test getting non-existent tour."""
        with patch('routers.tours.get_current_user') as mock_get_user:
            mock_get_user.return_value = Mock(id=uuid.uuid4())
            
            fake_id = str(uuid.uuid4())
            response = test_client.get(f"/tours/{fake_id}")
            
            assert response.status_code == 404
    
    def test_delete_tour(self, test_client, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test deleting a tour."""
        # Create user, location, and tour
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        with patch('routers.tours.get_current_user') as mock_get_user:
            mock_get_user.return_value = user
            
            response = test_client.delete(f"/tours/{tour.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Tour deleted successfully"
    
    def test_generate_audio(self, test_client):
        """Test audio generation endpoint."""
        with patch('routers.tours.AudioService') as mock_audio_service:
            mock_instance = mock_audio_service.return_value
            mock_instance.generate_audio = AsyncMock(return_value=b"fake_audio_data")
            
            response = test_client.post("/tours/generate-audio", json={
                "text": "Welcome to the tour!",
                "voice_id": "alloy"
            })
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/mpeg"
    
    def test_regenerate_audio(self, test_client, test_db_session, sample_user_data, sample_location_data, sample_tour_data):
        """Test audio regeneration for existing tour."""
        # Create user, location, and tour
        user = User(**sample_user_data)
        location = Location(**sample_location_data)
        test_db_session.add(user)
        test_db_session.add(location)
        test_db_session.commit()
        
        tour_data = sample_tour_data.copy()
        tour_data["user_id"] = user.id
        tour_data["location_id"] = location.id
        tour = Tour(**tour_data)
        test_db_session.add(tour)
        test_db_session.commit()
        
        with patch('routers.tours.get_current_user') as mock_get_user:
            mock_get_user.return_value = user
            
            with patch('routers.tours.AudioService') as mock_audio_service:
                mock_instance = mock_audio_service.return_value
                mock_instance.generate_audio = AsyncMock(return_value=b"regenerated_audio")
                
                response = test_client.post(f"/tours/{tour.id}/regenerate-audio")
                
                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "Audio regenerated successfully"


class TestHealthRouter:
    """Test health check router."""
    
    def test_health_check(self, test_client):
        """Test health check endpoint."""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    def test_ready_check(self, test_client):
        """Test readiness check endpoint."""
        with patch('routers.health.check_database_connection') as mock_db_check:
            with patch('routers.health.check_redis_connection') as mock_redis_check:
                mock_db_check.return_value = True
                mock_redis_check.return_value = True
                
                response = test_client.get("/ready")
                
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "ready"
                assert data["database"] is True
                assert data["redis"] is True