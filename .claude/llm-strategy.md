# Walkumentary - Cost-Optimized LLM Strategy
*Minimizing AI Costs While Maximizing Quality*

## 1. Executive Summary

This document outlines a comprehensive strategy to minimize LLM and AI service costs for Walkumentary while maintaining high-quality user experiences. Given the personal use nature and MVP focus, we target operational costs under $10/month.

### Key Cost-Saving Principles
- **Aggressive Caching:** Cache all AI-generated content for maximum reuse
- **Prompt Optimization:** Minimal token usage with maximum information density
- **Smart Model Selection:** Use cost-effective models without sacrificing quality
- **Usage Monitoring:** Real-time cost tracking and alerts
- **Batch Processing:** Group requests to reduce API overhead

## 2. Model Selection & Pricing Analysis

### 2.1 Multi-LLM Provider Costs (Current Pricing)

#### OpenAI Models
| Model | Input Cost (per 1K tokens) | Output Cost (per 1K tokens) | Use Case |
|-------|----------------------------|------------------------------|----------|
| GPT-4o-mini | $0.00015 | $0.0006 | Primary content generation |
| GPT-4o | $0.0025 | $0.01 | Complex reasoning (if needed) |
| GPT-4V | $0.01 | $0.03 | Image recognition |
| TTS-1 | $0.015 per 1K characters | - | Audio generation |
| TTS-1-HD | $0.03 per 1K characters | - | High-quality audio (premium) |

#### Anthropic Models
| Model | Input Cost (per 1K tokens) | Output Cost (per 1K tokens) | Use Case |
|-------|----------------------------|------------------------------|----------|
| Claude-3 Haiku | $0.00025 | $0.00125 | Fast, lightweight content |
| Claude-3 Sonnet | $0.003 | $0.015 | Balanced performance |
| Claude-3 Opus | $0.015 | $0.075 | Highest quality (premium) |

### 2.2 Recommended Multi-Provider Strategy

**Primary Content Generation (Configurable)**
- **Default: OpenAI GPT-4o-mini** - Best cost/performance ratio
- **Alternative: Anthropic Claude-3 Haiku** - Competitive pricing, good quality
- Cost comparison: GPT-4o-mini (~$0.000765/1K) vs Claude Haiku (~$0.001375/1K)
- Estimated monthly cost: $2-4 (OpenAI) or $3-5 (Anthropic)

**Image Recognition: Google Vision API**
- Cost: ~$0.0015 per image analysis
- Fallback: OpenAI GPT-4V for complex cases
- Estimated monthly cost: $0.50-1.00

**Text-to-Speech: OpenAI TTS-1**
- Cost: $0.015 per 1K characters
- Quality: Good for mobile audio consumption
- Estimated monthly cost: $1-2

**Provider Selection Strategy:**
- **Default Provider:** Configurable (OpenAI or Anthropic)
- **Automatic Fallback:** Switch providers on rate limits/errors
- **A/B Testing:** Compare quality and costs between providers
- **Cost Optimization:** Choose cheaper provider for bulk operations

**Total Estimated Monthly Cost: $3.50-8.00**

## 3. Caching Strategy

### 3.1 Multi-Layer Caching Architecture

```
User Request → Browser Cache → CDN Cache → Redis Cache → Database Cache → AI API
     ↑              ↑             ↑           ↑              ↑            ↑
   1 hour        24 hours      7 days    24 hours      30 days     Last resort
```

### 3.2 Cache Key Strategy

```python
# Content Generation Cache Keys
tour_content_key = f"tour:content:{location_id}:{interests_hash}:{duration}:{language}"
location_search_key = f"search:{query_hash}:{coordinates_hash}:{radius}"
image_recognition_key = f"image:{image_hash}:{timestamp_day}"
audio_generation_key = f"audio:{content_hash}:{voice}:{speed}"

# Cache TTL Strategy
CACHE_TTL = {
    "tour_content": 86400 * 7,      # 7 days (content rarely changes)
    "location_search": 86400 * 3,   # 3 days (locations are stable)
    "image_recognition": 86400,     # 1 day (reprocess daily for accuracy)
    "audio_files": 86400 * 30,      # 30 days (expensive to regenerate)
    "user_sessions": 3600,          # 1 hour (security)
}
```

### 3.3 Cache Implementation

```python
# services/optimized_ai_service.py
import hashlib
import json
from typing import Dict, List, Any, Optional
from enum import Enum

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

class OptimizedAIService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.cache = cache_service
        self.usage_tracker = UsageTracker()
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
    
    async def generate_tour_content_cached(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str = "en",
        provider: Optional[LLMProvider] = None
    ) -> Dict[str, str]:
        """Generate tour content with aggressive caching and multi-provider support"""
        
        provider = provider or self.default_provider
        
        # Create deterministic cache key including provider
        interests_sorted = sorted(interests) if interests else []
        cache_data = {
            "location_id": str(location["id"]),
            "location_name": location["name"],
            "interests": interests_sorted,
            "duration": duration_minutes,
            "language": language,
            "provider": provider
        }
        cache_key = f"tour:content:{hashlib.md5(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()}"
        
        # Try cache first
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            await self.usage_tracker.record_cache_hit("tour_content", provider)
            return cached_result
        
        # Generate new content with selected provider
        try:
            content = await self._generate_optimized_tour_content(
                location, interests_sorted, duration_minutes, language, provider
            )
        except Exception as e:
            # Fallback to alternative provider
            fallback_provider = LLMProvider.ANTHROPIC if provider == LLMProvider.OPENAI else LLMProvider.OPENAI
            content = await self._generate_optimized_tour_content(
                location, interests_sorted, duration_minutes, language, fallback_provider
            )
            content["metadata"]["fallback_used"] = True
            content["metadata"]["original_provider"] = provider
            content["metadata"]["fallback_provider"] = fallback_provider
        
        # Cache for 7 days
        await self.cache.set_json(cache_key, content, ttl=86400 * 7)
        await self.usage_tracker.record_api_usage("tour_content", len(json.dumps(content)), provider)
        
        return content
    
    async def _generate_optimized_tour_content(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str,
        provider: LLMProvider
    ) -> Dict[str, str]:
        """Generate content with token-optimized prompts for specified provider"""
        
        # Optimize prompt for minimal tokens
        interests_text = ",".join(interests[:3]) if interests else "history,culture"  # Limit interests
        
        # Ultra-concise prompt to minimize input tokens
        prompt = f"""Create {duration_minutes}min audio tour for {location['name']}, {location.get('city', '')}.
Focus: {interests_text}
Language: {language}

Return JSON:
{{"title": "engaging title", "content": "conversational {duration_minutes}-minute narration script with clear sections"}}

Requirements:
- Conversational audio style
- {duration_minutes} minutes of content
- Include fascinating facts and stories
- Clear section transitions"""
        
        try:
            if provider == LLMProvider.OPENAI:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",  # Most cost-effective
                    messages=[
                        {
                            "role": "system", 
                            "content": "Expert travel guide. Create engaging audio tour content. Return only valid JSON."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1500,  # Limit output tokens
                    temperature=0.7,
                    top_p=0.9,  # Reduce randomness for better caching
                )
                content = response.choices[0].message.content.strip()
                
            elif provider == LLMProvider.ANTHROPIC:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",  # Most cost-effective
                    max_tokens=1500,
                    temperature=0.7,
                    system="Expert travel guide. Create engaging audio tour content. Return only valid JSON.",
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                content = response.content[0].text.strip()
            
            # Parse and validate JSON
            try:
                tour_data = json.loads(content)
                if not isinstance(tour_data, dict) or "title" not in tour_data or "content" not in tour_data:
                    raise ValueError("Invalid JSON structure")
                
                # Add provider metadata
                tour_data["metadata"] = {
                    "provider": provider,
                    "model": "gpt-4o-mini" if provider == LLMProvider.OPENAI else "claude-3-haiku-20240307",
                    "generation_timestamp": datetime.utcnow().isoformat(),
                }
                
                return tour_data
            except json.JSONDecodeError:
                # Fallback: extract content between first { and last }
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end > start:
                    tour_data = json.loads(content[start:end])
                    return tour_data
                raise ValueError("Could not parse JSON response")
                
        except Exception as e:
            raise Exception(f"Tour generation failed with {provider}: {str(e)}")
```

## 4. Prompt Optimization

### 4.1 Token-Efficient Prompts

```python
# Before Optimization (High Token Count)
INEFFICIENT_PROMPT = """
You are a professional travel guide with extensive knowledge of world history, culture, and landmarks. 
I need you to create a comprehensive and engaging audio tour for tourists visiting a specific location. 
The tour should be informative, entertaining, and suitable for people of all ages and backgrounds.

Please create a detailed audio tour for {location_name} in {city}, {country}. The tour should focus on 
the following interests: {interests}. The duration should be approximately {duration} minutes.

Please structure the response as follows:
1. An engaging title for the tour
2. A comprehensive narration script that includes:
   - Historical background and context
   - Interesting facts and stories
   - Cultural significance
   - Architectural details (if applicable)
   - Local customs and traditions
   - Practical information for visitors

Please ensure the content is:
- Conversational and engaging for audio consumption
- Well-structured with clear transitions
- Appropriate for the specified duration
- Focused on the requested interests
- Written in {language}

Please format your response as a JSON object with 'title' and 'content' fields.
"""

# After Optimization (Low Token Count)  
OPTIMIZED_PROMPT = """Create {duration}min audio tour for {location}, {city}.
Focus: {interests}
Language: {language}

JSON format:
{"title": "tour title", "content": "conversational narration script"}

Include: history, facts, stories, clear transitions."""
```

### 4.2 Template-Based Content Generation

```python
# Pre-defined templates to reduce prompt complexity
TOUR_TEMPLATES = {
    "landmark": """
    Welcome to {name}! [INTRO]
    
    {name} stands as {description}. Built in {year}, this {type} represents {significance}. [HISTORY]
    
    {interesting_fact_1} [FACT1]
    
    As you look around, notice {architectural_detail}. {cultural_context} [DETAILS]
    
    {interesting_fact_2} [FACT2]
    
    Before you leave, {practical_tip}. [CONCLUSION]
    """,
    
    "museum": """
    You're now entering {name}, {description}. [INTRO]
    
    This {type} houses {collection_description}. {historical_context} [CONTEXT]
    
    {highlight_1} [HIGHLIGHT1]
    
    {highlight_2} [HIGHLIGHT2]
    
    {visitor_tip} [TIP]
    """
}

async def generate_from_template(location_type: str, data: Dict) -> str:
    """Generate content using templates to reduce AI usage"""
    template = TOUR_TEMPLATES.get(location_type, TOUR_TEMPLATES["landmark"])
    
    # Fill template with location data
    return template.format(**data)
```

## 5. Usage Monitoring & Cost Control

### 5.1 Real-Time Usage Tracking

```python
# services/usage_tracker.py
from datetime import datetime, timedelta
import json

class UsageTracker:
    def __init__(self):
        self.cache = cache_service
        self.daily_limit = 1000  # tokens per day
        self.monthly_budget = 10.00  # USD
    
    async def record_api_usage(self, service: str, tokens_used: int, cost: float = None):
        """Record API usage with cost tracking"""
        today = datetime.now().strftime("%Y-%m-%d")
        month = datetime.now().strftime("%Y-%m")
        
        # Daily usage
        daily_key = f"usage:daily:{today}"
        daily_usage = await self.cache.get_json(daily_key) or {"tokens": 0, "cost": 0, "requests": 0}
        daily_usage["tokens"] += tokens_used
        daily_usage["cost"] += cost or self._estimate_cost(service, tokens_used)
        daily_usage["requests"] += 1
        await self.cache.set_json(daily_key, daily_usage, ttl=86400 * 2)
        
        # Monthly usage
        monthly_key = f"usage:monthly:{month}"
        monthly_usage = await self.cache.get_json(monthly_key) or {"tokens": 0, "cost": 0, "requests": 0}
        monthly_usage["tokens"] += tokens_used
        monthly_usage["cost"] += cost or self._estimate_cost(service, tokens_used)
        monthly_usage["requests"] += 1
        await self.cache.set_json(monthly_key, monthly_usage, ttl=86400 * 35)
        
        # Check limits
        await self._check_usage_limits(daily_usage, monthly_usage)
    
    async def record_cache_hit(self, service: str):
        """Record successful cache hits to track savings"""
        today = datetime.now().strftime("%Y-%m-%d")
        cache_key = f"cache_hits:{today}"
        hits = await self.cache.get(cache_key) or "0"
        await self.cache.set(cache_key, str(int(hits) + 1), ttl=86400 * 2)
    
    def _estimate_cost(self, service: str, tokens_used: int) -> float:
        """Estimate cost based on service and token usage"""
        costs = {
            "tour_content": 0.000765,  # GPT-4o-mini avg cost per 1k tokens
            "image_recognition": 0.04,  # Per image
            "audio_generation": 0.015,  # Per 1k characters
        }
        
        if service in costs:
            if service == "image_recognition":
                return costs[service]
            else:
                return (tokens_used / 1000) * costs[service]
        return 0
    
    async def _check_usage_limits(self, daily_usage: Dict, monthly_usage: Dict):
        """Check usage limits and alert if exceeded"""
        if monthly_usage["cost"] > self.monthly_budget * 0.8:  # 80% of budget
            await self._send_usage_alert("monthly", monthly_usage["cost"])
        
        if daily_usage["tokens"] > self.daily_limit * 0.9:  # 90% of daily limit
            await self._send_usage_alert("daily", daily_usage["tokens"])
    
    async def get_usage_summary(self) -> Dict:
        """Get current usage summary"""
        today = datetime.now().strftime("%Y-%m-%d")
        month = datetime.now().strftime("%Y-%m")
        
        daily_usage = await self.cache.get_json(f"usage:daily:{today}") or {}
        monthly_usage = await self.cache.get_json(f"usage:monthly:{month}") or {}
        cache_hits = await self.cache.get(f"cache_hits:{today}") or "0"
        
        return {
            "daily": daily_usage,
            "monthly": monthly_usage,
            "cache_hits_today": int(cache_hits),
            "estimated_monthly_cost": monthly_usage.get("cost", 0),
            "budget_remaining": self.monthly_budget - monthly_usage.get("cost", 0)
        }

usage_tracker = UsageTracker()
```

### 5.2 Cost Monitoring Dashboard

```typescript
// components/CostMonitoringDashboard.tsx (Admin/Debug Component)
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface UsageSummary {
  daily: { tokens: number; cost: number; requests: number };
  monthly: { tokens: number; cost: number; requests: number };
  cache_hits_today: number;
  estimated_monthly_cost: number;
  budget_remaining: number;
}

export function CostMonitoringDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/admin/usage');
        const data = await response.json();
        setUsage(data);
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  if (!usage) return <div>Loading usage data...</div>;
  
  const budgetUsed = ((10 - usage.budget_remaining) / 10) * 100;
  const cacheHitRate = usage.cache_hits_today / (usage.daily.requests + usage.cache_hits_today) * 100;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${usage.estimated_monthly_cost.toFixed(2)}</div>
          <Progress value={budgetUsed} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            ${usage.budget_remaining.toFixed(2)} remaining
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cacheHitRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {usage.cache_hits_today} hits today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.daily.requests}</div>
          <p className="text-xs text-muted-foreground">
            ${usage.daily.cost.toFixed(3)} cost
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.monthly.requests}</div>
          <p className="text-xs text-muted-foreground">
            {usage.monthly.tokens.toLocaleString()} tokens
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 6. Alternative Cost-Reduction Strategies

### 6.1 Local Content Database

```python
# Build local database of common locations to reduce API calls
PREDEFINED_LOCATIONS = {
    "table_mountain_cape_town": {
        "title": "Table Mountain: Cape Town's Crown Jewel",
        "content": "Welcome to Table Mountain, one of the New Seven Wonders of Nature...",
        "interests": ["nature", "history", "adventure"],
        "duration": 30
    },
    "eiffel_tower_paris": {
        "title": "The Eiffel Tower: Iron Lady of Paris", 
        "content": "Standing before the iconic Eiffel Tower...",
        "interests": ["architecture", "history", "culture"],
        "duration": 30
    }
}

async def get_predefined_content(location_name: str, interests: List[str]) -> Optional[Dict]:
    """Check if we have predefined content for this location"""
    location_key = location_name.lower().replace(" ", "_").replace(",", "")
    
    if location_key in PREDEFINED_LOCATIONS:
        content = PREDEFINED_LOCATIONS[location_key].copy()
        
        # Check if interests match (allow partial matches)
        predefined_interests = set(content["interests"])
        user_interests = set(interests)
        
        if predefined_interests.intersection(user_interests) or not interests:
            return content
    
    return None
```

### 6.2 Progressive Content Loading

```python
# Load basic content first, then enhance on demand
async def generate_progressive_content(location: Dict, interests: List[str]) -> Dict:
    """Generate content progressively to manage costs"""
    
    # Phase 1: Basic content (minimal tokens)
    basic_content = await generate_basic_tour_overview(location)
    
    # Phase 2: Enhanced content only if user engages
    # This would be triggered by user actions like "Tell me more"
    
    return {
        "basic": basic_content,
        "enhanced_available": True,
        "enhancement_cost": 0.02  # Estimated cost for full content
    }
```

## 7. Service Cost Comparison

### 7.1 Image Recognition Alternatives

| Service | Cost per Image | Accuracy | Speed | Recommendation |
|---------|----------------|----------|-------|----------------|
| Google Vision API | $0.0015 | 95% | Fast | ✅ Recommended |
| OpenAI GPT-4V | $0.04 | 98% | Medium | Use for complex cases |
| AWS Rekognition | $0.001 | 90% | Fast | Budget alternative |
| Azure Computer Vision | $0.002 | 93% | Fast | Good balance |

### 7.2 Text-to-Speech Alternatives

| Service | Cost per 1K chars | Quality | Voices | Recommendation |
|---------|-------------------|---------|--------|----------------|
| OpenAI TTS-1 | $0.015 | Good | 6 voices | ✅ Recommended |
| Google Cloud TTS | $0.016 | Excellent | 200+ voices | Premium option |
| AWS Polly | $0.004 | Good | 60+ voices | Budget option |
| ElevenLabs | $0.30 | Excellent | Custom | Too expensive |

## 8. Implementation Roadmap

### Phase 1: Core Cost Optimization (Week 1)
- Implement multi-layer caching
- Deploy usage tracking
- Optimize prompts for GPT-4o-mini
- Set up Google Vision API for image recognition

### Phase 2: Advanced Optimization (Week 2)
- Build predefined content database
- Implement progressive content loading
- Add cost monitoring dashboard
- Create usage alerts

### Phase 3: Fine-tuning (Week 3)
- Analyze usage patterns
- Optimize cache TTL based on real data
- Implement service degradation for cost control
- A/B test different prompt strategies

## 9. Expected Cost Breakdown (Monthly)

**Base Scenario (Personal Use):**
- Tour Content Generation: $2.50
- Image Recognition: $0.75
- Text-to-Speech: $1.25
- Caching Infrastructure: $0.50
- **Total: ~$5.00/month**

**Heavy Usage Scenario:**
- Tour Content Generation: $4.00
- Image Recognition: $1.50
- Text-to-Speech: $2.50
- Caching Infrastructure: $1.00
- **Total: ~$9.00/month**

**Cost Savings from Optimization:**
- Without caching: ~$25/month
- With caching: ~$5-9/month
- **Savings: 70-80%**

This strategy ensures Walkumentary remains cost-effective while delivering high-quality AI-powered experiences.