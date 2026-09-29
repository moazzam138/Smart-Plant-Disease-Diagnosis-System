"""Shared test setup. Tests use a tiny real .tflite model and an in-memory MongoDB
(mongomock), so they run on any laptop without the real model or Atlas."""
import io
import os
from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures"

# Must be set before app.config is imported.
os.environ.update(
    MODEL_PATH=str(FIXTURES / "tiny_model.tflite"),
    CLASS_NAMES_PATH=str(FIXTURES / "class_names.json"),
    MODEL_NAME="test-model",
    PREPROCESSING="raw_0_255",
    USE_MOCK_MODEL="false",
    MONGODB_URI="mongodb://in-memory-test",
    JWT_SECRET="test-secret-that-is-at-least-32-bytes-long",
)

import mongomock  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from app import database  # noqa: E402
from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.services.model_service import model_service  # noqa: E402


def make_image(fmt: str = "PNG", size=(256, 256), color=(60, 140, 60)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color)
    for x in range(0, size[0], 16):  # a little texture so it's not flat
        for y in range(0, size[1], 16):
            img.putpixel((x, y), (200, 180, 40))
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture()
def client(monkeypatch):
    """App with model loaded and an empty in-memory database."""
    monkeypatch.setattr(database, "MongoClient", mongomock.MongoClient)
    with TestClient(app) as c:
        yield c
    database.close()


@pytest.fixture()
def client_no_db(monkeypatch):
    """App with model loaded but MongoDB disabled."""
    monkeypatch.setattr(settings, "MONGODB_URI", "")
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def client_no_model(monkeypatch):
    """App whose model file is missing."""
    monkeypatch.setattr(settings, "MONGODB_URI", "")
    monkeypatch.setattr(settings, "MODEL_PATH", str(FIXTURES / "does_not_exist.tflite"))
    with TestClient(app) as c:
        yield c
    monkeypatch.undo()
    model_service.load()  # restore for other tests
