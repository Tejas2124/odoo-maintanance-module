"""Routes package for GearGuard API."""
from routes.equipment import router as equipment_router
from routes.tickets import router as tickets_router

__all__ = ["equipment_router", "tickets_router"]
