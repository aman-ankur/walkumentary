"""
Comprehensive tests for service modules.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
import uuid
from datetime import datetime, timezone

from services.ai_service import AIService
from services.location_service import LocationService
from services.cache_service import CacheService
from services.audio_service import AudioService


class TestAIService:
    """Test AI service functionality."""
    
    @pytest.fixture
    def ai_service(self, mock_openai_client, mock_anthropic_client):
        """Create AI service with mocked clients."""
        service = AIService()
        service.openai_client = mock_openai_client
        service.anthropic_client = mock_anthropic_client
        return service
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_openai(self, ai_service, mock_openai_client):
        """Test tour content generation with OpenAI."""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Generated tour content about the location."
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        content = await ai_service.generate_tour_content(
            location_name="Central Park",
            interests=["nature", "history"],
            duration_minutes=30,
            provider="openai"
        )
        
        assert content == "Generated tour content about the location."
        mock_openai_client.chat.completions.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_anthropic(self, ai_service, mock_anthropic_client):
        """Test tour content generation with Anthropic."""
        # Mock Anthropic response
        mock_response = Mock()
        mock_response.content = [Mock()]
        mock_response.content[0].text = "Generated tour content with Claude."
        mock_anthropic_client.messages.create.return_value = mock_response
        
        content = await ai_service.generate_tour_content(
            location_name="Museum of Art",
            interests=["art", "culture"],
            duration_minutes=45,
            provider="anthropic"
        )
        
        assert content == "Generated tour content with Claude."
        mock_anthropic_client.messages.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_fallback(self, ai_service, mock_openai_client, mock_anthropic_client):
        """Test fallback from OpenAI to Anthropic on failure."""
        # Mock OpenAI failure
        mock_openai_client.chat.completions.create.side_effect = Exception("OpenAI API error")
        
        # Mock Anthropic success
        mock_response = Mock()
        mock_response.content = [Mock()]
        mock_response.content[0].text = "Fallback content from Claude."
        mock_anthropic_client.messages.create.return_value = mock_response
        
        content = await ai_service.generate_tour_content(
            location_name="Liberty Statue",
            interests=["history"],
            duration_minutes=20,
            provider="openai"
        )
        
        assert content == "Fallback content from Claude."
        mock_openai_client.chat.completions.create.assert_called_once()
        mock_anthropic_client.messages.create.assert_called_once()
    
    def test_build_prompt(self, ai_service):
        """Test prompt building for tour generation."""
        prompt = ai_service._build_prompt(
            location_name="Eiffel Tower",
            interests=["history", "architecture"],
            duration_minutes=25,
            language="en",
            narrative_style="educational"
        )
        
        assert "Eiffel Tower" in prompt
        assert "history" in prompt
        assert "architecture" in prompt
        assert "25 minutes" in prompt
        assert "educational" in prompt


class TestLocationService:
    """Test location service functionality."""
    
    @pytest.fixture
    def location_service(self):
        """Create location service."""
        return LocationService()
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.get')
    async def test_search_locations(self, mock_get, location_service):
        """Test location search with Nominatim API."""
        # Mock Nominatim response
        mock_response = Mock()
        mock_response.json.return_value = [
            {
                "display_name": "Central Park, New York, NY, USA",
                "lat": "40.7829",
                "lon": "-73.9654",
                "type": "leisure",
                "importance": 0.8
            }
        ]
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        results = await location_service.search_locations("Central Park")
        
        assert len(results) == 1
        assert results[0]["name"] == "Central Park, New York, NY, USA"
        assert float(results[0]["latitude"]) == 40.7829
        assert float(results[0]["longitude"]) == -73.9654
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.get')
    async def test_find_nearby_locations(self, mock_get, location_service):
        """Test finding nearby locations."""
        # Mock Nominatim response
        mock_response = Mock()
        mock_response.json.return_value = [
            {
                "display_name": "Nearby Cafe",
                "lat": "40.7830",
                "lon": "-73.9650",
                "type": "amenity",
                "importance": 0.5
            }
        ]
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        results = await location_service.find_nearby_locations(40.7829, -73.9654, radius=1000)
        
        assert len(results) == 1
        assert results[0]["name"] == "Nearby Cafe"
    
    def test_calculate_distance(self, location_service):
        """Test distance calculation between coordinates."""
        # Distance between NYC and LA (approximately 2445 miles)
        distance = location_service.calculate_distance(
            40.7128, -74.0060,  # NYC
            34.0522, -118.2437  # LA
        )
        
        # Should be approximately 3945 km (within 100km tolerance)
        assert 3800 <= distance <= 4000
    
    def test_validate_coordinates(self, location_service):
        """Test coordinate validation."""
        # Valid coordinates
        assert location_service.validate_coordinates(40.7128, -74.0060) is True
        assert location_service.validate_coordinates(-90, -180) is True
        assert location_service.validate_coordinates(90, 180) is True
        
        # Invalid coordinates
        assert location_service.validate_coordinates(91, 0) is False
        assert location_service.validate_coordinates(0, 181) is False
        assert location_service.validate_coordinates(-91, 0) is False
        assert location_service.validate_coordinates(0, -181) is False


class TestCacheService:
    """Test cache service functionality."""
    
    @pytest.fixture
    def cache_service(self, mock_redis_client):
        """Create cache service with mocked Redis."""
        service = CacheService()
        service.redis_client = mock_redis_client
        return service
    
    @pytest.mark.asyncio
    async def test_get_cache_hit(self, cache_service, mock_redis_client):
        """Test cache hit scenario."""
        cached_data = {"result": "cached value"}
        mock_redis_client.get.return_value = json.dumps(cached_data)
        
        result = await cache_service.get("test:key")
        
        assert result == cached_data
        mock_redis_client.get.assert_called_once_with("test:key")
    
    @pytest.mark.asyncio
    async def test_get_cache_miss(self, cache_service, mock_redis_client):
        """Test cache miss scenario."""
        mock_redis_client.get.return_value = None
        
        result = await cache_service.get("missing:key")
        
        assert result is None
        mock_redis_client.get.assert_called_once_with("missing:key")
    
    @pytest.mark.asyncio
    async def test_set_cache(self, cache_service, mock_redis_client):
        """Test setting cache value."""
        data = {"result": "new value"}
        
        await cache_service.set("test:key", data, ttl=3600)
        
        mock_redis_client.set.assert_called_once_with(
            "test:key", 
            json.dumps(data), 
            ex=3600
        )
    
    @pytest.mark.asyncio
    async def test_delete_cache(self, cache_service, mock_redis_client):
        """Test deleting cache value."""
        mock_redis_client.delete.return_value = 1
        
        result = await cache_service.delete("test:key")
        
        assert result is True
        mock_redis_client.delete.assert_called_once_with("test:key")
    
    @pytest.mark.asyncio
    async def test_exists_cache(self, cache_service, mock_redis_client):
        """Test checking cache existence."""
        mock_redis_client.exists.return_value = 1
        
        result = await cache_service.exists("test:key")
        
        assert result is True
        mock_redis_client.exists.assert_called_once_with("test:key")
    
    def test_generate_cache_key(self, cache_service):
        """Test cache key generation."""
        key = cache_service.generate_cache_key("tour", "location_123", "interests_history")
        
        assert key.startswith("tour:")
        assert "location_123" in key
        assert "interests_history" in key
    
    @pytest.mark.asyncio
    async def test_get_or_set(self, cache_service, mock_redis_client):
        """Test get_or_set functionality."""
        # Mock cache miss, then successful set
        mock_redis_client.get.return_value = None
        
        async def fetch_data():
            return {"computed": "value"}
        
        result = await cache_service.get_or_set("test:key", fetch_data, ttl=3600)
        
        assert result == {"computed": "value"}
        mock_redis_client.get.assert_called_once_with("test:key")
        mock_redis_client.set.assert_called_once()


class TestAudioService:
    """Test audio service functionality."""
    
    @pytest.fixture
    def audio_service(self, mock_openai_client):
        """Create audio service with mocked OpenAI client."""
        service = AudioService()
        service.openai_client = mock_openai_client
        return service
    
    @pytest.mark.asyncio
    async def test_generate_audio(self, audio_service, mock_openai_client):
        """Test audio generation from text."""
        # Mock OpenAI TTS response
        mock_response = Mock()
        mock_response.content = b"fake_audio_data"
        mock_openai_client.audio.speech.create.return_value = mock_response
        
        audio_data = await audio_service.generate_audio(
            text="Hello, welcome to the tour!",
            voice="alloy"
        )
        
        assert audio_data == b"fake_audio_data"
        mock_openai_client.audio.speech.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_audio_chunked(self, audio_service, mock_openai_client):
        """Test audio generation with text chunking."""
        # Create long text that will be chunked
        long_text = "This is a very long text. " * 200  # > 4096 chars
        
        # Mock OpenAI TTS response
        mock_response = Mock()
        mock_response.content = b"audio_chunk"
        mock_openai_client.audio.speech.create.return_value = mock_response
        
        audio_data = await audio_service.generate_audio(long_text, voice="nova")
        
        # Should be called multiple times due to chunking
        assert mock_openai_client.audio.speech.create.call_count > 1
        assert len(audio_data) > 0
    
    def test_chunk_text(self, audio_service):
        """Test text chunking for audio generation."""
        long_text = "This is a test. " * 300  # > 4096 chars
        chunks = audio_service._chunk_text(long_text, max_length=4096)
        
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) <= 4096
            # Ensure chunks end at sentence boundaries when possible
            if len(chunk) < 4096:
                assert chunk.endswith('.') or chunk.endswith('!') or chunk.endswith('?')
    
    def test_estimate_duration(self, audio_service):
        """Test audio duration estimation."""
        text = "This is a sample text for duration estimation."
        duration = audio_service.estimate_duration(text)
        
        # Should be reasonable duration (around 3-4 seconds for this text)
        assert 2 <= duration <= 10
    
    @pytest.mark.asyncio
    async def test_generate_transcript(self, audio_service):
        """Test transcript generation from text."""
        text = "Welcome to Central Park. This beautiful park was established in 1857."
        
        transcript = await audio_service.generate_transcript(text)
        
        assert isinstance(transcript, list)
        assert len(transcript) > 0
        
        # Check transcript segment structure
        segment = transcript[0]
        assert "startTime" in segment
        assert "endTime" in segment
        assert "text" in segment
        assert segment["startTime"] >= 0
        assert segment["endTime"] > segment["startTime"]
    
    def test_supported_voices(self, audio_service):
        """Test supported voice list."""
        voices = audio_service.get_supported_voices()
        
        assert isinstance(voices, list)
        assert len(voices) > 0
        assert "alloy" in voices
        assert "nova" in voices
    
    def test_validate_voice(self, audio_service):
        """Test voice validation."""
        assert audio_service.validate_voice("alloy") is True
        assert audio_service.validate_voice("nova") is True
        assert audio_service.validate_voice("invalid_voice") is False