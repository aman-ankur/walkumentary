from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import logging

from database import init_db, close_db
from routers import auth_router, health_router, locations_router, tours_router, admin_router
from config import settings

# ----------------------- Logging Setup -----------------------
# Configure root logger based on settings.LOG_LEVEL (default INFO)
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

# Reduce noise from third-party libraries
for noisy in ("sqlalchemy.engine", "httpx", "openai", "supabase", "asyncio", "uvicorn.access"):
    logging.getLogger(noisy).setLevel(logging.WARNING)

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