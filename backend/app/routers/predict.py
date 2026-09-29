"""POST /predict - the core diagnosis endpoint (Week 2 items 02-08, 10)."""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app import database
from app.config import settings
from app.core.security import get_optional_user
from app.data.diseases import canonical_key
from app.schemas import PredictionResponse
from app.services.model_service import ModelNotReadyError, model_service
from app.services.preprocessing import ALLOWED_CONTENT_TYPES, InvalidImageError

log = logging.getLogger("smart_tomato.predict")
router = APIRouter(tags=["prediction"])

ERROR_RESPONSES = {
    400: {"description": "No image, empty file, or not a readable image"},
    413: {"description": "Image larger than MAX_UPLOAD_MB"},
    415: {"description": "Unsupported file type (use JPG, PNG or WebP)"},
    503: {"description": "Model not loaded on the server"},
}


MISSING_IMAGE_MESSAGE = (
    "No image uploaded. Send the photo as multipart/form-data in a field named 'image'."
)
PREDICT_PATHS = {"/predict", "/api/predictions/analyze"}


async def _read_upload(image: UploadFile) -> bytes:
    ctype = (image.content_type or "").lower().split(";")[0].strip()
    if ctype and ctype not in ALLOWED_CONTENT_TYPES and ctype != "application/octet-stream":
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported file type '{ctype}'. Please upload a JPG, PNG or WebP image.",
        )
    limit = int(settings.MAX_UPLOAD_MB * 1024 * 1024)
    data = await image.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(
            413,
            f"Image is too large. Maximum size is {settings.MAX_UPLOAD_MB:g} MB.",
        )
    return data


def _save(result: dict, image_name: Optional[str], user: Optional[dict]) -> Optional[str]:
    """Best-effort history save. Failure is logged and never breaks /predict."""
    db = database.get_db()
    if db is None:
        return None
    try:
        doc = {
            "user_id": str(user["_id"]) if user else None,
            "disease": result["disease"],
            "display_name": result["display_name"],
            "confidence": result["confidence"],
            "model": result["model"],
            "is_healthy": result["is_healthy"],
            "top_predictions": result["top_predictions"],
            "is_mock": result["is_mock"],
            "image_name": image_name,
            "image_width": result["image_width"],
            "image_height": result["image_height"],
            "inference_ms": result["inference_ms"],
            "created_at": result["created_at"],
        }
        return str(db["predictions"].insert_one(doc).inserted_id)
    except Exception as exc:
        log.error("Could not save prediction to MongoDB: %s", exc)
        return None


async def _predict(image: UploadFile, user: Optional[dict]) -> dict:
    data = await _read_upload(image)
    try:
        result = await run_in_threadpool(model_service.predict_bytes, data)
    except InvalidImageError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    except ModelNotReadyError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            f"The prediction model is not loaded on the server. {exc}",
        )
    except Exception:
        log.exception("Inference failed")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Prediction failed on the server.")

    result.update(
        model="mock" if model_service.is_mock else settings.MODEL_NAME,
        is_healthy=canonical_key(result["disease"]) == "healthy",
        is_mock=model_service.is_mock,
        created_at=datetime.now(timezone.utc),
        status="success",
    )
    prediction_id = await run_in_threadpool(_save, result, image.filename, user)
    result.update(prediction_id=prediction_id, saved=prediction_id is not None)
    return result


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses=ERROR_RESPONSES,
    summary="Diagnose one tomato leaf image",
)
async def predict(
    image: UploadFile = File(..., description="Leaf photo (JPG, PNG or WebP)"),
    user: Optional[dict] = Depends(get_optional_user),
):
    """Upload one image as multipart/form-data in the field **image**.
    A Bearer token is optional; if sent, the saved prediction is linked to that user."""
    return await _predict(image, user)


# Older path used by the first version of the mobile app. Kept so an app that
# has not pulled the latest config still works. Not shown in /docs.
@router.post("/api/predictions/analyze", response_model=PredictionResponse, include_in_schema=False)
async def predict_legacy(
    image: UploadFile = File(...),
    user: Optional[dict] = Depends(get_optional_user),
):
    return await _predict(image, user)
