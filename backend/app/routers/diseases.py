"""Disease reference information for the app's result/treatment screens."""
from fastapi import APIRouter, HTTPException, status

from app.data.diseases import DISEASES, disease_info
from app.schemas import DiseaseInfo

router = APIRouter(prefix="/diseases", tags=["diseases"])


@router.get("", response_model=list[DiseaseInfo], summary="All supported classes")
def list_diseases():
    return [{"key": k, **v} for k, v in DISEASES.items()]


@router.get("/{label}", response_model=DiseaseInfo, summary="One disease by key or raw ML label")
def get_disease(label: str):
    """Accepts a key (`early_blight`), a raw label (`Tomato___Early_blight`) or a display name."""
    info = disease_info(label)
    if info is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown disease '{label}'.")
    return info
