"""Prediction history stored in MongoDB (Week 2 item 10)."""
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, get_optional_user, require_db
from app.schemas import PredictionList, PredictionRecord

router = APIRouter(prefix="/predictions", tags=["history"])


def _to_record(doc: dict) -> dict:
    return {**doc, "id": str(doc["_id"])}


def _object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")


def _scope(user: Optional[dict]) -> dict:
    """Logged-in users see their own history; anonymous callers see anonymous scans."""
    return {"user_id": str(user["_id"]) if user else None}


@router.get("", response_model=PredictionList, summary="List saved predictions (newest first)")
def list_predictions(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user: Optional[dict] = Depends(get_optional_user),
    db=Depends(require_db),
):
    query = _scope(user)
    cursor = db["predictions"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    return {
        "total": db["predictions"].count_documents(query),
        "items": [_to_record(d) for d in cursor],
    }


@router.get("/{prediction_id}", response_model=PredictionRecord, summary="Get one saved prediction")
def get_prediction(
    prediction_id: str,
    user: Optional[dict] = Depends(get_optional_user),
    db=Depends(require_db),
):
    doc = db["predictions"].find_one({"_id": _object_id(prediction_id), **_scope(user)})
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")
    return _to_record(doc)


@router.delete(
    "/{prediction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of your saved predictions (login required)",
)
def delete_prediction(
    prediction_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(require_db),
):
    result = db["predictions"].delete_one(
        {"_id": _object_id(prediction_id), "user_id": str(user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")
