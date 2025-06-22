"""
Usage tracking service for monitoring AI costs and API limits.
Tracks usage across different services and providers with alerts and reporting.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum

from config import settings, LLMProvider
from services.cache_service import cache_service

logger = logging.getLogger(__name__)

class UsageType(str, Enum):
    TOUR_CONTENT = "tour_content"
    AUDIO_GENERATION = "audio_generation"
    IMAGE_RECOGNITION = "image_recognition"
    LOCATION_SEARCH = "location_search"

class UsageTracker:
    """
    Tracks API usage, costs, and provides monitoring and alerting.
    
    Features:
    - Real-time usage tracking
    - Cost monitoring and budgeting
    - Cache hit rate tracking
    - Usage alerts and limits
    - Daily/monthly reporting
    """
    
    def __init__(self):
        self.cache = cache_service
        
        # Budget and limits
        self.monthly_budget = 10.00  # USD
        self.daily_token_limit = 10000  # tokens per day
        self.hourly_request_limit = 100  # requests per hour
        
        # Cost per service (USD)
        self.service_costs = {
            UsageType.TOUR_CONTENT: {
                LLMProvider.OPENAI: 0.000765,  # per 1k tokens
                LLMProvider.ANTHROPIC: 0.001375,  # per 1k tokens
            },
            UsageType.AUDIO_GENERATION: {
                LLMProvider.OPENAI: 0.015,  # per 1k characters
            },
            UsageType.IMAGE_RECOGNITION: {
                "google": 0.0015,  # per image
                LLMProvider.OPENAI: 0.04,  # per image
            },
            UsageType.LOCATION_SEARCH: {
                "nominatim": 0.0,  # free
            }
        }
    
    async def record_api_usage(
        self,
        service: UsageType,
        units_used: int,  # tokens, characters, or images
        provider: LLMProvider,
        cost: Optional[float] = None
    ) -> None:
        """
        Record API usage with automatic cost calculation.
        
        Args:
            service: Type of service used
            units_used: Number of units (tokens, characters, images)
            provider: AI provider used
            cost: Actual cost (optional, will be estimated if not provided)
        """
        try:
            # Calculate cost if not provided
            if cost is None:
                cost = self._calculate_cost(service, units_used, provider)
            
            # Get current time keys
            now = datetime.utcnow()
            today = now.strftime("%Y-%m-%d")
            month = now.strftime("%Y-%m")
            hour = now.strftime("%Y-%m-%d:%H")
            
            # Update daily usage
            await self._update_usage_counter(
                f"usage:daily:{today}",
                service, provider, units_used, cost, 86400 * 2
            )
            
            # Update monthly usage
            await self._update_usage_counter(
                f"usage:monthly:{month}",
                service, provider, units_used, cost, 86400 * 35
            )
            
            # Update hourly usage (for rate limiting)
            await self._update_usage_counter(
                f"usage:hourly:{hour}",
                service, provider, units_used, cost, 3600 * 2
            )
            
            # Check limits and send alerts if needed
            await self._check_usage_limits(today, month, hour)
            
            logger.info(
                f"Usage recorded: {service} via {provider}, "
                f"{units_used} units, ${cost:.4f}"
            )
            
        except Exception as e:
            logger.error(f"Failed to record usage: {str(e)}")
    
    async def record_cache_hit(
        self,
        service: UsageType,
        provider: LLMProvider
    ) -> None:
        """Record a cache hit (cost savings)"""
        try:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            cache_key = f"cache_hits:{today}"
            
            # Get current cache hits
            cache_data = await self.cache.get_json(cache_key) or {}
            
            # Initialize service data if not exists
            if service not in cache_data:
                cache_data[service] = {}
            if provider not in cache_data[service]:
                cache_data[service][provider] = 0
            
            # Increment cache hit count
            cache_data[service][provider] += 1
            
            # Store updated data
            await self.cache.set_json(cache_key, cache_data, ttl=86400 * 2)
            
            logger.debug(f"Cache hit recorded: {service} via {provider}")
            
        except Exception as e:
            logger.error(f"Failed to record cache hit: {str(e)}")
    
    async def _update_usage_counter(
        self,
        key: str,
        service: UsageType,
        provider: LLMProvider,
        units_used: int,
        cost: float,
        ttl: int
    ) -> None:
        """Update usage counter for a specific time period"""
        
        # Get current usage data
        usage_data = await self.cache.get_json(key) or {
            "total_requests": 0,
            "total_units": 0,
            "total_cost": 0.0,
            "services": {},
            "providers": {}
        }
        
        # Update totals
        usage_data["total_requests"] += 1
        usage_data["total_units"] += units_used
        usage_data["total_cost"] += cost
        
        # Update service breakdown
        if service not in usage_data["services"]:
            usage_data["services"][service] = {
                "requests": 0,
                "units": 0,
                "cost": 0.0
            }
        
        usage_data["services"][service]["requests"] += 1
        usage_data["services"][service]["units"] += units_used
        usage_data["services"][service]["cost"] += cost
        
        # Update provider breakdown
        if provider not in usage_data["providers"]:
            usage_data["providers"][provider] = {
                "requests": 0,
                "units": 0,
                "cost": 0.0
            }
        
        usage_data["providers"][provider]["requests"] += 1
        usage_data["providers"][provider]["units"] += units_used
        usage_data["providers"][provider]["cost"] += cost
        
        # Store updated data
        await self.cache.set_json(key, usage_data, ttl=ttl)
    
    def _calculate_cost(
        self,
        service: UsageType,
        units_used: int,
        provider: LLMProvider
    ) -> float:
        """Calculate cost for service usage"""
        try:
            service_costs = self.service_costs.get(service, {})
            cost_per_unit = service_costs.get(provider, 0.0)
            
            if service in [UsageType.TOUR_CONTENT]:
                # Cost per 1k tokens
                return (units_used / 1000) * cost_per_unit
            elif service == UsageType.AUDIO_GENERATION:
                # Cost per 1k characters
                return (units_used / 1000) * cost_per_unit
            elif service == UsageType.IMAGE_RECOGNITION:
                # Cost per image
                return units_used * cost_per_unit
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Failed to calculate cost: {str(e)}")
            return 0.0
    
    async def _check_usage_limits(
        self,
        today: str,
        month: str,
        hour: str
    ) -> None:
        """Check usage limits and send alerts if exceeded"""
        try:
            # Check monthly budget (80% threshold)
            monthly_usage = await self.cache.get_json(f"usage:monthly:{month}")
            if monthly_usage:
                monthly_cost = monthly_usage.get("total_cost", 0.0)
                if monthly_cost > self.monthly_budget * 0.8:
                    await self._send_usage_alert(
                        "monthly_budget",
                        f"Monthly cost ${monthly_cost:.2f} exceeds 80% of budget ${self.monthly_budget:.2f}"
                    )
            
            # Check daily token limit (90% threshold)
            daily_usage = await self.cache.get_json(f"usage:daily:{today}")
            if daily_usage:
                daily_tokens = daily_usage.get("total_units", 0)
                if daily_tokens > self.daily_token_limit * 0.9:
                    await self._send_usage_alert(
                        "daily_tokens",
                        f"Daily tokens {daily_tokens} exceeds 90% of limit {self.daily_token_limit}"
                    )
            
            # Check hourly request limit
            hourly_usage = await self.cache.get_json(f"usage:hourly:{hour}")
            if hourly_usage:
                hourly_requests = hourly_usage.get("total_requests", 0)
                if hourly_requests > self.hourly_request_limit:
                    await self._send_usage_alert(
                        "hourly_requests",
                        f"Hourly requests {hourly_requests} exceeds limit {self.hourly_request_limit}"
                    )
                    
        except Exception as e:
            logger.error(f"Failed to check usage limits: {str(e)}")
    
    async def _send_usage_alert(self, alert_type: str, message: str) -> None:
        """Send usage alert (can be extended to email, Slack, etc.)"""
        # For now, just log the alert
        logger.warning(f"USAGE ALERT [{alert_type}]: {message}")
        
        # Store alert in cache for dashboard
        alert_key = f"alerts:{datetime.utcnow().strftime('%Y-%m-%d')}"
        alerts = await self.cache.get_json(alert_key) or []
        alerts.append({
            "type": alert_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        await self.cache.set_json(alert_key, alerts, ttl=86400 * 7)
    
    async def get_usage_summary(self, period: str = "today") -> Dict[str, Any]:
        """
        Get usage summary for specified period.
        
        Args:
            period: "today", "yesterday", "this_month", "last_month"
            
        Returns:
            Usage summary with costs, requests, cache hits, etc.
        """
        try:
            now = datetime.utcnow()
            
            if period == "today":
                date_key = now.strftime("%Y-%m-%d")
                usage_key = f"usage:daily:{date_key}"
                cache_key = f"cache_hits:{date_key}"
            elif period == "yesterday":
                yesterday = now - timedelta(days=1)
                date_key = yesterday.strftime("%Y-%m-%d")
                usage_key = f"usage:daily:{date_key}"
                cache_key = f"cache_hits:{date_key}"
            elif period == "this_month":
                date_key = now.strftime("%Y-%m")
                usage_key = f"usage:monthly:{date_key}"
                cache_key = None  # Calculate from daily cache hits
            elif period == "last_month":
                last_month = now.replace(day=1) - timedelta(days=1)
                date_key = last_month.strftime("%Y-%m")
                usage_key = f"usage:monthly:{date_key}"
                cache_key = None
            else:
                raise ValueError(f"Invalid period: {period}")
            
            # Get usage data
            usage_data = await self.cache.get_json(usage_key) or {}
            
            # Get cache hits
            cache_hits = 0
            if cache_key:
                cache_data = await self.cache.get_json(cache_key) or {}
                cache_hits = sum(
                    sum(provider_hits.values()) if isinstance(provider_hits, dict) else provider_hits
                    for provider_hits in cache_data.values()
                )
            
            # Calculate cache hit rate
            total_requests = usage_data.get("total_requests", 0)
            cache_hit_rate = (
                cache_hits / (total_requests + cache_hits) * 100
                if (total_requests + cache_hits) > 0 else 0
            )
            
            # Calculate budget remaining
            monthly_cost = usage_data.get("total_cost", 0.0)
            budget_remaining = max(0, self.monthly_budget - monthly_cost)
            budget_used_percent = (monthly_cost / self.monthly_budget) * 100
            
            return {
                "period": period,
                "date_key": date_key,
                "usage": usage_data,
                "cache_hits": cache_hits,
                "cache_hit_rate": round(cache_hit_rate, 2),
                "budget": {
                    "limit": self.monthly_budget,
                    "used": round(monthly_cost, 4),
                    "remaining": round(budget_remaining, 4),
                    "used_percent": round(budget_used_percent, 2)
                },
                "alerts": await self._get_recent_alerts()
            }
            
        except Exception as e:
            logger.error(f"Failed to get usage summary: {str(e)}")
            return {"error": str(e)}
    
    async def _get_recent_alerts(self) -> List[Dict[str, Any]]:
        """Get recent alerts from the last 7 days"""
        alerts = []
        
        try:
            for i in range(7):
                date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
                alert_key = f"alerts:{date}"
                daily_alerts = await self.cache.get_json(alert_key) or []
                alerts.extend(daily_alerts)
            
            # Sort by timestamp (newest first)
            alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return alerts[:10]  # Return last 10 alerts
            
        except Exception as e:
            logger.error(f"Failed to get recent alerts: {str(e)}")
            return []
    
    async def get_cost_breakdown(self, period: str = "this_month") -> Dict[str, Any]:
        """Get detailed cost breakdown by service and provider"""
        try:
            summary = await self.get_usage_summary(period)
            usage_data = summary.get("usage", {})
            
            breakdown = {
                "total_cost": usage_data.get("total_cost", 0.0),
                "by_service": {},
                "by_provider": {},
                "cost_savings": 0.0  # From cache hits
            }
            
            # Service breakdown
            services = usage_data.get("services", {})
            for service, data in services.items():
                breakdown["by_service"][service] = {
                    "cost": data.get("cost", 0.0),
                    "requests": data.get("requests", 0),
                    "units": data.get("units", 0)
                }
            
            # Provider breakdown
            providers = usage_data.get("providers", {})
            for provider, data in providers.items():
                breakdown["by_provider"][provider] = {
                    "cost": data.get("cost", 0.0),
                    "requests": data.get("requests", 0),
                    "units": data.get("units", 0)
                }
            
            # Estimate cost savings from cache hits
            cache_hits = summary.get("cache_hits", 0)
            # Rough estimate: each cache hit saves ~$0.002
            breakdown["cost_savings"] = cache_hits * 0.002
            
            return breakdown
            
        except Exception as e:
            logger.error(f"Failed to get cost breakdown: {str(e)}")
            return {"error": str(e)}
    
    async def reset_usage(self, period: str = "today") -> bool:
        """Reset usage counters (admin function)"""
        try:
            now = datetime.utcnow()
            
            if period == "today":
                keys = [
                    f"usage:daily:{now.strftime('%Y-%m-%d')}",
                    f"cache_hits:{now.strftime('%Y-%m-%d')}"
                ]
            elif period == "this_month":
                keys = [f"usage:monthly:{now.strftime('%Y-%m')}"]
            else:
                return False
            
            for key in keys:
                await self.cache.delete(key)
            
            logger.info(f"Usage counters reset for period: {period}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset usage: {str(e)}")
            return False

# Global usage tracker instance
usage_tracker = UsageTracker()