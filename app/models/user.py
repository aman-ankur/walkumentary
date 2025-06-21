from sqlalchemy import Column, String, JSON, Boolean
from sqlalchemy.orm import relationship

from models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # User preferences stored as JSON
    preferences = Column(JSON, default={
        "interests": [],
        "language": "en",
        "default_tour_duration": 30,
        "audio_speed": 1.0,
        "theme": "light",
    })
    
    # Relationships
    tours = relationship("Tour", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def interests(self):
        return self.preferences.get("interests", [])
    
    @property
    def language(self):
        return self.preferences.get("language", "en")
    
    @property
    def default_tour_duration(self):
        return self.preferences.get("default_tour_duration", 30)