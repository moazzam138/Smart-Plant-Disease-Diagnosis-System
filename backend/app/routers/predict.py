from fastapi import APIRouter, UploadFile, File
from datetime import datetime, timezone

from app.mock import mock_predict
from app.models.schemas import PredictionResponse

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(file: UploadFile = File(...)):
    result = mock_predict()
    return PredictionResponse(
        id="temp",
        disease=result["disease"],
        confidence=result["confidence"],
        all_scores=result["all_scores"],
        image_name=file.filename,
        created_at=datetime.now(timezone.utc),
        is_mock=True,
    )