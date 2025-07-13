from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy import MetaData
import logging

# Relative import to app.config for consistent package resolution
from app.config import settings

# Create async engine
# Determine connect_args based on database type
database_url = settings.DATABASE_URL.lower()
logging.info(f"Analyzing database URL: {database_url[:50]}...")

# Check if this is Supabase by looking for multiple indicators
is_supabase = (
    "supabase.co" in database_url or 
    "pooler" in database_url or 
    "kumruxjaiwdjiwvmtjyh" in database_url or
    "db.kumruxjaiwdjiwvmtjyh.supabase.co" in database_url
)

if "sqlite" in database_url:
    # SQLite specific configuration
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool
    extra_kwargs = {"connect_args": connect_args}
    logging.info("✅ Using SQLite configuration")
elif is_supabase:
    # Supabase ALWAYS uses pgbouncer - FORCE disable ALL prepared statements
    logging.info("🔧 DETECTED SUPABASE - Applying aggressive pgbouncer compatibility")
    
    connect_args = {
        # Completely disable prepared statements at asyncpg level
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        # Additional server settings
        "server_settings": {
            "application_name": "walkumentary_render",
            "statement_timeout": "30s",
        },
        # Force no prepared statements
        "command_timeout": 30,
    }
    
    # No connection pooling class - let SQLAlchemy handle it
    poolclass = None
    
    # Comprehensive SQLAlchemy configuration for pgbouncer
    extra_kwargs = {
        "connect_args": connect_args,
        "pool_pre_ping": True,
        "pool_recycle": 300,  # Recycle every 5 minutes
        "pool_reset_on_return": "commit",  # Always commit on return
        "pool_timeout": 30,
        "execution_options": {
            # Critical: This prevents prepared statements at SQLAlchemy level
            "isolation_level": "AUTOCOMMIT",
            "compiled_cache": {},  # Disable compiled statement cache
            "schema_translate_map": None,  # Disable schema translation
        },
    }
    logging.info("✅ Applied COMPREHENSIVE Supabase pgbouncer configuration")
else:
    # Regular PostgreSQL
    connect_args = {}
    poolclass = None
    extra_kwargs = {"connect_args": connect_args}
    logging.info("✅ Using regular PostgreSQL configuration")

# Create engine with appropriate configuration
if is_supabase:
    # For Supabase, override pool settings to work with pgbouncer
    engine = create_async_engine(
        settings.database_url_async,
        pool_size=5,  # Smaller pool for pgbouncer
        max_overflow=0,  # No overflow for pgbouncer
        echo=False,
        poolclass=poolclass,
        **extra_kwargs,
    )
    logging.info("🚀 Supabase engine created with pgbouncer-optimized settings")
else:
    # Regular PostgreSQL or SQLite
    engine = create_async_engine(
        settings.database_url_async,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=False,
        poolclass=poolclass,
        **extra_kwargs,
    )
    logging.info("🚀 Standard engine created")

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

# Import models with absolute package path
from app.models import user, location, tour, cache

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
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
    logging.info("Database initialized")

# Database cleanup
async def close_db():
    """Close database connections"""
    await engine.dispose()
    logging.info("Database connections closed")