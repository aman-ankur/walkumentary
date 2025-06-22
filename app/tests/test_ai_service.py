"""
Comprehensive tests for AI service with mock API responses and fallback logic.
Tests multi-LLM integration, caching, usage tracking, and error handling.
"""

import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from services.ai_service import AIService, AIServiceError, AIProviderError, ContentGenerationError
from config import LLMProvider


class TestAIService:
    """Test suite for AI service functionality"""
    
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
    
    async def test_generate_tour_content_cache_hit(self, ai_service, sample_location, sample_tour_content):
        """Test tour content generation with cache hit"""
        # Setup cache hit
        ai_service.cache.get_json.return_value = sample_tour_content
        
        result = await ai_service.generate_tour_content(
            location=sample_location,
            interests=["history", "architecture"],
            duration_minutes=30,
            language="en"
        )
        
        assert result == sample_tour_content
        ai_service.usage_tracker.record_cache_hit.assert_called_once_with(
            "tour_content", LLMProvider.OPENAI
        )
        # Should not call AI API when cache hit
        assert not hasattr(ai_service, '_generate_tour_content_with_provider')
    
    async def test_generate_tour_content_openai_success(self, ai_service, sample_location, sample_tour_content):
        """Test successful tour content generation with OpenAI"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = json.dumps(sample_tour_content)
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response
            
            result = await ai_service.generate_tour_content(
                location=sample_location,
                interests=["history"],
                duration_minutes=30,
                language="en",
                provider=LLMProvider.OPENAI
            )
        
        # Verify result structure
        assert "title" in result
        assert "content" in result
        assert "metadata" in result
        assert result["metadata"]["actual_provider"] == LLMProvider.OPENAI
        
        # Verify caching
        ai_service.cache.set_json.assert_called_once()
        
        # Verify usage tracking
        ai_service.usage_tracker.record_api_usage.assert_called_once()
    
    async def test_generate_tour_content_anthropic_success(self, ai_service, sample_location, sample_tour_content):
        """Test successful tour content generation with Anthropic"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        # Mock Anthropic response
        mock_response = MagicMock()
        mock_response.content[0].text.strip.return_value = json.dumps(sample_tour_content)
        
        with patch.object(ai_service, 'anthropic_client') as mock_client:
            mock_client.messages.create.return_value = mock_response
            
            result = await ai_service.generate_tour_content(
                location=sample_location,
                interests=["culture"],
                duration_minutes=45,
                language="fr",
                provider=LLMProvider.ANTHROPIC
            )
        
        # Verify result structure
        assert "title" in result
        assert "content" in result
        assert "metadata" in result
        assert result["metadata"]["actual_provider"] == LLMProvider.ANTHROPIC
        assert result["metadata"]["model"] == "claude-3-haiku-20240307"
    
    async def test_generate_tour_content_fallback_logic(self, ai_service, sample_location, sample_tour_content):
        """Test fallback logic when primary provider fails"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        # Mock primary provider failure
        with patch.object(ai_service, 'openai_client') as mock_openai, \
             patch.object(ai_service, 'anthropic_client') as mock_anthropic:
            
            # OpenAI fails
            mock_openai.chat.completions.create.side_effect = Exception("OpenAI API error")
            
            # Anthropic succeeds
            mock_anthropic_response = MagicMock()
            mock_anthropic_response.content[0].text.strip.return_value = json.dumps(sample_tour_content)
            mock_anthropic.messages.create.return_value = mock_anthropic_response
            
            result = await ai_service.generate_tour_content(
                location=sample_location,
                interests=["history"],
                duration_minutes=30,
                language="en",
                provider=LLMProvider.OPENAI  # Primary provider
            )
        
        # Verify fallback was used
        assert result["metadata"]["fallback_used"] is True
        assert result["metadata"]["original_provider"] == LLMProvider.OPENAI
        assert result["metadata"]["actual_provider"] == LLMProvider.ANTHROPIC
    
    async def test_generate_tour_content_both_providers_fail(self, ai_service, sample_location):
        """Test error handling when both providers fail"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        with patch.object(ai_service, 'openai_client') as mock_openai, \
             patch.object(ai_service, 'anthropic_client') as mock_anthropic:
            
            # Both providers fail
            mock_openai.chat.completions.create.side_effect = Exception("OpenAI error")
            mock_anthropic.messages.create.side_effect = Exception("Anthropic error")
            
            with pytest.raises(ContentGenerationError) as exc_info:
                await ai_service.generate_tour_content(
                    location=sample_location,
                    interests=["history"],
                    duration_minutes=30,
                    language="en"
                )
            
            assert "Failed to generate content with both providers" in str(exc_info.value)
    
    async def test_generate_tour_content_invalid_json_response(self, ai_service, sample_location):
        """Test handling of invalid JSON responses"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        # Mock OpenAI with invalid JSON
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = "Invalid JSON content"
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response
            
            with pytest.raises(AIProviderError) as exc_info:
                await ai_service.generate_tour_content(
                    location=sample_location,
                    interests=["history"],
                    duration_minutes=30,
                    language="en",
                    provider=LLMProvider.OPENAI
                )
            
            assert "Provider openai failed" in str(exc_info.value)
    
    async def test_generate_tour_content_json_extraction_fallback(self, ai_service, sample_location, sample_tour_content):
        """Test JSON extraction from markdown-formatted response"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        # Mock response with JSON in markdown
        markdown_response = f"""
        Here's your tour content:
        
        ```json
        {json.dumps(sample_tour_content)}
        ```
        
        Enjoy your tour!
        """
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = markdown_response
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response
            
            result = await ai_service.generate_tour_content(
                location=sample_location,
                interests=["history"],
                duration_minutes=30,
                language="en",
                provider=LLMProvider.OPENAI
            )
        
        assert result["title"] == sample_tour_content["title"]
        assert result["content"] == sample_tour_content["content"]
    
    async def test_generate_audio_success(self, ai_service):
        """Test successful audio generation"""
        # Setup cache miss
        ai_service.cache.get.return_value = None
        
        # Mock OpenAI TTS response
        mock_response = MagicMock()
        mock_response.content = b"fake_audio_data"
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.audio.speech.create.return_value = mock_response
            
            result = await ai_service.generate_audio("Hello world", "alloy", 1.0)
        
        assert result == b"fake_audio_data"
        
        # Verify caching
        ai_service.cache.set.assert_called_once()
        
        # Verify usage tracking
        ai_service.usage_tracker.record_api_usage.assert_called_once()
    
    async def test_generate_audio_cache_hit(self, ai_service):
        """Test audio generation with cache hit"""
        # Setup cache hit
        cached_audio = "cached_audio_data"
        ai_service.cache.get.return_value = cached_audio
        
        result = await ai_service.generate_audio("Hello world")
        
        assert result == cached_audio.encode('latin-1')
        ai_service.usage_tracker.record_cache_hit.assert_called_once_with(
            "audio_generation", LLMProvider.OPENAI
        )
    
    async def test_generate_audio_failure(self, ai_service):
        """Test audio generation failure"""
        # Setup cache miss
        ai_service.cache.get.return_value = None
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.audio.speech.create.side_effect = Exception("TTS API error")
            
            with pytest.raises(AIServiceError) as exc_info:
                await ai_service.generate_audio("Hello world")
            
            assert "Failed to generate audio" in str(exc_info.value)
    
    async def test_create_content_cache_key(self, ai_service, sample_location):
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
    
    async def test_create_audio_cache_key(self, ai_service):
        """Test cache key generation for audio"""
        key1 = ai_service._create_audio_cache_key("Hello world", "alloy", 1.0)
        key2 = ai_service._create_audio_cache_key("Hello world", "alloy", 1.0)
        key3 = ai_service._create_audio_cache_key("Hello world", "nova", 1.0)
        
        # Same parameters should produce same key
        assert key1 == key2
        
        # Different voice should produce different key
        assert key1 != key3
    
    async def test_estimate_tokens(self, ai_service):
        """Test token estimation"""
        tour_data = {
            "title": "Test Tour",
            "content": "This is a test tour content with some text to estimate tokens."
        }
        
        tokens = ai_service._estimate_tokens(tour_data)
        
        # Should be roughly (title + content length) / 4
        expected = len(tour_data["title"] + tour_data["content"]) // 4
        assert abs(tokens - expected) <= 1  # Allow for small rounding differences
    
    async def test_get_provider_status_all_available(self, ai_service):
        """Test provider status when all providers are available"""
        with patch.object(ai_service, 'openai_client') as mock_openai, \
             patch.object(ai_service, 'anthropic_client') as mock_anthropic:
            
            # Mock successful responses
            mock_openai.chat.completions.create.return_value = MagicMock()
            mock_anthropic.messages.create.return_value = MagicMock()
            
            status = await ai_service.get_provider_status()
        
        assert status[LLMProvider.OPENAI]["available"] is True
        assert status[LLMProvider.ANTHROPIC]["available"] is True
        assert status[LLMProvider.OPENAI]["error"] is None
        assert status[LLMProvider.ANTHROPIC]["error"] is None
    
    async def test_get_provider_status_with_failures(self, ai_service):
        """Test provider status when some providers fail"""
        with patch.object(ai_service, 'openai_client') as mock_openai, \
             patch.object(ai_service, 'anthropic_client') as mock_anthropic:
            
            # OpenAI succeeds, Anthropic fails
            mock_openai.chat.completions.create.return_value = MagicMock()
            mock_anthropic.messages.create.side_effect = Exception("Anthropic error")
            
            status = await ai_service.get_provider_status()
        
        assert status[LLMProvider.OPENAI]["available"] is True
        assert status[LLMProvider.ANTHROPIC]["available"] is False
        assert "Anthropic error" in status[LLMProvider.ANTHROPIC]["error"]
    
    async def test_estimate_generation_cost_cached(self, ai_service, sample_location, sample_tour_content):
        """Test cost estimation for cached content"""
        # Setup cache hit
        ai_service.cache.get_json.return_value = sample_tour_content
        
        estimate = await ai_service.estimate_generation_cost(
            location=sample_location,
            interests=["history"],
            duration_minutes=30,
            language="en"
        )
        
        assert estimate["estimated_cost"] == 0.0
        assert estimate["cached"] is True
        assert estimate["cache_hit"] is True
    
    async def test_estimate_generation_cost_not_cached(self, ai_service, sample_location):
        """Test cost estimation for non-cached content"""
        # Setup cache miss
        ai_service.cache.get_json.return_value = None
        
        estimate = await ai_service.estimate_generation_cost(
            location=sample_location,
            interests=["history", "culture"],
            duration_minutes=60,
            language="en",
            provider=LLMProvider.OPENAI
        )
        
        assert estimate["estimated_cost"] > 0.0
        assert estimate["cached"] is False
        assert "input_tokens" in estimate
        assert "output_tokens" in estimate
        assert estimate["provider"] == LLMProvider.OPENAI
    
    async def test_create_optimized_prompt(self, ai_service, sample_location):
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
    
    async def test_parse_tour_response_valid_json(self, ai_service, sample_tour_content):
        """Test parsing valid JSON response"""
        json_response = json.dumps(sample_tour_content)
        
        result = ai_service._parse_tour_response(json_response)
        
        assert result == sample_tour_content
    
    async def test_parse_tour_response_invalid_json(self, ai_service):
        """Test parsing invalid JSON response"""
        invalid_response = "This is not JSON"
        
        with pytest.raises(ValueError) as exc_info:
            ai_service._parse_tour_response(invalid_response)
        
        assert "Could not parse valid JSON" in str(exc_info.value)
    
    async def test_parse_tour_response_missing_fields(self, ai_service):
        """Test parsing JSON response with missing required fields"""
        incomplete_response = json.dumps({"title": "Test Title"})  # Missing "content"
        
        with pytest.raises(ValueError) as exc_info:
            ai_service._parse_tour_response(incomplete_response)
        
        assert "Missing required fields" in str(exc_info.value)
    
    @pytest.mark.parametrize("interests,duration,language", [
        ([], 10, "en"),  # Minimum duration
        (["history"], 180, "es"),  # Maximum duration
        (["culture", "art"], 30, "zh"),  # Multiple interests
        (["very long interest name that might cause issues"], 60, "fr"),  # Long interest
    ])
    async def test_generate_tour_content_edge_cases(self, ai_service, sample_location, sample_tour_content, interests, duration, language):
        """Test tour generation with various edge cases"""
        # Setup cache miss and successful generation
        ai_service.cache.get_json.return_value = None
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content.strip.return_value = json.dumps(sample_tour_content)
        
        with patch.object(ai_service, 'openai_client') as mock_client:
            mock_client.chat.completions.create.return_value = mock_response
            
            result = await ai_service.generate_tour_content(
                location=sample_location,
                interests=interests,
                duration_minutes=duration,
                language=language,
                provider=LLMProvider.OPENAI
            )
        
        assert "title" in result
        assert "content" in result
        assert result["metadata"]["duration_minutes"] == duration
        assert result["metadata"]["interests"] == interests
        assert result["metadata"]["language"] == language