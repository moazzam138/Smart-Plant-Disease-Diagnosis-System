"""Request/response models. These define the API contract shown in /docs."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)  # bcrypt uses max 72 bytes
    name: Optional[str] = Field(default=None, max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- Prediction ----------
class ClassScore(BaseModel):
    label: str = Field(description="Raw class name exactly as in the ML report")
    display_name: str
    confidence: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    """Shared prediction contract. `disease`, `confidence` and `model` are the
    required fields from the Week 2 team contract; the rest are additions."""

    disease: str = Field(description="Raw ML class label, e.g. Tomato___Late_blight")
    confidence: float = Field(ge=0, le=1, description="Top-1 probability, 0..1")
    model: str = Field(description="Model name/version that produced the result")
    display_name: str = Field(description="Readable name for the app, e.g. Late Blight")
    is_healthy: bool
    top_predictions: list[ClassScore]
    inference_ms: float
    status: str = "success"
    is_mock: bool = False
    prediction_id: Optional[str] = Field(default=None, description="Set when saved to MongoDB")
    saved: bool = False
    created_at: datetime


class PredictionRecord(BaseModel):
    id: str
    disease: str
    display_name: str
    confidence: float
    model: str
    is_healthy: bool
    top_predictions: list[ClassScore]
    image_name: Optional[str] = None
    user_id: Optional[str] = None
    created_at: datetime


class PredictionList(BaseModel):
    total: int
    items: list[PredictionRecord]


# ---------- Disease reference ----------
class DiseaseInfo(BaseModel):
    key: str
    display_name: str
    type: str
    description: str
    symptoms: str
    management: str


# ---------- Health ----------
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model: dict
    database: dict
