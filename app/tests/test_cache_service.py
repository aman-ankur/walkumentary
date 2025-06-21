"""Tests for cache service."""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
import time

from services.cache_service import CacheService
from models.cache import CacheEntry


class TestCacheService:
    """Test CacheService methods."""
    
    @pytest.fixture
    def cache_service(self, db_session):
        """Create CacheService instance with test database."""
        return CacheService(db_session)
    
    def test_singleton_pattern(self, db_session):
        """Test that CacheService follows singleton pattern."""
        cache1 = CacheService(db_session)
        cache2 = CacheService(db_session)
        
        # Should be the same instance
        assert cache1 is cache2
    
    def test_generate_key_string(self, cache_service):
        """Test key generation with string input."""
        key = cache_service._generate_key("test_key")
        assert key == "test_key"
    
    def test_generate_key_dict(self, cache_service):
        """Test key generation with dictionary input."""
        data = {"name": "test", "value": 123, "nested": {"key": "value"}}
        key = cache_service._generate_key(data)
        
        # Should be a consistent string representation
        assert isinstance(key, str)
        assert len(key) > 0
        
        # Same input should generate same key
        key2 = cache_service._generate_key(data)
        assert key == key2
    
    def test_generate_key_complex_object(self, cache_service):
        """Test key generation with complex object."""
        data = {
            "query": "New York",
            "coordinates": [40.7128, -74.0060],
            "filters": {"type": "restaurant", "rating": 4.5},
            "options": {"limit": 10, "sort": "distance"}
        }
        
        key = cache_service._generate_key(data)
        assert isinstance(key, str)
        
        # Different data should generate different key
        data2 = data.copy()
        data2["query"] = "Boston"
        key2 = cache_service._generate_key(data2)
        assert key != key2
    
    @pytest.mark.asyncio
    async def test_set_and_get_success(self, cache_service):
        """Test setting and getting cache entry."""
        key = "test_key"
        value = {"data": "test_value", "count": 123}
        ttl = 300
        
        # Set cache entry
        result = await cache_service.set(key, value, ttl)
        assert result is True
        
        # Get cache entry
        retrieved = await cache_service.get(key)
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_key(self, cache_service):
        """Test getting non-existent cache entry."""
        result = await cache_service.get("nonexistent_key")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_expired_entry(self, cache_service):
        """Test getting expired cache entry."""
        key = "expired_key"
        value = {"data": "expired_value"}
        
        # Set entry with very short TTL
        await cache_service.set(key, value, 1)
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should return None for expired entry
        result = await cache_service.get(key)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_set_override_existing(self, cache_service):
        """Test setting cache entry that already exists."""
        key = "override_key"
        value1 = {"data": "value1"}
        value2 = {"data": "value2"}
        
        # Set initial value
        await cache_service.set(key, value1, 300)
        result1 = await cache_service.get(key)
        assert result1 == value1
        
        # Override with new value
        await cache_service.set(key, value2, 300)
        result2 = await cache_service.get(key)
        assert result2 == value2
    
    @pytest.mark.asyncio
    async def test_delete_existing_key(self, cache_service):
        """Test deleting existing cache entry."""
        key = "delete_key"
        value = {"data": "delete_value"}
        
        # Set entry
        await cache_service.set(key, value, 300)
        assert await cache_service.get(key) == value
        
        # Delete entry
        result = await cache_service.delete(key)
        assert result is True
        
        # Verify deletion
        assert await cache_service.get(key) is None
    
    @pytest.mark.asyncio
    async def test_delete_nonexistent_key(self, cache_service):
        """Test deleting non-existent cache entry."""
        result = await cache_service.delete("nonexistent_key")
        assert result is False
    
    @pytest.mark.asyncio
    async def test_clear_cache(self, cache_service):
        """Test clearing all cache entries."""
        # Set multiple entries
        await cache_service.set("key1", {"data": "value1"}, 300)
        await cache_service.set("key2", {"data": "value2"}, 300)
        await cache_service.set("key3", {"data": "value3"}, 300)
        
        # Verify entries exist
        assert await cache_service.get("key1") is not None
        assert await cache_service.get("key2") is not None
        assert await cache_service.get("key3") is not None
        
        # Clear cache
        await cache_service.clear()
        
        # Verify all entries are gone
        assert await cache_service.get("key1") is None
        assert await cache_service.get("key2") is None
        assert await cache_service.get("key3") is None
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_entries(self, cache_service):
        """Test cleanup of expired cache entries."""
        # Set entries with different TTLs
        await cache_service.set("key1", {"data": "value1"}, 300)  # Long TTL
        await cache_service.set("key2", {"data": "value2"}, 1)    # Short TTL
        await cache_service.set("key3", {"data": "value3"}, 1)    # Short TTL
        
        # Wait for short TTL entries to expire
        time.sleep(1.1)
        
        # Cleanup expired entries
        await cache_service._cleanup_expired()
        
        # Verify only non-expired entry remains
        assert await cache_service.get("key1") is not None
        assert await cache_service.get("key2") is None
        assert await cache_service.get("key3") is None
    
    def test_is_expired_entry_not_expired(self, cache_service):
        """Test checking if entry is not expired."""
        future_time = datetime.utcnow() + timedelta(seconds=300)
        entry = CacheEntry(
            key="test_key",
            value='{"data": "test"}',
            expires_at=future_time
        )
        
        assert cache_service._is_expired(entry) is False
    
    def test_is_expired_entry_expired(self, cache_service):
        """Test checking if entry is expired."""
        past_time = datetime.utcnow() - timedelta(seconds=300)
        entry = CacheEntry(
            key="test_key",
            value='{"data": "test"}',
            expires_at=past_time
        )
        
        assert cache_service._is_expired(entry) is True
    
    def test_is_expired_entry_no_expiration(self, cache_service):
        """Test checking if entry with no expiration is expired."""
        entry = CacheEntry(
            key="test_key",
            value='{"data": "test"}',
            expires_at=None
        )
        
        assert cache_service._is_expired(entry) is False
    
    @pytest.mark.asyncio
    async def test_memory_cache_integration(self, cache_service):
        """Test integration between memory cache and database."""
        key = "integration_key"
        value = {"data": "integration_value"}
        
        # Set value
        await cache_service.set(key, value, 300)
        
        # First get should populate memory cache
        result1 = await cache_service.get(key)
        assert result1 == value
        
        # Second get should use memory cache
        result2 = await cache_service.get(key)
        assert result2 == value
        
        # Verify memory cache was used (value should be in _memory_cache)
        assert key in cache_service._memory_cache
    
    @pytest.mark.asyncio
    async def test_error_handling_database_failure(self, cache_service):
        """Test error handling when database operations fail."""
        # Mock database session to raise exception
        cache_service.db.execute = Mock(side_effect=Exception("Database error"))
        
        # Get should handle error gracefully
        result = await cache_service.get("test_key")
        assert result is None
        
        # Set should handle error gracefully
        result = await cache_service.set("test_key", {"data": "test"}, 300)
        assert result is False
    
    @pytest.mark.asyncio
    async def test_json_serialization_complex_data(self, cache_service):
        """Test JSON serialization of complex data types."""
        complex_data = {
            "string": "test",
            "number": 123,
            "float": 45.67,
            "boolean": True,
            "null": None,
            "list": [1, 2, 3, "test"],
            "nested": {
                "key1": "value1",
                "key2": [4, 5, 6]
            }
        }
        
        # Set and get complex data
        await cache_service.set("complex_key", complex_data, 300)
        result = await cache_service.get("complex_key")
        
        assert result == complex_data
    
    @pytest.mark.asyncio
    async def test_ttl_zero_means_no_expiration(self, cache_service):
        """Test that TTL of 0 means no expiration."""
        key = "no_expiry_key"
        value = {"data": "no_expiry_value"}
        
        # Set with TTL of 0
        await cache_service.set(key, value, 0)
        
        # Should be retrievable
        result = await cache_service.get(key)
        assert result == value
        
        # Check that expires_at is None in database
        # (This would require checking the actual database entry)
    
    @pytest.mark.asyncio
    async def test_large_data_storage(self, cache_service):
        """Test storing large data in cache."""
        large_data = {
            "items": [{"id": i, "name": f"item_{i}", "data": "x" * 100} for i in range(1000)]
        }
        
        # Should handle large data
        result = await cache_service.set("large_key", large_data, 300)
        assert result is True
        
        retrieved = await cache_service.get("large_key")
        assert retrieved == large_data
        assert len(retrieved["items"]) == 1000