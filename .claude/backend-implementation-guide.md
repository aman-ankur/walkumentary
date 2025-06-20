# Backend Implementation Guide - FastAPI
*Comprehensive guide for building the Walkumentary backend with testing*

## 1. Project Setup & Architecture

### 1.1 Initial Setup Commands

```bash
# Create backend directory and virtual environment
mkdir walkumentary-backend
cd walkumentary-backend

# Create virtual environment with Python 3.9
python3.9 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements files
touch requirements.txt requirements-dev.txt

# Install core dependencies
pip install fastapi==0.104.0
pip install uvicorn[standard]==0.24.0
pip install sqlalchemy==2.0.23
pip install asyncpg==0.29.0
pip install alembic==1.12.1
pip install supabase==2.0.0
pip install redis==5.0.1
pip install httpx==0.25.0
pip install pillow==10.1.0
pip install pydantic==2.5.0
pip install python-multipart==0.0.6
pip install pydantic-settings==2.1.0
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4

# Install AI/ML dependencies
pip install openai==1.3.0
pip install anthropic==0.7.0
pip install google-cloud-vision==3.4.5
pip install google-cloud-texttospeech==2.16.3

# Install development and testing dependencies
pip install pytest==7.4.3
pip install pytest-asyncio==0.21.1
pip install pytest-cov==4.1.0
pip install httpx==0.25.0  # for testing
pip install factory-boy==3.3.0
pip install faker==20.1.0
pip install black==23.11.0
pip install isort==5.12.0
pip install flake8==6.1.0
pip install mypy==1.7.0
pip install pre-commit==3.5.0

# Generate requirements.txt
pip freeze > requirements.txt
```

### 1.2 Project Structure

```
walkumentary-backend/
├── app/                          # Main application package
│   ├── __init__.py              
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management
│   ├── database.py              # Database connection and setup
│   ├── auth.py                  # Authentication middleware
│   ├── models/                  # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py             # Base model class
│   │   ├── user.py             # User model
│   │   ├── location.py         # Location model
│   │   ├── tour.py             # Tour model
│   │   └── cache.py            # Cache model
│   ├── schemas/                 # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── base.py             # Base schema classes
│   │   ├── user.py             # User schemas
│   │   ├── location.py         # Location schemas
│   │   ├── tour.py             # Tour schemas
│   │   └── auth.py             # Auth schemas
│   ├── routers/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication routes
│   │   ├── locations.py        # Location routes
│   │   ├── tours.py            # Tour routes
│   │   ├── audio.py            # Audio routes
│   │   └── health.py           # Health check routes
│   ├── services/                # Business logic services
│   │   ├── __init__.py
│   │   ├── base.py             # Base service class
│   │   ├── ai_service.py       # AI/LLM service (OpenAI + Anthropic)
│   │   ├── location_service.py # Location service
│   │   ├── tour_service.py     # Tour service
│   │   ├── audio_service.py    # Audio service
│   │   ├── cache_service.py    # Cache service
│   │   └── image_service.py    # Image processing service
│   ├── utils/                   # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py         # Security utilities
│   │   ├── image_processing.py # Image processing utilities
│   │   ├── text_processing.py  # Text processing utilities
│   │   ├── validators.py       # Custom validators
│   │   └── exceptions.py       # Custom exceptions
│   ├── core/                    # Core functionality
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies
│   │   ├── middleware.py       # Custom middleware
│   │   └── logging.py          # Logging configuration
│   └── tests/                   # Test files
│       ├── __init__.py
│       ├── conftest.py         # Test configuration
│       ├── factories.py        # Test data factories
│       ├── test_auth.py        # Auth tests
│       ├── test_locations.py   # Location tests
│       ├── test_tours.py       # Tour tests
│       └── test_services/      # Service tests
│           ├── test_ai_service.py
│           ├── test_location_service.py
│           └── test_tour_service.py
├── alembic/                     # Database migrations
│   ├── versions/               # Migration files
│   ├── env.py                  # Alembic environment
│   └── script.py.mako          # Migration template
├── scripts/                     # Utility scripts
│   ├── init_db.py              # Database initialization
│   ├── seed_data.py            # Seed test data
│   └── backup_db.py            # Database backup
├── docker/                      # Docker configuration
│   ├── Dockerfile              # Production dockerfile
│   ├── Dockerfile.dev          # Development dockerfile
│   └── docker-compose.yml      # Docker compose
├── .env.example                 # Environment variables example
├── .gitignore                   # Git ignore file
├── requirements.txt             # Production dependencies
├── requirements-dev.txt         # Development dependencies
├── pytest.ini                  # Pytest configuration
├── pyproject.toml              # Python project configuration
├── alembic.ini                 # Alembic configuration
└── README.md                   # Backend documentation
```

## 2. Core Configuration

### 2.1 Application Configuration

```python
# app/config.py
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator
import os
from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    # App Configuration
    APP_NAME: str = "Walkumentary API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = Field(default=False)
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    RELOAD: bool = Field(default=False)
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    ALGORITHM: str = Field(default="HS256")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "https://localhost:3000"]
    )
    ALLOWED_METHODS: List[str] = Field(default=["*"])
    ALLOWED_HEADERS: List[str] = Field(default=["*"])
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    DATABASE_POOL_SIZE: int = Field(default=10)
    DATABASE_MAX_OVERFLOW: int = Field(default=20)
    
    # Supabase
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase service role key")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anonymous key")
    
    # Redis
    REDIS_URL: str = Field(..., description="Redis connection URL")
    REDIS_MAX_CONNECTIONS: int = Field(default=10)
    
    # AI Services
    DEFAULT_LLM_PROVIDER: LLMProvider = Field(default=LLMProvider.OPENAI)
    
    # OpenAI
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini")
    OPENAI_TTS_MODEL: str = Field(default="tts-1")
    OPENAI_TTS_VOICE: str = Field(default="alloy")
    
    # Anthropic
    ANTHROPIC_API_KEY: str = Field(..., description="Anthropic API key")
    ANTHROPIC_MODEL: str = Field(default="claude-3-haiku-20240307")
    
    # Google Cloud (for Vision API)
    GOOGLE_CLOUD_PROJECT: Optional[str] = Field(default=None)
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = Field(default=None)
    
    # External APIs
    NOMINATIM_BASE_URL: str = Field(default="https://nominatim.openstreetmap.org")
    NOMINATIM_USER_AGENT: str = Field(default="Walkumentary/1.0")
    
    # File Storage
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = Field(
        default=["image/jpeg", "image/png", "image/webp"]
    )
    
    # Caching
    CACHE_TTL_DEFAULT: int = Field(default=3600)  # 1 hour
    CACHE_TTL_TOUR_CONTENT: int = Field(default=86400 * 7)  # 7 days
    CACHE_TTL_LOCATION_SEARCH: int = Field(default=86400 * 3)  # 3 days
    CACHE_TTL_IMAGE_RECOGNITION: int = Field(default=86400)  # 1 day
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_BURST: int = Field(default=100)
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None)
    LOG_LEVEL: str = Field(default="INFO")
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == Environment.PRODUCTION

    @property
    def database_url_async(self) -> str:
        """Convert sync database URL to async (asyncpg)"""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Global settings instance
settings = Settings()
```

### 2.2 Database Configuration

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy import MetaData
import logging

from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url_async,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    # For SQLite testing
    poolclass=StaticPool if "sqlite" in settings.DATABASE_URL else None,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

# Create sessionmaker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Create declarative base with naming convention
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
Base = declarative_base(metadata=metadata)

# Database dependency for FastAPI
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Database initialization
async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from app.models import user, location, tour, cache
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
    logging.info("Database initialized")

# Database cleanup
async def close_db():
    """Close database connections"""
    await engine.dispose()
    logging.info("Database connections closed")
```

### 2.3 Authentication & Security

```python
# app/auth.py
from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client
import httpx

from app.config import settings
from app.models.user import User
from app.schemas.auth import TokenData
from app.database import get_db, AsyncSession

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def verify_supabase_token(token: str) -> dict:
    """Verify Supabase JWT token"""
    try:
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        if response.user:
            return {
                "sub": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata,
            }
        else:
            raise AuthenticationError("Invalid token")
    except Exception as e:
        raise AuthenticationError(f"Token verification failed: {str(e)}")

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    try:
        # First try to verify as Supabase token
        payload = await verify_supabase_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise AuthenticationError()
            
    except JWTError:
        raise AuthenticationError()
    
    # Get or create user in our database
    user = await get_user_by_id(db, user_id)
    if user is None:
        # Create user from token data
        user_data = {
            "id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("user_metadata", {}).get("full_name", ""),
        }
        user = await create_user(db, user_data)
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user_from_token)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# User CRUD operations
async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get user by ID"""
    result = await db.execute(
        sqlalchemy.select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(
        sqlalchemy.select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_data: dict) -> User:
    """Create a new user"""
    user = User(**user_data)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
```

## 3. Database Models

### 3.1 Base Model

```python
# app/models/base.py
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr
import uuid

from app.database import Base

class BaseModel(Base):
    __abstract__ = True
    
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
```

### 3.2 User Model

```python
# app/models/user.py
from sqlalchemy import Column, String, JSON, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

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
```

### 3.3 Location Model

```python
# app/models/location.py
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
    metadata = Column(JSON, default={})
    
    # Image URL
    image_url = Column(String, nullable=True)
    
    # Relationships
    tours = relationship("Tour", back_populates="location")
    
    # Indexes for geographic queries
    __table_args__ = (
        Index('ix_location_coordinates', 'latitude', 'longitude'),
        Index('ix_location_country_city', 'country', 'city'),
    )
    
    @property
    def coordinates(self):
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None
```

### 3.4 Tour Model

```python
# app/models/tour.py
from sqlalchemy import Column, String, Integer, ForeignKey, ARRAY, Text
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
```

## 4. API Services

### 4.1 Multi-LLM AI Service

```python
# app/services/ai_service.py
from typing import Dict, List, Any, Optional, Union
from abc import ABC, abstractmethod
import asyncio
import json
import hashlib
from enum import Enum

import openai
import anthropic
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.config import settings, LLMProvider
from app.services.cache_service import cache_service
from app.utils.exceptions import AIServiceError
from app.core.logging import logger

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

class BaseLLMClient(ABC):
    """Abstract base class for LLM clients"""
    
    @abstractmethod
    async def generate_content(
        self, 
        prompt: str, 
        system_prompt: str = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> str:
        pass
    
    @abstractmethod
    async def generate_audio(self, text: str, voice: str = "alloy") -> bytes:
        pass

class OpenAIClient(BaseLLMClient):
    """OpenAI client implementation"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.tts_model = settings.OPENAI_TTS_MODEL
    
    async def generate_content(
        self,
        prompt: str,
        system_prompt: str = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> str:
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI content generation failed: {str(e)}")
            raise AIServiceError(f"OpenAI content generation failed: {str(e)}")
    
    async def generate_audio(self, text: str, voice: str = "alloy") -> bytes:
        try:
            response = await self.client.audio.speech.create(
                model=self.tts_model,
                voice=voice,
                input=text,
                speed=1.0,
                response_format="mp3"
            )
            
            return response.content
            
        except Exception as e:
            logger.error(f"OpenAI audio generation failed: {str(e)}")
            raise AIServiceError(f"OpenAI audio generation failed: {str(e)}")

class AnthropicClient(BaseLLMClient):
    """Anthropic client implementation"""
    
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL
    
    async def generate_content(
        self,
        prompt: str,
        system_prompt: str = None,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> str:
        try:
            # Anthropic uses system parameter separately
            message_content = prompt
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "You are a helpful assistant.",
                messages=[
                    {"role": "user", "content": message_content}
                ]
            )
            
            return response.content[0].text.strip()
            
        except Exception as e:
            logger.error(f"Anthropic content generation failed: {str(e)}")
            raise AIServiceError(f"Anthropic content generation failed: {str(e)}")
    
    async def generate_audio(self, text: str, voice: str = "alloy") -> bytes:
        # Anthropic doesn't have TTS, fall back to OpenAI
        openai_client = OpenAIClient()
        return await openai_client.generate_audio(text, voice)

class AIService:
    """Main AI service that manages multiple LLM providers"""
    
    def __init__(self):
        self.clients = {
            LLMProvider.OPENAI: OpenAIClient(),
            LLMProvider.ANTHROPIC: AnthropicClient(),
        }
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
        self.cache = cache_service
    
    def get_client(self, provider: Optional[LLMProvider] = None) -> BaseLLMClient:
        """Get LLM client for specified provider"""
        provider = provider or self.default_provider
        return self.clients[provider]
    
    async def generate_tour_content(
        self,
        location: Dict[str, Any],
        interests: List[str],
        duration_minutes: int,
        language: str = "en",
        provider: Optional[LLMProvider] = None
    ) -> Dict[str, Any]:
        """Generate tour content using specified LLM provider"""
        
        # Create cache key
        cache_data = {
            "location_id": str(location["id"]),
            "location_name": location["name"],
            "interests": sorted(interests),
            "duration": duration_minutes,
            "language": language,
            "provider": provider or self.default_provider,
        }
        cache_key = f"tour:content:{hashlib.md5(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()}"
        
        # Try cache first
        cached_result = await self.cache.get_json(cache_key)
        if cached_result:
            logger.info(f"Cache hit for tour content: {cache_key}")
            return cached_result
        
        # Generate new content
        client = self.get_client(provider)
        
        # Create optimized prompts
        system_prompt = self._create_system_prompt(language)
        user_prompt = self._create_tour_prompt(location, interests, duration_minutes, language)
        
        try:
            content = await client.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=2000,
                temperature=0.7
            )
            
            # Parse JSON response
            tour_data = self._parse_tour_content(content)
            
            # Add metadata
            tour_data["metadata"] = {
                "provider": provider or self.default_provider,
                "cache_key": cache_key,
                "generation_timestamp": datetime.utcnow().isoformat(),
            }
            
            # Cache the result for 7 days
            await self.cache.set_json(cache_key, tour_data, ttl=settings.CACHE_TTL_TOUR_CONTENT)
            
            logger.info(f"Generated tour content using {provider or self.default_provider}")
            return tour_data
            
        except Exception as e:
            logger.error(f"Tour content generation failed: {str(e)}")
            raise AIServiceError(f"Tour content generation failed: {str(e)}")
    
    def _create_system_prompt(self, language: str) -> str:
        """Create system prompt for tour generation"""
        return f"""You are an expert travel guide and storyteller. Create engaging, accurate, and well-structured audio tour content in {language}. 
        
Your responses should be:
- Conversational and engaging for audio narration
- Historically accurate and culturally sensitive
- Structured for the specified duration
- Accessible to all ages and backgrounds
- Return ONLY valid JSON format"""
    
    def _create_tour_prompt(
        self, 
        location: Dict[str, Any], 
        interests: List[str], 
        duration_minutes: int, 
        language: str
    ) -> str:
        """Create optimized prompt for tour generation"""
        
        interests_text = ", ".join(interests[:3]) if interests else "history, culture"
        
        return f"""Create a {duration_minutes}-minute audio tour for {location['name']} in {location.get('city', '')}.

Focus: {interests_text}
Language: {language}

Return JSON format:
{{
    "title": "engaging tour title",
    "content": "conversational {duration_minutes}-minute narration script with clear sections and natural transitions"
}}

Requirements:
- Conversational audio style suitable for walking
- Include fascinating facts, stories, and local insights
- Structure content for {duration_minutes} minutes of narration
- Clear transitions between topics
- Engaging introduction and conclusion"""
    
    def _parse_tour_content(self, content: str) -> Dict[str, Any]:
        """Parse and validate tour content response"""
        try:
            # Try to parse as JSON
            tour_data = json.loads(content)
            
            # Validate required fields
            if not isinstance(tour_data, dict) or "title" not in tour_data or "content" not in tour_data:
                raise ValueError("Invalid JSON structure")
                
            return tour_data
            
        except json.JSONDecodeError:
            # Try to extract JSON from response
            start = content.find('{')
            end = content.rfind('}') + 1
            
            if start != -1 and end > start:
                try:
                    tour_data = json.loads(content[start:end])
                    return tour_data
                except json.JSONDecodeError:
                    pass
            
            # Fallback: create structured response
            return {
                "title": "Generated Tour",
                "content": content,
                "fallback": True
            }
    
    async def generate_audio(
        self, 
        text: str, 
        voice: str = "alloy",
        provider: Optional[LLMProvider] = None
    ) -> bytes:
        """Generate audio from text"""
        client = self.get_client(provider)
        return await client.generate_audio(text, voice)
    
    async def recognize_landmark_from_image(
        self, 
        image_bytes: bytes,
        provider: Optional[LLMProvider] = None
    ) -> Dict[str, Any]:
        """Recognize landmarks from images"""
        # For now, use OpenAI's vision capabilities
        # TODO: Implement Anthropic vision when available
        
        client = self.get_client(LLMProvider.OPENAI)
        
        try:
            import base64
            
            # Convert image to base64
            image_base64 = base64.b64encode(image_bytes).decode()
            
            # Use OpenAI's vision model
            openai_client = client.client
            
            response = await openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Identify this landmark or location. Return JSON format:
                                {
                                    "identified": true/false,
                                    "name": "landmark name",
                                    "city": "city name", 
                                    "country": "country name",
                                    "description": "brief description",
                                    "confidence": 1-10
                                }"""
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
            logger.error(f"Image recognition failed: {str(e)}")
            raise AIServiceError(f"Image recognition failed: {str(e)}")

# Global AI service instance
ai_service = AIService()
```

## 5. Testing Framework

### 5.1 Test Configuration

```python
# app/tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.config import settings
from app.models import user, location, tour, cache

# Test database URL (SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client"""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    """Test user data"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "full_name": "Test User",
        "preferences": {
            "interests": ["history", "culture"],
            "language": "en",
            "default_tour_duration": 30,
        }
    }

@pytest.fixture
def test_location_data():
    """Test location data"""
    return {
        "name": "Table Mountain",
        "description": "Iconic flat-topped mountain",
        "latitude": -33.9625,
        "longitude": 18.4107,
        "country": "South Africa",
        "city": "Cape Town",
        "location_type": "landmark",
    }
```

### 5.2 Service Testing Example

```python
# app/tests/test_services/test_ai_service.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import json

from app.services.ai_service import AIService, LLMProvider
from app.utils.exceptions import AIServiceError

class TestAIService:
    
    @pytest.fixture
    def ai_service(self):
        return AIService()
    
    @pytest.fixture
    def mock_location(self):
        return {
            "id": "test-location-id",
            "name": "Table Mountain",
            "city": "Cape Town",
            "country": "South Africa",
        }
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_openai(self, ai_service, mock_location):
        """Test tour content generation with OpenAI"""
        
        # Mock OpenAI response
        mock_response = {
            "title": "Table Mountain: Cape Town's Crown Jewel",
            "content": "Welcome to Table Mountain, one of the New Seven Wonders of Nature..."
        }
        
        with patch.object(ai_service.clients[LLMProvider.OPENAI], 'generate_content') as mock_generate:
            mock_generate.return_value = json.dumps(mock_response)
            
            # Mock cache miss
            with patch.object(ai_service.cache, 'get_json', return_value=None):
                with patch.object(ai_service.cache, 'set_json'):
                    
                    result = await ai_service.generate_tour_content(
                        location=mock_location,
                        interests=["history", "nature"],
                        duration_minutes=30,
                        language="en",
                        provider=LLMProvider.OPENAI
                    )
                    
                    assert result["title"] == "Table Mountain: Cape Town's Crown Jewel"
                    assert "content" in result
                    assert result["metadata"]["provider"] == "openai"
                    mock_generate.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_anthropic(self, ai_service, mock_location):
        """Test tour content generation with Anthropic"""
        
        mock_response = {
            "title": "Exploring Table Mountain",
            "content": "Standing majestically above Cape Town..."
        }
        
        with patch.object(ai_service.clients[LLMProvider.ANTHROPIC], 'generate_content') as mock_generate:
            mock_generate.return_value = json.dumps(mock_response)
            
            with patch.object(ai_service.cache, 'get_json', return_value=None):
                with patch.object(ai_service.cache, 'set_json'):
                    
                    result = await ai_service.generate_tour_content(
                        location=mock_location,
                        interests=["culture"],
                        duration_minutes=45,
                        provider=LLMProvider.ANTHROPIC
                    )
                    
                    assert result["title"] == "Exploring Table Mountain"
                    assert result["metadata"]["provider"] == "anthropic"
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_cache_hit(self, ai_service, mock_location):
        """Test cache hit for tour content"""
        
        cached_result = {
            "title": "Cached Tour",
            "content": "Cached content...",
            "metadata": {"provider": "openai"}
        }
        
        with patch.object(ai_service.cache, 'get_json', return_value=cached_result):
            
            result = await ai_service.generate_tour_content(
                location=mock_location,
                interests=["history"],
                duration_minutes=30
            )
            
            assert result == cached_result
    
    @pytest.mark.asyncio
    async def test_generate_tour_content_error_handling(self, ai_service, mock_location):
        """Test error handling in tour content generation"""
        
        with patch.object(ai_service.clients[LLMProvider.OPENAI], 'generate_content') as mock_generate:
            mock_generate.side_effect = Exception("API Error")
            
            with patch.object(ai_service.cache, 'get_json', return_value=None):
                
                with pytest.raises(AIServiceError):
                    await ai_service.generate_tour_content(
                        location=mock_location,
                        interests=["history"],
                        duration_minutes=30
                    )
    
    @pytest.mark.asyncio
    async def test_parse_tour_content_valid_json(self, ai_service):
        """Test parsing valid JSON content"""
        
        valid_json = '{"title": "Test Tour", "content": "Test content"}'
        result = ai_service._parse_tour_content(valid_json)
        
        assert result["title"] == "Test Tour"
        assert result["content"] == "Test content"
    
    @pytest.mark.asyncio
    async def test_parse_tour_content_invalid_json(self, ai_service):
        """Test parsing invalid JSON with fallback"""
        
        invalid_content = "This is not JSON but still useful content"
        result = ai_service._parse_tour_content(invalid_content)
        
        assert result["title"] == "Generated Tour"
        assert result["content"] == invalid_content
        assert result["fallback"] is True
    
    @pytest.mark.asyncio
    async def test_generate_audio(self, ai_service):
        """Test audio generation"""
        
        mock_audio_data = b"fake audio data"
        
        with patch.object(ai_service.clients[LLMProvider.OPENAI], 'generate_audio') as mock_audio:
            mock_audio.return_value = mock_audio_data
            
            result = await ai_service.generate_audio("Test text", "alloy")
            
            assert result == mock_audio_data
            mock_audio.assert_called_once_with("Test text", "alloy")
```

## 6. Implementation Phases

### Phase 1A: Project Setup & Core Infrastructure (Days 1-2)
1. Create FastAPI project structure
2. Set up database models and migrations
3. Configure authentication with Supabase
4. Implement basic health check endpoints
5. Set up testing framework
6. Test: Basic API endpoints, database connectivity, auth

### Phase 1B: Location Services (Days 3-4)
1. Implement location search with Nominatim
2. Create GPS-based location detection
3. Add location CRUD operations
4. Set up Redis caching
5. Test: Location search, caching, GPS detection

### Phase 1C: AI Services Foundation (Days 5-6)
1. Implement multi-LLM service (OpenAI + Anthropic)
2. Create tour content generation
3. Add prompt optimization and caching
4. Implement usage tracking
5. Test: AI content generation, provider switching

### Phase 1D: Tour Management (Days 7)
1. Create tour CRUD operations
2. Implement audio generation
3. Add tour status management
4. Set up file storage with Supabase
5. Test: Complete tour generation pipeline

This comprehensive backend guide provides everything needed to build a robust, tested, and scalable FastAPI application with multi-LLM support.