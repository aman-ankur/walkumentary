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
    # Load variables from either .env OR .env.local (first one found) and
    # ignore any extra keys that are not defined in this Settings model.
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="allow",
    )
    
    # App Configuration
    APP_NAME: str = "Walkumentary API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = Field(default=False)
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    RELOAD: bool = Field(default=False)
    
    # Public API base URL (used for absolute links)
    API_BASE_URL: str = Field(default="http://localhost:8000")
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    ALGORITHM: str = Field(default="HS256")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "https://localhost:3000", "http://localhost:3002", "https://localhost:3002"]
    )
    ALLOWED_METHODS: List[str] = Field(default=["*"])
    ALLOWED_HEADERS: List[str] = Field(default=["*"])
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    DATABASE_POOL_SIZE: int = Field(default=10)
    DATABASE_MAX_OVERFLOW: int = Field(default=20)
    
    # Supabase
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL")
    SUPABASE_SERVICE_KEY: Optional[str] = Field(default=None, description="Supabase service role key")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, description="Supabase anonymous key")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL (defaults to local Redis)")
    REDIS_MAX_CONNECTIONS: int = Field(default=10)
    
    # AI Services
    DEFAULT_LLM_PROVIDER: LLMProvider = Field(default=LLMProvider.OPENAI)
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini")
    OPENAI_TTS_MODEL: str = Field(default="tts-1")
    OPENAI_TTS_VOICE: str = Field(default="alloy")
    
    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key")
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
            # Handle empty string
            if not v.strip():
                return ["http://localhost:3000"]
            # Handle comma-separated string
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            # Handle list (from JSON or default)
            return v
        else:
            # Fallback to default
            return ["http://localhost:3000"]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == Environment.PRODUCTION

    @property
    def database_url_async(self) -> str:
        """Convert sync database URL to async (asyncpg)"""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Global settings instance
settings = Settings()