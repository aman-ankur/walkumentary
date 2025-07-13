from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import StaticPool, NullPool
from sqlalchemy import MetaData
import logging
from uuid import uuid4

# Relative import to app.config for consistent package resolution
from app.config import settings

# NUCLEAR OPTION: UUID-based prepared statement naming for pgbouncer compatibility
# This is the definitive 2024 solution for Supabase transaction pooler issues

logging.info(f"🔍 Database URL analysis: {settings.DATABASE_URL[:60]}...")

def generate_unique_statement_name():
    """Generate unique prepared statement names to avoid pgbouncer conflicts"""
    return f"__asyncpg_stmt_{uuid4().hex[:8]}__"

# Detect if we're using any PostgreSQL variant (including Supabase)
is_postgresql = "postgresql" in settings.DATABASE_URL.lower()
is_supabase = any(indicator in settings.DATABASE_URL.lower() for indicator in [
    "supabase.co", "pooler", "kumruxjaiwdjiwvmtjyh"
])

if "sqlite" in settings.DATABASE_URL.lower():
    # SQLite configuration
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool
    extra_kwargs = {"connect_args": connect_args}
    logging.info("✅ SQLite configuration applied")
    
elif is_postgresql:
    # UNIVERSAL PostgreSQL/Supabase configuration with UUID statement naming
    # This works for ALL pgbouncer setups, including Supabase transaction pooler
    
    connect_args = {
        # CRITICAL: UUID-based prepared statement naming prevents conflicts
        "prepared_statement_name_func": generate_unique_statement_name,
        # Disable caching as backup
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        # Connection settings optimized for Supabase/pgbouncer
        "command_timeout": 60,  # Longer timeout for Supabase
        "server_settings": {
            "application_name": "walkumentary_app",
            "tcp_keepalives_idle": "300",
            "tcp_keepalives_interval": "30", 
            "tcp_keepalives_count": "3",
        }
    }
    
    # Use StaticPool for Supabase to avoid connection timeout issues
    # NullPool causes TimeoutError on connection close with pgbouncer
    poolclass = StaticPool if is_supabase else None
    
    extra_kwargs = {
        "connect_args": connect_args,
        "execution_options": {
            "compiled_cache": {},  # Disable compiled cache
        }
    }
    
    # Add pool-related settings (StaticPool can handle these)
    extra_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,  # Recycle connections every 5 minutes for Supabase
        "pool_timeout": 30,
    })
    
    config_type = "Supabase pgbouncer" if is_supabase else "PostgreSQL"
    logging.info(f"🚀 {config_type} configuration with UUID statement naming applied")
    
else:
    # Fallback configuration
    connect_args = {}
    poolclass = None
    extra_kwargs = {"connect_args": connect_args}
    logging.info("⚠️ Fallback configuration applied")

# Create the async engine with all configurations applied
engine_kwargs = {
    "echo": False,
    "poolclass": poolclass,
    **extra_kwargs,
}

# Add pool size parameters (StaticPool and regular pools can handle these)
if is_supabase:
    # Smaller pool for Supabase with StaticPool
    engine_kwargs.update({
        "pool_size": 1,  # StaticPool uses single connection
        "max_overflow": 0,
    })
else:
    # Regular PostgreSQL pool settings
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
    })

engine = create_async_engine(
    settings.database_url_async,
    **engine_kwargs,
)

logging.info("🎯 Database engine created successfully with pgbouncer-compatible configuration")

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