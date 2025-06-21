"""Caching service for API responses and location data."""

import json
import asyncio
from typing import Any, Optional
from datetime import datetime, timedelta

# For now, we'll use a simple in-memory cache
# In production, this would use Redis or similar
class InMemoryCache:
    """Simple in-memory cache implementation."""
    
    def __init__(self):
        self._cache = {}
        self._expiry = {}
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self._cache:
            # Check if expired
            if key in self._expiry and datetime.now() > self._expiry[key]:
                await self.delete(key)
                return None
            return self._cache[key]
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with TTL in seconds."""
        self._cache[key] = value
        if ttl > 0:
            self._expiry[key] = datetime.now() + timedelta(seconds=ttl)
    
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        self._cache.pop(key, None)
        self._expiry.pop(key, None)
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self._expiry.clear()
    
    def size(self) -> int:
        """Get cache size."""
        return len(self._cache)

class CacheService:
    """Cache service wrapper that can switch between different cache backends."""
    
    def __init__(self, backend: str = "memory"):
        """Initialize cache service with specified backend."""
        if backend == "memory":
            self._cache = InMemoryCache()
        # TODO: Add Redis support for production
        # elif backend == "redis":
        #     self._cache = RedisCache()
        else:
            raise ValueError(f"Unsupported cache backend: {backend}")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            return await self._cache.get(key)
        except Exception as e:
            print(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with TTL in seconds."""
        try:
            await self._cache.set(key, value, ttl)
        except Exception as e:
            print(f"Cache set error for key {key}: {e}")
    
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        try:
            await self._cache.delete(key)
        except Exception as e:
            print(f"Cache delete error for key {key}: {e}")
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        try:
            await self._cache.clear()
        except Exception as e:
            print(f"Cache clear error: {e}")
    
    def get_cache_key(self, prefix: str, *args) -> str:
        """Generate cache key from prefix and arguments."""
        # Convert all args to strings and join with colons
        key_parts = [prefix] + [str(arg) for arg in args if arg is not None]
        return ":".join(key_parts)
    
    def size(self) -> int:
        """Get current cache size."""
        try:
            return self._cache.size()
        except Exception:
            return 0

# Global cache instance
_cache_instance = None

def get_cache() -> CacheService:
    """Get global cache instance (singleton pattern)."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance