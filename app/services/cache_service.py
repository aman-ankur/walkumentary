"""Caching service for API responses and location data."""

import json
import asyncio
from typing import Any, Optional
from datetime import datetime, timedelta
import logging

# Lazy import to avoid hard dependency when Redis not required
try:
    import aioredis  # type: ignore
except ImportError:  # pragma: no cover
    aioredis = None  # will be checked at runtime

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

# ------------------------------------------------------------
# Redis backend (production)
# ------------------------------------------------------------

class RedisCache:  # pragma: no cover – heavy I/O, tested via integration
    """Thin async wrapper around aioredis for the cache interface."""

    def __init__(self, url: str, max_connections: int = 10):
        if aioredis is None:
            raise RuntimeError(
                "aioredis package is required for RedisCache. Install with `pip install aioredis`."
            )

        # decode_responses=False so we handle raw bytes for audio
        self._pool = aioredis.from_url(url, max_connections=max_connections, decode_responses=False)

    async def get(self, key: str):
        return await self._pool.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600):
        # Redis requires bytes, str, int or float.
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        elif not isinstance(value, (str, bytes, int, float)):
            value = str(value)
        await self._pool.set(key, value, ex=ttl)

    async def delete(self, key: str):
        await self._pool.delete(key)

    async def clear(self):
        await self._pool.flushdb()

    async def size(self) -> int:  # not part of original interface but used internally
        return await self._pool.dbsize()

class CacheService:
    """Cache service wrapper that can switch between different cache backends."""
    
    def __init__(self, backend: Optional[str] = None):
        """Initialise cache service.

        If *backend* is None it will auto-select Redis when a REDIS_URL is
        configured, falling back to in-memory otherwise. You can still force
        "memory" or "redis" explicitly for testing.
        """

        from config import settings

        # Auto-detect backend
        chosen = backend or ("redis" if settings.REDIS_URL else "memory")

        if chosen == "redis":
            try:
                self._cache = RedisCache(settings.REDIS_URL, settings.REDIS_MAX_CONNECTIONS)
                logging.getLogger(__name__).info("Redis cache initialised")
            except Exception as e:
                logging.getLogger(__name__).warning(
                    "Failed to connect to Redis – falling back to in-memory cache (%s)",
                    e,
                )
                self._cache = InMemoryCache()
        elif chosen == "memory":
            self._cache = InMemoryCache()
            logging.getLogger(__name__).info("Using in-memory cache backend")
        else:
            raise ValueError(f"Unsupported cache backend: {chosen}")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            val = await self._cache.get(key)
            # Decode bytes to str for convenience
            if isinstance(val, bytes):
                try:
                    return val.decode("utf-8")
                except UnicodeDecodeError:
                    return val  # binary (e.g., audio)
            return val
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
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from cache."""
        value = await self.get(key)
        if value:
            if isinstance(value, (bytes, bytearray)):
                try:
                    value = value.decode("utf-8")
                except UnicodeDecodeError:
                    return None
            try:
                return json.loads(value) if isinstance(value, str) else value
            except (json.JSONDecodeError, TypeError):
                return None
        return None
    
    async def set_json(self, key: str, value: dict, ttl: int = 3600) -> None:
        """Set JSON value in cache."""
        try:
            json_str = json.dumps(value) if not isinstance(value, str) else value
            await self.set(key, json_str, ttl)
        except Exception as e:
            print(f"Cache set JSON error for key {key}: {e}")
    
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

# Create global cache service instance
cache_service = get_cache()