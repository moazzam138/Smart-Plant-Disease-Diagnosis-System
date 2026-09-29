"""End-to-end API tests. Run from the backend folder:  python -m pytest -v"""
import json

import pytest

from app.config import settings
from app.data.diseases import DISEASES, canonical_key, display_name
from app.services.model_service import load_class_names
from tests.conftest import FIXTURES, make_image


def upload(client, data: bytes, name="leaf.png", ctype="image/png", path="/predict", headers=None):
    return client.post(path, files={"image": (name, data, ctype)}, headers=headers or {})


# ---------------- health ----------------
def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model"]["loaded"] is True
    assert body["model"]["num_classes"] == 10
    assert body["database"]["connected"] is True


# ---------------- predict: contract ----------------
@pytest.mark.parametrize("fmt,ctype", [("PNG", "image/png"), ("JPEG", "image/jpeg"), ("WEBP", "image/webp")])
def test_predict_returns_contract(client, fmt, ctype):
    r = upload(client, make_image(fmt), name=f"leaf.{fmt.lower()}", ctype=ctype)
    assert r.status_code == 200, r.text
    body = r.json()
    # Week 2 shared contract fields
    assert isinstance(body["disease"], str) and body["disease"].startswith("Tomato___")
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["model"] == "test-model"
    # additions
    assert body["display_name"] == display_name(body["disease"])
    assert body["status"] == "success" and body["is_mock"] is False
    tops = body["top_predictions"]
    assert len(tops) == settings.TOP_K
    assert tops[0]["label"] == body["disease"]
    assert [t["confidence"] for t in tops] == sorted((t["confidence"] for t in tops), reverse=True)
    assert body["saved"] is True and body["prediction_id"]


def test_predict_is_deterministic(client):
    img = make_image()
    a, b = upload(client, img).json(), upload(client, img).json()
    assert (a["disease"], a["confidence"]) == (b["disease"], b["confidence"])


def test_legacy_mobile_path_still_works(client):
    r = upload(client, make_image(), path="/api/predictions/analyze")
    assert r.status_code == 200


def test_octet_stream_is_accepted_if_real_image(client):
    r = upload(client, make_image("JPEG"), name="photo", ctype="application/octet-stream")
    assert r.status_code == 200


# ---------------- predict: validation ----------------
def test_missing_image_is_400(client):
    r = client.post("/predict")
    assert r.status_code == 400
    assert "image" in r.json()["detail"]


def test_swagger_empty_value_is_400(client):
    # What /docs sends when Execute is clicked without choosing a file
    r = client.post("/predict", data={"image": ""})
    assert r.status_code == 400
    assert "image" in r.json()["detail"]


def test_other_validation_errors_stay_422(client):
    assert client.post("/auth/register", json={"email": "not-an-email", "password": "secret123"}).status_code == 422


def test_image_field_is_required_file_in_docs(client):
    body = client.get("/openapi.json").json()["components"]["schemas"]["Body_predict_predict_post"]
    assert body["required"] == ["image"]
    assert "anyOf" not in body["properties"]["image"]  # plain file -> Swagger shows a file picker


def test_wrong_field_name_is_400(client):
    r = client.post("/predict", files={"file": ("leaf.png", make_image(), "image/png")})
    assert r.status_code == 400


def test_non_image_type_is_415(client):
    r = upload(client, b"hello", name="notes.txt", ctype="text/plain")
    assert r.status_code == 415


def test_corrupt_image_is_400(client):
    r = upload(client, b"\xff\xd8\xff not really a jpeg", name="x.jpg", ctype="image/jpeg")
    assert r.status_code == 400


def test_empty_file_is_400(client):
    r = upload(client, b"", name="x.jpg", ctype="image/jpeg")
    assert r.status_code == 400


def test_unsupported_real_format_is_400(client):
    r = upload(client, make_image("GIF"), name="x.gif", ctype="application/octet-stream")
    assert r.status_code == 400
    assert "Unsupported" in r.json()["detail"]


def test_too_large_is_413(client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0.001)
    r = upload(client, make_image(size=(400, 400)))
    assert r.status_code == 413


# ---------------- resilience ----------------
def test_predict_works_without_database(client_no_db):
    r = upload(client_no_db, make_image())
    assert r.status_code == 200
    assert r.json()["saved"] is False and r.json()["prediction_id"] is None
    assert client_no_db.get("/health").json()["database"]["connected"] is False
    assert client_no_db.get("/predictions").status_code == 503
    assert client_no_db.post("/auth/login", json={"email": "a@b.co", "password": "x"}).status_code == 503


def test_missing_model_gives_503_and_degraded_health(client_no_model):
    h = client_no_model.get("/health").json()
    assert h["status"] == "degraded" and h["model"]["loaded"] is False
    r = upload(client_no_model, make_image())
    assert r.status_code == 503
    # bad input is still reported as bad input, not as a server problem
    assert upload(client_no_model, b"junk", ctype="image/png").status_code == 400


def test_class_count_mismatch_is_detected(tmp_path, monkeypatch):
    from app.services.model_service import ModelService
    bad = tmp_path / "classes.json"
    bad.write_text(json.dumps(["a", "b", "c"]))
    monkeypatch.setattr(settings, "CLASS_NAMES_PATH", str(bad))
    svc = ModelService()
    svc.load()
    assert svc.loaded is False and "must match" in svc.error


# ---------------- auth ----------------
def _register(client, email="farmer@example.com", password="secret123"):
    return client.post("/auth/register", json={"email": email, "password": password, "name": "Test"})


def test_register_login_me(client):
    r = _register(client)
    assert r.status_code == 201
    token = r.json()["access_token"]
    assert _register(client).status_code == 409  # duplicate email
    assert client.post("/auth/login", json={"email": "farmer@example.com", "password": "wrong"}).status_code == 401
    r = client.post("/auth/login", json={"email": "FARMER@example.com", "password": "secret123"})
    assert r.status_code == 200
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["email"] == "farmer@example.com"
    assert "password_hash" not in me.json()


def test_me_requires_valid_token(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_short_password_rejected(client):
    assert _register(client, password="123").status_code == 422


# ---------------- history ----------------
def test_history_is_scoped_per_user(client):
    token = _register(client).json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}
    mine = upload(client, make_image(), headers=auth).json()["prediction_id"]
    anon = upload(client, make_image("JPEG"), name="a.jpg", ctype="image/jpeg").json()["prediction_id"]

    my_list = client.get("/predictions", headers=auth).json()
    assert my_list["total"] == 1 and my_list["items"][0]["id"] == mine
    anon_list = client.get("/predictions").json()
    assert [i["id"] for i in anon_list["items"]] == [anon]

    assert client.get(f"/predictions/{mine}", headers=auth).status_code == 200
    assert client.get(f"/predictions/{mine}").status_code == 404  # anonymous can't see it
    assert client.get("/predictions/not-an-id").status_code == 404

    assert client.delete(f"/predictions/{mine}").status_code == 401
    assert client.delete(f"/predictions/{mine}", headers=auth).status_code == 204
    assert client.get("/predictions", headers=auth).json()["total"] == 0


# ---------------- diseases / labels ----------------
def test_diseases_endpoints(client):
    all_ = client.get("/diseases").json()
    assert len(all_) == 10
    one = client.get("/diseases/Tomato___Spider_mites Two-spotted_spider_mite").json()
    assert one["key"] == "spider_mites"
    assert client.get("/diseases/banana").status_code == 404


def test_every_plantvillage_class_has_reference_info():
    names = load_class_names(FIXTURES / "class_names.json")
    keys = {canonical_key(n) for n in names}
    assert None not in keys and keys == set(DISEASES)


def test_display_names_match_mobile_treatment_keys():
    # TreatmentScreen looks up lower-cased names such as "early blight"
    assert display_name("Tomato___Early_blight").lower() == "early blight"
    assert display_name("Tomato___Late_blight").lower() == "late blight"
    assert display_name("Tomato___Leaf_Mold").lower() == "leaf mold"
    assert display_name("Tomato___healthy") == "Healthy"


def test_class_names_formats(tmp_path):
    p = tmp_path / "c.json"
    p.write_text(json.dumps({"1": "b", "0": "a"}))
    assert load_class_names(p) == ["a", "b"]
    p.write_text(json.dumps({"b": 1, "a": 0}))
    assert load_class_names(p) == ["a", "b"]
    t = tmp_path / "c.txt"
    t.write_text("a\nb\n")
    assert load_class_names(t) == ["a", "b"]
