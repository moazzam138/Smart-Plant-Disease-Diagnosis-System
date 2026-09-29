from fastapi import APIRouter

from app import database
from app.config import settings
from app.schemas import HealthResponse
from app.services.model_service import model_service

router = APIRouter(tags=["health"])

VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse, summary="Is the server running?")
def health():
    """Always returns 200 while the server is up. `status` is "ok" when the model
    is loaded, "degraded" when the server runs but /predict cannot serve yet."""
    info = model_service.info()
    return {
        "status": "ok" if info["loaded"] else "degraded",
        "service": "smart-tomato-backend",
        "version": VERSION,
        "model": info,
        "database": database.status(),
    }


@router.get("/", include_in_schema=False)
def root():
    return {"service": "smart-tomato-backend", "docs": "/docs", "health": "/health",
            "model": settings.MODEL_NAME}
