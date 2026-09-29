"""Smart Tomato backend - FastAPI entry point.

Start (from the backend folder):  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import database
from app.config import settings
from app.data.diseases import DISEASES
from app.routers import auth, diseases, health, predict, predictions
from app.routers.health import VERSION
from app.services.model_service import model_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _seed_diseases() -> None:
    """Keep the diseases collection in sync with the reference data."""
    db = database.get_db()
    if db is None:
        return
    now = datetime.now(timezone.utc)
    for key, info in DISEASES.items():
        db["diseases"].update_one(
            {"key": key}, {"$set": {"key": key, **info, "updated_at": now}}, upsert=True
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.JWT_SECRET.startswith("change-me"):
        logging.getLogger("smart_tomato").warning("JWT_SECRET is the default value - set it in backend/.env")
    model_service.load()  # load ONCE at startup, not per request
    database.connect()  # optional; never blocks startup
    try:
        _seed_diseases()
    except Exception as exc:
        logging.getLogger("smart_tomato").warning("Could not seed diseases: %s", exc)
    yield
    database.close()


app = FastAPI(
    title="Smart Tomato Backend",
    version=VERSION,
    description=(
        "Tomato leaf disease diagnosis API.\n\n"
        "**Core path:** `POST /predict` with a leaf photo in the multipart field `image`.\n\n"
        "Model accuracy figures come from the controlled PlantVillage test set and are "
        "not a measure of real field performance."
    ),
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(predictions.router)
app.include_router(diseases.router)
app.include_router(auth.router)
