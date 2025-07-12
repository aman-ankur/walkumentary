from sqlalchemy import Column, String, DECIMAL, JSON, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

class Location(BaseModel):
    __tablename__ = "locations"
    
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    
    # Geographic coordinates
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    
    # Location details
    country = Column(String, nullable=True, index=True)
    city = Column(String, nullable=True, index=True)
    location_type = Column(String, nullable=True, index=True)
    
    # Additional metadata (opening hours, website, etc.)
    location_metadata = Column("metadata", JSON, default={})
    
    # Image URL
    image_url = Column(String, nullable=True)
    
    # Relationships
    tours = relationship("app.models.tour.Tour", back_populates="location")
    
    # Indexes for geographic queries
    __table_args__ = (
        Index('ix_location_coordinates', 'latitude', 'longitude'),
        Index('ix_location_country_city', 'country', 'city'),
        {'extend_existing': True}
    )
    
    @property
    def coordinates(self):
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None