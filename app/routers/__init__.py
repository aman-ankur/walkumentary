# Routers package
from .auth import router as auth_router
from .health import router as health_router
from .locations import router as locations_router
from .tours import router as tours_router
from .admin import router as admin_router

__all__ = ["auth_router", "health_router", "locations_router", "tours_router", "admin_router"]