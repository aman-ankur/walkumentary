# Walkumentary - Technical Specification Document
*Detailed Implementation Guide for Modern Travel Companion App*

## 1. System Overview

### 1.1 Technical Architecture Summary
- **Frontend:** Next.js 14 PWA with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend:** FastAPI with async Python, PostgreSQL via Supabase
- **Authentication:** Supabase Auth with Google OAuth
- **Caching:** Redis for API responses and session management
- **External APIs:** OpenAI (LLM + TTS), Nominatim (geocoding), OpenStreetMap (mapping)
- **Deployment:** Vercel (frontend) + Railway/Fly.io (backend)

### 1.2 Development Principles
- **Mobile-first responsive design**
- **API-first architecture with proper caching**
- **Cost-optimized external service usage**
- **Type-safe development with TypeScript**
- **Component-based UI with consistent design system**

## 2. Frontend Technical Specification

### 2.1 Next.js 14 Configuration

```typescript
// next.config.js
import withPWA from 'next-pwa';

const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  images: {
    domains: ['supabase.co', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
  ],
})(nextConfig);
```

### 2.2 TypeScript Types & Interfaces

```typescript
// lib/types.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  preferences: UserPreferences;
  created_at: string;
}

export interface UserPreferences {
  interests: string[];
  language: string;
  tour_duration: number;
  audio_speed: number;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  country: string;
  city: string;
  type: LocationType;
  metadata: Record<string, any>;
}

export type LocationType = 'landmark' | 'museum' | 'park' | 'restaurant' | 'historical_site';

export interface Tour {
  id: string;
  title: string;
  content: string;
  audio_url: string;
  duration_minutes: number;
  location: Location;
  interests: string[];
  language: string;
  created_at: string;
}

export interface LocationSearchParams {
  query: string;
  coordinates?: [number, number];
  radius?: number;
  limit?: number;
}

export interface TourGenerationParams {
  location_id: string;
  interests: string[];
  duration_minutes: number;
  language: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}
```

### 2.3 Supabase Client Configuration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};
```

### 2.4 API Client Implementation

```typescript
// lib/api.ts
import { ApiResponse, LocationSearchParams, TourGenerationParams } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Location services
  async searchLocations(params: LocationSearchParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/locations/search?${query}`);
  }

  async detectNearbyLocations(coordinates: [number, number], radius: number = 1000) {
    return this.request('/locations/detect', {
      method: 'POST',
      body: JSON.stringify({ coordinates, radius }),
    });
  }

  async recognizeLocationFromImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.request('/locations/recognize', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Tour services
  async generateTour(params: TourGenerationParams) {
    return this.request('/tours/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getTour(tourId: string) {
    return this.request(`/tours/${tourId}`);
  }

  async getUserTours() {
    return this.request('/tours/user');
  }
}

export const apiClient = new ApiClient();
```

### 2.5 Key React Components

```typescript
// components/LocationSearch.tsx
'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.searchLocations({ 
        query: searchQuery,
        limit: 5 
      });
      setSuggestions(response.data.locations);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchLocations(debouncedQuery);
  }, [debouncedQuery, searchLocations]);

  const handleGPSLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await apiClient.detectNearbyLocations([latitude, longitude]);
          if (response.data.locations.length > 0) {
            onLocationSelect(response.data.locations[0]);
          }
        } catch (error) {
          console.error('GPS location error:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for landmarks, cities, or places..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((location) => (
            <Button
              key={location.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => onLocationSelect(location)}
            >
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">
                  {location.city}, {location.country}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleGPSLocation} className="flex-1">
          <MapPin className="h-4 w-4 mr-2" />
          Use GPS
        </Button>
        <Button variant="outline" className="flex-1">
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>
    </div>
  );
}
```

## 3. Backend Technical Specification

### 3.1 FastAPI Application Structure

```python
# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn

from database import init_db
from auth import verify_token
from routers import locations, tours, auth
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Walkumentary API",
    description="Travel Companion API for personalized audio tours",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])
app.include_router(tours.router, prefix="/tours", tags=["tours"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
```

### 3.2 Database Models

```python
# models/user.py
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# models/location.py
from sqlalchemy import Column, String, DateTime, JSON, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    country = Column(String, index=True)
    city = Column(String, index=True)
    location_type = Column(String)
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# models/tour.py
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

class Tour(Base):
    __tablename__ = "tours"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    audio_url = Column(String)
    duration_minutes = Column(Integer)
    interests = Column(ARRAY(String))
    language = Column(String, default="en")
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("Profile", backref="tours")
    location = relationship("Location", backref="tours")
```

### 3.3 Pydantic Schemas

```python
# schemas/location.py
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple
from datetime import datetime
import uuid

class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    city: Optional[str] = None
    location_type: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: uuid.UUID
    coordinates: Optional[Tuple[float, float]] = None
    metadata: dict = {}
    created_at: datetime
    
    class Config:
        from_attributes = True
        
    @property
    def coordinates(self) -> Optional[Tuple[float, float]]:
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None

class LocationSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    coordinates: Optional[Tuple[float, float]] = None
    radius: Optional[int] = Field(default=1000, ge=100, le=10000)
    limit: Optional[int] = Field(default=10, ge=1, le=50)

class LocationSearchResponse(BaseModel):
    locations: List[LocationResponse]
    suggestions: List[str] = []
    total: int

# schemas/tour.py
class TourGenerationRequest(BaseModel):
    location_id: uuid.UUID
    interests: List[str] = Field(default=[], max_items=5)
    duration_minutes: int = Field(default=30, ge=10, le=180)
    language: str = Field(default="en", regex="^[a-z]{2}$")

class TourResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    audio_url: Optional[str] = None
    duration_minutes: int
    location: LocationResponse
    interests: List[str]
    language: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### 3.4 Core Services

```python
# services/ai_service.py
from openai import AsyncOpenAI
import asyncio
from typing import List, Dict, Any
import json

from config import settings
from services.cache_service import cache_service

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_tour_content(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str = "en"
    ) -> Dict[str, str]:
        """Generate personalized tour content using OpenAI GPT-4o-mini"""
        
        # Create cache key
        cache_key = f"tour:{location['id']}:{':'.join(sorted(interests))}:{duration_minutes}:{language}"
        
        # Try to get from cache first
        cached_content = await cache_service.get(cache_key)
        if cached_content:
            return json.loads(cached_content)
        
        # Prepare the prompt
        interests_text = ", ".join(interests) if interests else "general history and culture"
        
        prompt = f"""
        Create an engaging {duration_minutes}-minute audio tour for {location['name']} in {location['city']}, {location['country']}.
        
        Focus on: {interests_text}
        
        Requirements:
        - Write in {language}
        - Make it conversational and engaging for audio narration
        - Include fascinating facts, stories, and practical information
        - Structure it for a {duration_minutes}-minute walking tour
        - Include clear transitions between topics
        - Make it accessible and interesting for all ages
        
        Return a JSON response with:
        {{
            "title": "Compelling tour title",
            "content": "Full tour narration script, divided into natural sections"
        }}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert travel guide and storyteller. Create engaging, accurate, and well-structured audio tour content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            tour_data = json.loads(content)
            
            # Cache the result for 24 hours
            await cache_service.set(cache_key, json.dumps(tour_data), ttl=86400)
            
            return tour_data
            
        except Exception as e:
            raise Exception(f"Failed to generate tour content: {str(e)}")
    
    async def generate_audio(self, text: str, voice: str = "alloy") -> bytes:
        """Generate audio using OpenAI TTS"""
        try:
            response = await self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text,
                speed=1.0
            )
            
            return response.content
            
        except Exception as e:
            raise Exception(f"Failed to generate audio: {str(e)}")
    
    async def recognize_landmark_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """Recognize landmarks from images using GPT-4V"""
        try:
            import base64
            
            # Convert image to base64
            image_base64 = base64.b64encode(image_bytes).decode()
            
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """
                                Identify this landmark or location. If you can identify it, provide:
                                1. Name of the landmark/location
                                2. City and country
                                3. Brief description
                                4. Confidence level (1-10)
                                
                                Return as JSON:
                                {
                                    "identified": true/false,
                                    "name": "landmark name",
                                    "city": "city name", 
                                    "country": "country name",
                                    "description": "brief description",
                                    "confidence": 8
                                }
                                """
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            raise Exception(f"Failed to recognize image: {str(e)}")

ai_service = AIService()
```

### 3.5 API Route Handlers

```python
# routers/locations.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas.location import LocationSearchRequest, LocationSearchResponse
from services.location_service import location_service
from services.ai_service import ai_service
from auth import get_current_user

router = APIRouter()

@router.get("/search", response_model=LocationSearchResponse)
async def search_locations(
    query: str,
    coordinates: str = None,
    radius: int = 1000,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Search for locations using text query"""
    try:
        # Parse coordinates if provided
        coords = None
        if coordinates:
            lat, lng = map(float, coordinates.split(','))
            coords = (lat, lng)
        
        request = LocationSearchRequest(
            query=query,
            coordinates=coords,
            radius=radius,
            limit=limit
        )
        
        result = await location_service.search_locations(db, request)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect")
async def detect_nearby_locations(
    coordinates: List[float],
    radius: int = 1000,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Detect nearby locations using GPS coordinates"""
    try:
        if len(coordinates) != 2:
            raise HTTPException(status_code=400, detail="Coordinates must be [latitude, longitude]")
        
        locations = await location_service.find_nearby_locations(
            db, tuple(coordinates), radius
        )
        
        return {"locations": locations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recognize")
async def recognize_location_from_image(
    image: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Recognize location from uploaded image"""
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Use AI service to recognize the landmark
        recognition_result = await ai_service.recognize_landmark_from_image(image_data)
        
        if not recognition_result.get('identified'):
            return {"identified": False, "message": "Could not identify landmark"}
        
        # Try to find the location in our database
        location = await location_service.find_or_create_location(
            db,
            name=recognition_result['name'],
            city=recognition_result['city'],
            country=recognition_result['country'],
            description=recognition_result['description']
        )
        
        return {
            "identified": True,
            "location": location,
            "confidence": recognition_result['confidence']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 4. Database Configuration

### 4.1 Supabase Setup

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic queries if needed

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can only access their own tours
CREATE POLICY "Users can view own tours" ON tours
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tours" ON tours
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Locations are public (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view locations" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON tours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Redis Caching Configuration

```python
# services/cache_service.py
import redis.asyncio as redis
import json
from typing import Optional, Any
import pickle

from config import settings

class CacheService:
    def __init__(self):
        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        try:
            return await self.redis.get(key)
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        try:
            return await self.redis.setex(key, ttl, value)
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return await self.redis.delete(key)
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from cache"""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return None
    
    async def set_json(self, key: str, value: dict, ttl: int = 3600) -> bool:
        """Set JSON value in cache"""
        try:
            json_str = json.dumps(value)
            return await self.set(key, json_str, ttl)
        except Exception as e:
            print(f"Cache set JSON error: {e}")
            return False

cache_service = CacheService()
```

## 5. Deployment Configuration

### 5.1 Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5.2 Environment Configuration

```bash
# .env.example
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Application
DEBUG=false
ALLOWED_ORIGINS=["http://localhost:3000", "https://yourapp.vercel.app"]
SECRET_KEY=your_secret_key

# External Services
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
```

### 5.3 Deployment Scripts

```yaml
# railway.toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
PORT = "8000"
```

This technical specification provides a comprehensive implementation guide for building the Walkumentary application with modern, scalable architecture and cost-optimized external service integration.