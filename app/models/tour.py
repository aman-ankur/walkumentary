from sqlalchemy import Column, String, Integer, ForeignKey, ARRAY, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

class Tour(BaseModel):
    __tablename__ = "tours"
    
    # Basic tour information
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    content = Column(Text, nullable=False)  # Main tour content
    
    # Audio information
    audio_url = Column(String, nullable=True)
    transcript = Column(JSON, nullable=True)  # Array of transcript segments
    duration_minutes = Column(Integer, nullable=False)
    
    # Tour preferences
    interests = Column(ARRAY(String), default=[])
    language = Column(String, default="en", nullable=False)
    
    # AI generation metadata
    llm_provider = Column(String, nullable=True)  # 'openai' or 'anthropic'
    llm_model = Column(String, nullable=True)
    generation_params = Column(JSON, default={})
    
    # Status
    status = Column(String, default="generating")  # generating, ready, error
    
    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="tours")
    location = relationship("Location", back_populates="tours")