from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import logging
import time

from app.database import init_db, close_db
from app.routers import auth_router, health_router, locations_router, tours_router, admin_router
from app.config import settings

# ----------------------- Logging Setup -----------------------
# Configure root logger based on settings.LOG_LEVEL (default INFO)
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    force=True  # Override any existing logging configuration
)

# Reduce noise from third-party libraries
noisy_loggers = [
    "sqlalchemy.engine", "httpx", "openai", "supabase", "asyncio", 
    "uvicorn.access", "httpcore", "hpack", "h11", "urllib3", 
    "requests", "aiohttp", "websockets"
]
for noisy in noisy_loggers:
    logging.getLogger(noisy).setLevel(logging.WARNING)

# Set specific loggers to INFO for important application logs
important_loggers = [
    "app.services.tour_service", 
    "app.services.ai_service",
    "app.auth",
    "app.main"
]
for logger_name in important_loggers:
    logging.getLogger(logger_name).setLevel(logging.INFO)

# Log startup message to verify logging is working
logger = logging.getLogger(__name__)
logger.info(f"🚀 Starting Walkumentary API with log level: {settings.LOG_LEVEL}")
logger.info(f"🔧 Environment: {settings.ENVIRONMENT}")
logger.info(f"🔗 CORS origins: {settings.ALLOWED_ORIGINS}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="Walkumentary API",
    description="Travel Companion API for personalized audio tours",
    version="1.0.0",
    lifespan=lifespan
)

# Request logging middleware (for development debugging)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Only log important endpoints, skip health checks
    important_paths = ["/tours", "/auth", "/locations"]
    should_log = any(request.url.path.startswith(path) for path in important_paths)
    
    if should_log:
        logger.info(f"🌐 {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response for important paths or errors
    process_time = time.time() - start_time
    if should_log or response.status_code >= 400:
        status_emoji = "❌" if response.status_code >= 400 else "✅"
        logger.info(f"{status_emoji} {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
    
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(locations_router, prefix="/locations", tags=["locations"])
app.include_router(tours_router, prefix="/tours", tags=["tours"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Walkumentary API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )