"""
Simplified tests for AI service to ensure basic functionality works.
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock

from services.ai_service import AIService
from config import LLMProvider


class TestAIServiceBasic:
    """Basic test suite for AI service functionality"""
    
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance with mocked dependencies"""
        with patch('services.ai_service.cache_service') as mock_cache, \
             patch('services.ai_service.usage_tracker') as mock_tracker:
            
            service = AIService()
            service.cache = mock_cache
            service.usage_tracker = mock_tracker
            return service
    
    @pytest.fixture
    def sample_location(self):
        """Sample location data for testing"""
        return {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Eiffel Tower",
            "city": "Paris",
            "country": "France",
            "description": "Iconic iron tower in Paris",
            "metadata": {}
        }
    
    @pytest.fixture
    def sample_tour_content(self):
        """Sample tour content response"""
        return {
            "title": "Eiffel Tower: Symbol of Paris",
            "content": "Welcome to the Eiffel Tower, one of the most recognizable landmarks in the world..."
        }
    
    def test_ai_service_initialization(self):
        """Test that AI service initializes correctly"""
        with patch('services.ai_service.cache_service'), \
             patch('services.ai_service.usage_tracker'):
            service = AIService()
            assert service.default_provider == LLMProvider.OPENAI
            assert hasattr(service, 'openai_client')
            assert hasattr(service, 'anthropic_client')
    
    def test_create_content_cache_key(self, ai_service, sample_location):
        """Test cache key generation for content"""
        # Test deterministic cache key generation
        key1 = ai_service._create_content_cache_key(
            location=sample_location,
            interests=["history", "culture"],
            duration_minutes=30,
            language="en",
            provider=LLMProvider.OPENAI
        )
        
        key2 = ai_service._create_content_cache_key(
            location=sample_location,
            interests=["culture", "history"],  # Different order
            duration_minutes=30,
            language="en",
            provider=LLMProvider.OPENAI
        )
        
        # Should be the same (interests are sorted)
        assert key1 == key2
        
        # Different parameters should produce different keys
        key3 = ai_service._create_content_cache_key(
            location=sample_location,
            interests=["history", "culture"],
            duration_minutes=45,  # Different duration
            language="en",
            provider=LLMProvider.OPENAI
        )
        
        assert key1 != key3
    
    def test_create_audio_cache_key(self, ai_service):
        """Test cache key generation for audio"""
        key1 = ai_service._create_audio_cache_key("Hello world", "alloy", 1.0)
        key2 = ai_service._create_audio_cache_key("Hello world", "alloy", 1.0)
        key3 = ai_service._create_audio_cache_key("Hello world", "nova", 1.0)
        
        # Same parameters should produce same key
        assert key1 == key2
        
        # Different voice should produce different key
        assert key1 != key3
    
    def test_estimate_tokens(self, ai_service):
        """Test token estimation"""
        tour_data = {
            "title": "Test Tour",
            "content": "This is a test tour content with some text to estimate tokens."
        }
        
        tokens = ai_service._estimate_tokens(tour_data)
        
        # Should be roughly (title + content length) / 4
        expected = len(tour_data["title"] + tour_data["content"]) // 4
        assert abs(tokens - expected) <= 1  # Allow for small rounding differences
    
    def test_create_optimized_prompt(self, ai_service, sample_location):
        """Test optimized prompt creation"""
        prompt = ai_service._create_optimized_prompt(
            location=sample_location,
            interests=["history", "culture", "architecture", "art", "food"],  # 5 interests
            duration_minutes=45,
            language="fr"
        )
        
        # Should limit interests to 3
        assert "history,culture,architecture" in prompt
        assert "art" not in prompt
        assert "food" not in prompt
        
        # Should include location name
        assert sample_location["name"] in prompt
        
        # Should include duration
        assert "45" in prompt
        
        # Should include language
        assert "fr" in prompt
    
    def test_parse_tour_response_valid_json(self, ai_service, sample_tour_content):
        """Test parsing valid JSON response"""
        json_response = json.dumps(sample_tour_content)
        
        result = ai_service._parse_tour_response(json_response)
        
        assert result == sample_tour_content
    
    def test_parse_tour_response_invalid_json(self, ai_service):
        """Test parsing invalid JSON response"""
        invalid_response = "This is not JSON"
        
        with pytest.raises(ValueError) as exc_info:
            ai_service._parse_tour_response(invalid_response)
        
        assert "Could not parse valid JSON" in str(exc_info.value)
    
    def test_parse_tour_response_missing_fields(self, ai_service):
        """Test parsing JSON response with missing required fields"""
        incomplete_response = json.dumps({"title": "Test Title"})  # Missing "content"
        
        with pytest.raises(ValueError) as exc_info:
            ai_service._parse_tour_response(incomplete_response)
        
        assert "Missing required fields" in str(exc_info.value)