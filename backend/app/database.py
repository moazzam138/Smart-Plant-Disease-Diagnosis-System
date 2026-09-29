"""MongoDB connection. Optional by design: if the database is unreachable the
API still starts and /predict still works (Week 2 rule: history must never
block the core prediction path)."""
import logging
from typing import Optional

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.config import settings

log = logging.getLogger("smart_tomato.db")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_error: Optional[str] = None


def connect(client_factory=None) -> None:
    """Try to connect once at startup. Never raises."""
    global _client, _db, _error
    client_factory = client_factory or MongoClient
    if not settings.MONGODB_URI.strip():
        _error = "MONGODB_URI not set"
        log.warning("MongoDB disabled: MONGODB_URI is empty. History and auth are off.")
        return
    try:
        client = client_factory(
            settings.MONGODB_URI, serverSelectionTimeoutMS=settings.MONGO_TIMEOUT_MS
        )
        client.admin.command("ping")
        db = client[settings.DB_NAME]
        db["users"].create_index("email", unique=True)
        db["predictions"].create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        db["predictions"].create_index([("created_at", DESCENDING)])
        _client, _db, _error = client, db, None
        log.info("Connected to MongoDB database '%s'", settings.DB_NAME)
    except Exception as exc:  # network, auth, DNS...
        _client, _db = None, None
        _error = f"{type(exc).__name__}: {exc}"[:300]
        log.error("MongoDB unavailable, continuing without it: %s", _error)


def close() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


def get_db() -> Optional[Database]:
    return _db


def status() -> dict:
    if _db is not None:
        return {"connected": True, "database": settings.DB_NAME}
    return {"connected": False, "reason": _error}
