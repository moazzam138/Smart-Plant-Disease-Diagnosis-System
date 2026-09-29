# Smart Tomato — Backend (FastAPI + MongoDB)

Serves the trained tomato-leaf model over HTTP so the mobile app can send a photo and get a diagnosis back.

```
Phone app ──POST /predict (photo)──▶ FastAPI ──▶ EfficientNetB0 FP16 (.tflite, loaded once)
          ◀── disease + confidence ──        └──▶ MongoDB Atlas (history, users) – optional
```

**Owner:** Member 4 (Backend + Database). **Model:** Member 2's EfficientNetB0 FP16 TFLite (swappable via `.env`).

---

## 1. Start the API (Windows, step by step)

Run these in **Command Prompt** from the repo folder.

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**Put Member 2's files in `backend\models\`:**

| File | What it is |
|---|---|
| `efficientnetb0_fp16.tflite` | The FP16 model (~8 MB) |
| `class_names.json` | Class names **in the exact training index order** (see `class_names.example.json` for the format) |

Model files are not committed to git (too large). Share them through Drive/Teams.

**Edit `backend\.env`:**
- `PREPROCESSING` — must match training. Keras `EfficientNetB0` has normalisation built in → `raw_0_255`. If unsure, run the sanity check in section 4, which finds it for you.
- `MONGODB_URI` — your Atlas connection string. Leave empty to run without a database (prediction still works; history and login are disabled).
- `JWT_SECRET` — generate one: `python -c "import secrets; print(secrets.token_hex(32))"`

**Start the server:**

```bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- `--host 0.0.0.0` is required so a phone on the same Wi‑Fi can reach it. If Windows Firewall asks, click **Allow** (Private networks).
- Open http://127.0.0.1:8000/docs for the interactive API page (Swagger).
- Open http://127.0.0.1:8000/health. You should see `"status": "ok"` and `"loaded": true`.

The startup log prints the model file, number of classes, input size, preprocessing mode and whether MongoDB connected.

> **No model yet?** Set `USE_MOCK_MODEL=true` in `.env` to get random predictions so the app can be wired up. The response then says `"model": "mock"` and `"is_mock": true`. **Never use mock output as evidence.**

---

## 2. Prediction contract (shared with Mobile and ML)

**Request:** `POST /predict` · `multipart/form-data` · field **`image`** (JPG, PNG or WebP, max 10 MB).
An `Authorization: Bearer <token>` header is optional. If it is sent, the saved prediction is linked to that user.

**Response `200`:**

```json
{
  "disease": "Tomato___Late_blight",
  "confidence": 0.942,
  "model": "efficientnetb0-fp16",
  "display_name": "Late Blight",
  "is_healthy": false,
  "top_predictions": [
    {"label": "Tomato___Late_blight", "display_name": "Late Blight", "confidence": 0.942},
    {"label": "Tomato___Early_blight", "display_name": "Early Blight", "confidence": 0.031},
    {"label": "Tomato___Target_Spot", "display_name": "Target Spot", "confidence": 0.012}
  ],
  "inference_ms": 41.3,
  "status": "success",
  "is_mock": false,
  "prediction_id": "66f9...",
  "saved": true,
  "created_at": "2026-09-29T07:14:07Z"
}
```

- `disease`, `confidence` (0–1) and `model` are the team contract fields. `disease` is the **raw ML label**, identical to the ML report and `class_names.json`.
- `display_name` is the readable name the app shows.
- `saved` is `false` (and `prediction_id` is `null`) when MongoDB is not connected. Prediction still succeeds.

**Errors** (body is always `{"detail": "<human-readable message>"}`):

| Code | When |
|---|---|
| 400 | No `image` field, empty file, corrupt file, or a format other than JPG/PNG/WebP |
| 413 | File larger than `MAX_UPLOAD_MB` |
| 415 | Upload declared as a non-image type (e.g. `text/plain`) |
| 503 | Model not loaded on the server (check `/health` → `model.error`) |

---

## 3. All endpoints

| Method | Path | Purpose | Needs DB | Needs login |
|---|---|---|---|---|
| GET | `/health` | Server, model and database status | – | – |
| POST | `/predict` | Diagnose one leaf image | – | optional |
| GET | `/predictions` | Saved history, newest first (`?limit=&skip=`) | ✓ | optional* |
| GET | `/predictions/{id}` | One saved prediction | ✓ | optional* |
| DELETE | `/predictions/{id}` | Delete your own prediction | ✓ | ✓ |
| GET | `/diseases` | All 10 classes with description, symptoms, management | – | – |
| GET | `/diseases/{label}` | One class by key, raw label or name | – | – |
| POST | `/auth/register` | `{email, password, name?}` → token | ✓ | – |
| POST | `/auth/login` | `{email, password}` → token | ✓ | – |
| GET | `/auth/me` | Current user | ✓ | ✓ |

\* Logged-in users see only their own history. Anonymous requests see only anonymous scans.

To try login-protected routes in `/docs`, call `/auth/login`, copy `access_token`, click **Authorize** and paste it.

**MongoDB collections** (database `smart_tomato`): `users` (unique email, bcrypt password hash), `predictions` (result, top‑3, model, image name/size, user, timestamp; the image itself is not stored), `diseases` (reference data, synced at startup).

---

## 4. Checking the real model (do this once Member 2's files are in place)

This covers Week 2 item 09 ("sanity check after moving the model into the API environment") and the integration check "backend verifies preprocessing matches training".

1. Ask Member 2 for 5–10 **test-set images whose predictions are in the ML report**, ideally one or more per class. Put them in class sub-folders:
   ```
   backend\sanity_images\Tomato___Early_blight\img_001.jpg
   backend\sanity_images\Tomato___healthy\img_104.jpg
   ```
   Alternatively, use a CSV with columns `image,expected_label,expected_confidence`.
2. Run:
   ```bat
   python scripts\sanity_check.py sanity_images --try-all-preprocessing
   ```
   It runs the images through the same code `/predict` uses with each preprocessing mode and tells you which one reproduces the ML report. Set that value in `.env`, then run it once more without the flag. It should report all images correct. Results are saved in `reports\`.

If no mode gets the images right, the class order in `class_names.json` is probably wrong. Get the exact list from the training notebook (`train_ds.class_names`).

---

## 5. Evidence for the 1 October presentation

With the server running, open a second terminal (`venv\Scripts\activate` first):

```bat
python scripts\api_evidence.py sanity_images\Tomato___Early_blight\img_001.jpg sanity_images\Tomato___healthy\img_104.jpg
```

This saves `reports\api_evidence\<timestamp>\` containing the `/health` JSON, one JSON file per image, three negative tests (missing field, text file, corrupt image), and `summary.md` with tables ready for the slides. Also take a screenshot of `/docs` and of one `/predict` call in Swagger.

---

## 6. Automated tests

```bat
pip install -r requirements-dev.txt
python -m pytest -v
```

25 tests cover the contract, validation (400/413/415), running without MongoDB, a missing model (503), register/login/JWT, per-user history, and the label mapping. They use a tiny bundled model and an in-memory database, so they need neither the real model nor Atlas.

---

## 7. Connecting the mobile app

1. Start the backend with `--host 0.0.0.0` (section 1).
2. Find your PC's address: run `ipconfig` and note the **IPv4 Address** of your Wi‑Fi adapter (e.g. `192.168.1.25`).
3. In `mobile\`, create `.env.local`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
   ```
   (For the Android emulator use `http://10.0.2.2:8000`, which is the default.)
4. `cd mobile`, `npm install`, `npx expo start -c`.
5. On the phone, open `http://192.168.1.25:8000/health` in the browser first. If that page doesn't load, the app won't connect either: check the Wi‑Fi (same network, not a guest network) and the firewall.
6. Scan → pick a leaf → **Analyze Leaf**. The result screen shows the disease name, confidence and `efficientnetb0-fp16`.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `/health` shows `"status": "degraded"` | Read `model.error`. Usually a wrong `MODEL_PATH`, a missing `class_names.json`, or a class count that doesn't match the model's outputs |
| Every image gets the same or wrong class | Wrong `PREPROCESSING` or wrong class order. Run the sanity check (section 4) |
| `database.connected: false` | Check `MONGODB_URI`; in Atlas go to **Network Access** and add your current IP |
| `pip install ai-edge-litert` fails | Run `python -m pip install --upgrade pip` and retry; as a fallback use `pip install tensorflow` (large). The code uses whichever is installed |
| App says "could not reach the prediction service" | Wrong IP in `.env.local`, server not started with `--host 0.0.0.0`, firewall, or phone on a different Wi‑Fi |
| Want to serve MobileNetV2 instead | Set `MODEL_PATH`, `MODEL_NAME=mobilenetv2` and `PREPROCESSING=mobilenet_v2` in `.env`. No code changes are needed |

---

## 9. Code layout

```
backend/
  app/
    main.py              startup: load model once, connect DB, register routes
    config.py            all settings (.env)
    database.py          optional MongoDB connection
    schemas.py           request/response models (the API contract)
    core/security.py     bcrypt + JWT
    services/
      preprocessing.py   decode, validate, resize (matches tf.image.resize), scale
      model_service.py   loads .tflite/.keras, runs inference, top-k
    data/diseases.py     label → display name + reference info
    routers/             health, predict, predictions, diseases, auth
  scripts/               sanity_check.py, api_evidence.py
  tests/                 pytest suite + tiny test model
  models/                put the real model files here (git-ignored)
```

**Limitation:** reported accuracy comes from the controlled PlantVillage test set and does not measure field performance. Field-oriented evaluation (PlantDoc) is the next phase.
