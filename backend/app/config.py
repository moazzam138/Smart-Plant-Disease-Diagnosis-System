"""Application settings, read from environment variables or backend/.env."""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent

PreprocessingMode = Literal["raw_0_255", "mobilenet_v2", "rescale_0_1"]


class Settings(BaseSettings):
    # ---------- Model serving ----------
    # Path to the model file (.tflite recommended; .keras/.h5 needs full TensorFlow).
    MODEL_PATH: str = "models/efficientnetb0_fp16.tflite"
    # JSON list of class names in the exact index order used during training.
    CLASS_NAMES_PATH: str = "models/class_names.json"
    # Name returned in every prediction response ("model" field).
    MODEL_NAME: str = "efficientnetb0-fp16"
    # How pixels are scaled before they reach the model. Must match training:
    #   raw_0_255    -> keras EfficientNetB0 (normalisation is inside the model)
    #   mobilenet_v2 -> tf.keras.applications.mobilenet_v2.preprocess_input (-1..1)
    #   rescale_0_1  -> pixels / 255
    PREPROCESSING: PreprocessingMode = "raw_0_255"
    # Used only if the model file does not declare a fixed input size.
    IMAGE_SIZE: int = 224
    # Development only: serve random predictions when no model file is present.
    USE_MOCK_MODEL: bool = False
    TOP_K: int = 3

    # ---------- Uploads ----------
    MAX_UPLOAD_MB: float = 10.0

    # ---------- Database (optional) ----------
    # Leave empty to run without MongoDB; /predict still works, history/auth are disabled.
    MONGODB_URI: str = ""
    DB_NAME: str = "smart_tomato"
    MONGO_TIMEOUT_MS: int = 3000

    # ---------- Auth ----------
    JWT_SECRET: str = "change-me-in-.env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # ---------- CORS ----------
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    def resolve(self, path: str) -> Path:
        """Resolve a path relative to the backend folder."""
        p = Path(path)
        return p if p.is_absolute() else BACKEND_DIR / p


settings = Settings()
