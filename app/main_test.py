from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(
    title="Walkumentary API (Test)",
    description="Travel Companion API for personalized audio tours",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Walkumentary API (Test Mode)",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}