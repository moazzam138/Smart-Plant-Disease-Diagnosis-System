from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Prediction ----------
class ClassScore(BaseModel):
    label: str
    score: float


class PredictionResponse(BaseModel):
    id: str
    disease: str
    confidence: float
    all_scores: list[ClassScore]
    image_name: Optional[str] = None
    created_at: datetime
    is_mock: bool = True


# ---------- Disease reference ----------
class Disease(BaseModel):
    label: str
    name: str
    description: str
    symptoms: str
    treatment: str