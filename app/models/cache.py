from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func

from app.models.base import BaseModel

class CacheEntry(BaseModel):
    __tablename__ = "cache_entries"
    
    cache_key = Column(String, unique=True, index=True, nullable=False)
    cache_value = Column(Text, nullable=False)
    cache_type = Column(String, default="json", nullable=False)  # json, text, binary
    
    # TTL and expiration
    ttl_seconds = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    tags = Column(String, nullable=True)  # Comma-separated tags for bulk invalidation
    hit_count = Column(Integer, default=0, nullable=False)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    
    @property
    def is_expired(self):
        if self.expires_at:
            return func.now() > self.expires_at
        return False