"""
AI Service for multi-LLM integration with cost optimization and fallback logic.
Supports OpenAI and Anthropic providers with aggressive caching and usage tracking.
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import aiohttp
import time

from .cache_service import cache_service
from .usage_tracker import usage_tracker
from app.config import settings, LLMProvider

logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Base exception for AI service errors"""
    pass

class AIProviderError(AIServiceError):
    """Raised when AI provider fails"""
    pass

class ContentGenerationError(AIServiceError):
    """Raised when content generation fails"""
    pass

class AIService:
    """
    Multi-LLM AI service with cost optimization and fallback logic.
    
    Features:
    - Multi-provider support (OpenAI, Anthropic)
    - Automatic fallback on failures
    - Aggressive caching to reduce costs
    - Usage tracking and cost monitoring
    - Token-optimized prompts
    """
    
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.cache = cache_service
        self.usage_tracker = usage_tracker
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
        
        # Provider configurations
        self.provider_configs = {
            LLMProvider.OPENAI: {
                "model": settings.OPENAI_MODEL,
                "max_tokens": 8000,  # Increased from 4000 to prevent truncation of 15+ minute tours
                "temperature": 0.7,
                "top_p": 0.9,
                "cost_per_1k_tokens": 0.000765,  # GPT-4o-mini average
            },
            LLMProvider.ANTHROPIC: {
                "model": settings.ANTHROPIC_MODEL,
                "max_tokens": 8000,  # Increased from 4000 to prevent truncation of 15+ minute tours
                "temperature": 0.7,
                "cost_per_1k_tokens": 0.001375,  # Claude Haiku average
            }
        }
    
    async def generate_tour_content(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str = "en",
        narration_style: str = "conversational",
        provider: Optional[LLMProvider] = None
    ) -> Dict[str, Any]:
        """
        Generate tour content with aggressive caching and multi-provider support.
        
        Args:
            location: Location data with id, name, city, country, etc.
            interests: List of user interests (max 5)
            duration_minutes: Tour duration (10-180 minutes)
            language: Language code (default: en)
            narration_style: Style of narration (default: conversational)
            provider: Preferred provider (optional)
            
        Returns:
            Dict with tour content, metadata, and generation info
        """
        provider = provider or self.default_provider
        
        # Create deterministic cache key
        cache_key = self._create_content_cache_key(
            location, interests, duration_minutes, language, narration_style, provider
        )
        
        # Try cache first
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            logger.info(f"Tour content cache hit for location {location['id']}")
            await self.usage_tracker.record_cache_hit("tour_content", provider)
            return cached_result
        
        # Generate new content with fallback logic
        try:
            content = await self._generate_tour_content_with_provider(
                location, interests, duration_minutes, language, narration_style, provider
            )
            
        except Exception as e:
            logger.warning(f"Primary provider {provider} failed: {str(e)}")
            
            # Try fallback provider
            fallback_provider = (
                LLMProvider.ANTHROPIC if provider == LLMProvider.OPENAI 
                else LLMProvider.OPENAI
            )
            
            try:
                content = await self._generate_tour_content_with_provider(
                    location, interests, duration_minutes, language, narration_style, fallback_provider
                )
                content["metadata"]["fallback_used"] = True
                content["metadata"]["original_provider"] = provider
                content["metadata"]["actual_provider"] = fallback_provider
                
            except Exception as fallback_error:
                logger.error(f"Both providers failed: {str(e)}, {str(fallback_error)}")
                raise ContentGenerationError(
                    f"Failed to generate content with both providers: "
                    f"{provider} ({str(e)}), {fallback_provider} ({str(fallback_error)})"
                )
        
        # Cache the result for 7 days
        await self.cache.set_json(cache_key, content, ttl=settings.CACHE_TTL_TOUR_CONTENT)
        
        # Track usage
        await self.usage_tracker.record_api_usage(
            "tour_content", 
            self._estimate_tokens(content), 
            content["metadata"]["actual_provider"]
        )
        
        return content
    
    async def _generate_tour_content_with_provider(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str,
        narration_style: str,
        provider: LLMProvider
    ) -> Dict[str, Any]:
        """Generate content using specific provider"""
        
        # Create token-optimized prompt
        prompt = self._create_optimized_prompt(location, interests, duration_minutes, language, narration_style)
        
        try:
            if provider == LLMProvider.OPENAI:
                content = await self._generate_with_openai(prompt)
            elif provider == LLMProvider.ANTHROPIC:
                content = await self._generate_with_anthropic(prompt)
            else:
                raise AIProviderError(f"Unsupported provider: {provider}")
            
            # Parse and validate response
            tour_data = self._parse_tour_response(content)
            
            # Add metadata
            tour_data["metadata"] = {
                "actual_provider": provider,
                "model": self.provider_configs[provider]["model"],
                "generation_timestamp": datetime.utcnow().isoformat(),
                "location_id": location["id"],
                "duration_minutes": duration_minutes,
                "interests": interests,
                "language": language,
                "narration_style": narration_style,
                "fallback_used": False,
            }
            
            return tour_data
            
        except Exception as e:
            raise AIProviderError(f"Provider {provider} failed: {str(e)}")
    
    async def _generate_with_openai(self, prompt: str) -> str:
        """Generate content using OpenAI"""
        config = self.provider_configs[LLMProvider.OPENAI]
        
        t0 = time.perf_counter()
        response = await self.openai_client.chat.completions.create(
            model=config["model"],
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert travel guide. Create engaging audio tour content. Return only valid JSON with 'title' and 'content' fields."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=config["max_tokens"],
            temperature=config["temperature"],
            top_p=config["top_p"],
        )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(f"LLM OpenAI latency {latency_ms} ms | model={config['model']}")
        
        return response.choices[0].message.content.strip()
    
    async def _generate_with_anthropic(self, prompt: str) -> str:
        """Generate content using Anthropic"""
        config = self.provider_configs[LLMProvider.ANTHROPIC]
        
        t0 = time.perf_counter()
        response = await self.anthropic_client.messages.create(
            model=config["model"],
            max_tokens=config["max_tokens"],
            temperature=config["temperature"],
            system="You are an expert travel guide. Create engaging audio tour content. Return only valid JSON with 'title' and 'content' fields.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(f"LLM Anthropic latency {latency_ms} ms | model={config['model']}")
        
        return response.content[0].text.strip()
    
    def _create_optimized_prompt(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str,
        narration_style: str
    ) -> str:
        """Create token-optimized prompt for walkable tour content generation"""
        
        # Limit interests to save tokens
        interests_text = ",".join(interests[:3]) if interests else "history,culture"
        
        # Enhanced prompt for walkable tours with structured stops
        prompt = f"""Create a {duration_minutes}-minute WALKING TOUR for {location['name']}, {location.get('city', '')}.

WALKING TOUR REQUIREMENTS:
- Generate 3-7 distinct stops within 1.5km radius that can be covered on foot
- Each stop should be 50-300 meters apart (comfortable walking distance)
- Include specific landmark names, street addresses, or clear location descriptions
- Create logical walking route with smooth transitions between stops
- Focus on: {interests_text}
- Language: {language}
- Style: {narration_style}

RESPONSE FORMAT - Return structured JSON:
{{
  "title": "Walking Tour Title",
  "content": "Complete {duration_minutes}-minute narration script with clear walking directions and stop transitions",
  "walkable_stops": [
    {{
      "name": "Stop Name",
      "description": "Brief description of what visitors will see",
      "approximate_address": "Street address, intersection, or landmark description",
      "walking_time_from_previous": "2 minutes",
      "content_duration": "3 minutes",
      "highlights": ["key feature 1", "architectural detail", "historical fact"]
    }}
  ],
  "total_walking_distance": "1.2 km",
  "estimated_walking_time": "15 minutes",
  "difficulty_level": "easy"
}}

CONTENT GUIDELINES:
- Include walking directions between stops ("Walk 2 minutes north along...")
- Mention specific architectural details, historical facts, cultural significance
- Use present tense as if user is standing at each location
- Clear audio cues for when to move to next stop ("Now let's walk to our next stop...")
- Ensure stops are genuinely walkable and form a logical route
- Each stop should have 2-4 minutes of interesting content"""
        
        return prompt
    
    def _parse_tour_response(self, content: str) -> Dict[str, Any]:
        """Parse and validate tour response"""
        try:
            # Try direct JSON parsing
            tour_data = json.loads(content)
            
            if not isinstance(tour_data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "title" not in tour_data or "content" not in tour_data:
                raise ValueError("Missing required fields: title, content")
            
            return tour_data
            
        except json.JSONDecodeError:
            # Fallback: extract JSON from markdown code blocks or text
            start = content.find('{')
            end = content.rfind('}') + 1
            
            if start != -1 and end > start:
                try:
                    tour_data = json.loads(content[start:end])
                    if isinstance(tour_data, dict) and "title" in tour_data and "content" in tour_data:
                        return tour_data
                except json.JSONDecodeError:
                    pass
            
            raise ValueError("Could not parse valid JSON from response")
    
    def _create_content_cache_key(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str,
        narration_style: str,
        provider: LLMProvider
    ) -> str:
        """Create deterministic cache key for content"""
        
        # Normalize interests for consistent caching
        interests_sorted = sorted(interests) if interests else []
        
        cache_data = {
            "location_id": str(location["id"]),
            "location_name": location["name"],
            "interests": interests_sorted,
            "duration": duration_minutes,
            "language": language,
            "narration_style": narration_style,
            "provider": provider,
        }
        
        # Create hash of cache data
        cache_str = json.dumps(cache_data, sort_keys=True)
        cache_hash = hashlib.md5(cache_str.encode()).hexdigest()
        
        return f"tour:content:{cache_hash}"
    
    def _estimate_tokens(self, tour_data: Dict[str, Any]) -> int:
        """Estimate token count for usage tracking"""
        content = tour_data.get("content", "")
        title = tour_data.get("title", "")
        
        # Rough estimation: 1 token ≈ 4 characters
        return len(content + title) // 4
    
    async def generate_audio(
        self,
        text: str,
        voice: str = None,
        speed: float = 1.0
    ) -> bytes:
        """
        Generate audio using OpenAI TTS with caching.
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (default from settings)
            speed: Speech speed (0.25-4.0)
            
        Returns:
            Audio data as bytes
        """
        voice = voice or settings.OPENAI_TTS_VOICE
        
        # Create cache key for audio
        cache_key = self._create_audio_cache_key(text, voice, speed)
        
        # Check cache first (audio is expensive to generate)
        cached_audio_b64 = await self.cache.get(cache_key)
        if cached_audio_b64:
            logger.info("Audio cache hit")
            await self.usage_tracker.record_cache_hit("audio_generation", LLMProvider.OPENAI)
            import base64
            return base64.b64decode(cached_audio_b64)
        
        try:
            import time
            t0 = time.perf_counter()
            response = await self.openai_client.audio.speech.create(
                model=settings.OPENAI_TTS_MODEL,
                voice=voice,
                input=text,
                speed=speed
            )
            
            latency_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(f"TTS latency {latency_ms} ms | model={settings.OPENAI_TTS_MODEL} | voice={voice}")
            
            audio_data = response.content
            
            # Cache audio for 30 days (expensive to regenerate)
            import base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            await self.cache.set(
                cache_key, 
                audio_b64,
                ttl=86400 * 30
            )
            
            # Track usage
            await self.usage_tracker.record_api_usage(
                "audio_generation",
                len(text),
                LLMProvider.OPENAI,
                len(text) * 0.015 / 1000  # TTS cost per 1k characters
            )
            
            return audio_data
            
        except Exception as e:
            logger.error(f"Audio generation failed: {str(e)}")
            raise AIServiceError(f"Failed to generate audio: {str(e)}")
    
    def _create_audio_cache_key(self, text: str, voice: str, speed: float) -> str:
        """Create cache key for audio generation"""
        cache_data = {
            "text_hash": hashlib.md5(text.encode()).hexdigest(),
            "voice": voice,
            "speed": speed,
            "model": settings.OPENAI_TTS_MODEL,
        }
        
        cache_str = json.dumps(cache_data, sort_keys=True)
        cache_hash = hashlib.md5(cache_str.encode()).hexdigest()
        
        return f"audio:tts:{cache_hash}"
    
    async def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        status = {}
        
        for provider in LLMProvider:
            try:
                if provider == LLMProvider.OPENAI:
                    # Test OpenAI with minimal request
                    await self.openai_client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": "test"}],
                        max_tokens=1
                    )
                    status[provider] = {"available": True, "error": None}
                    
                elif provider == LLMProvider.ANTHROPIC:
                    # Test Anthropic with minimal request
                    await self.anthropic_client.messages.create(
                        model="claude-3-haiku-20240307",
                        max_tokens=1,
                        messages=[{"role": "user", "content": "test"}]
                    )
                    status[provider] = {"available": True, "error": None}
                    
            except Exception as e:
                status[provider] = {"available": False, "error": str(e)}
        
        return status
    
    async def estimate_generation_cost(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str = "en",
        narration_style: str = "conversational",
        provider: Optional[LLMProvider] = None
    ) -> Dict[str, Any]:
        """Estimate cost for tour generation"""
        provider = provider or self.default_provider
        
        # Check if content is cached
        cache_key = self._create_content_cache_key(
            location, interests, duration_minutes, language, narration_style, provider
        )
        
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            return {
                "estimated_cost": 0.0,
                "cached": True,
                "provider": provider,
                "cache_hit": True
            }
        
        # Estimate tokens for generation
        prompt = self._create_optimized_prompt(location, interests, duration_minutes, language, narration_style)
        input_tokens = len(prompt) // 4  # Rough estimate
        output_tokens = duration_minutes * 50  # Estimate based on duration
        
        # Calculate cost
        config = self.provider_configs[provider]
        estimated_cost = (input_tokens + output_tokens) / 1000 * config["cost_per_1k_tokens"]
        
        return {
            "estimated_cost": round(estimated_cost, 4),
            "cached": False,
            "provider": provider,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cache_hit": False
        }

# Global AI service instance
ai_service = AIService()