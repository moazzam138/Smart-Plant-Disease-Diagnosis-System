"""Basic email/password authentication with JWT (Week 1 leftover)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_db,
    verify_password,
)
from app.schemas import Token, UserLogin, UserPublic, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "created_at": user["created_at"],
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db=Depends(require_db)):
    doc = {
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    try:
        doc["_id"] = db["users"].insert_one(doc).inserted_id
    except DuplicateKeyError:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    return {"access_token": create_access_token(str(doc["_id"])), "user": _public(doc)}


@router.post("/login", response_model=Token)
def login(body: UserLogin, db=Depends(require_db)):
    user = db["users"].find_one({"email": body.email.lower()})
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    return {"access_token": create_access_token(str(user["_id"])), "user": _public(user)}


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(get_current_user)):
    return _public(user)
