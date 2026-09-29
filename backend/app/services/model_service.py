"""Model loading and inference (Week 2 items 03, 05, 06).

The model is loaded ONCE at application startup and kept in memory.
Supported formats:
  * .tflite         -> LiteRT (ai-edge-litert), falls back to tensorflow if installed
  * .keras / .h5    -> requires full TensorFlow (pip install tensorflow)
"""
import json
import logging
import random
import threading
import time
from pathlib import Path
from typing import Optional

import numpy as np

from app.config import settings
from app.data.diseases import display_name
from app.services.preprocessing import decode_image, preprocess

log = logging.getLogger("smart_tomato.model")

# Fallback list, used ONLY by the development mock. Real serving always
# reads Member 2's class_names.json so indices match training exactly.
PLANTVILLAGE_TOMATO_CLASSES = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


class ModelNotReadyError(RuntimeError):
    pass


def load_class_names(path: Path) -> list[str]:
    """Accepts a JSON list, a JSON {"0": "name", ...} / {"name": 0, ...} map, or a .txt file."""
    if not path.exists():
        raise FileNotFoundError(f"Class-name file not found: {path}")
    text = path.read_text(encoding="utf-8").strip()
    if path.suffix.lower() == ".txt":
        names = [line.strip() for line in text.splitlines() if line.strip()]
    else:
        data = json.loads(text)
        if isinstance(data, dict) and "class_names" in data:
            data = data["class_names"]
        if isinstance(data, list):
            names = [str(n) for n in data]
        elif isinstance(data, dict):
            if all(str(k).isdigit() for k in data):  # {"0": "name"}
                names = [str(data[k]) for k in sorted(data, key=lambda k: int(k))]
            else:  # {"name": 0}
                names = [str(k) for k, _ in sorted(data.items(), key=lambda kv: int(kv[1]))]
        else:
            raise ValueError("Class-name JSON must be a list or an index map.")
    if len(names) != len(set(names)):
        raise ValueError("Class-name file contains duplicate names.")
    return names


def _softmax_if_needed(scores: np.ndarray) -> np.ndarray:
    scores = scores.astype(np.float64)
    if scores.min() >= 0 and abs(scores.sum() - 1.0) < 1e-2:
        return scores / scores.sum()
    exp = np.exp(scores - scores.max())  # model returned logits
    return exp / exp.sum()


class _TFLiteBackend:
    def __init__(self, path: Path):
        try:
            from ai_edge_litert.interpreter import Interpreter
            self.runtime = "ai-edge-litert"
        except ImportError:
            try:
                from tensorflow.lite import Interpreter  # type: ignore
                self.runtime = "tensorflow"
            except ImportError as exc:
                raise RuntimeError(
                    "No TFLite runtime installed. Run: pip install ai-edge-litert"
                ) from exc
        self.interpreter = Interpreter(model_path=str(path))
        self.interpreter.allocate_tensors()
        self.inp = self.interpreter.get_input_details()[0]
        self.out = self.interpreter.get_output_details()[0]
        shape = self.inp["shape"]
        self.input_hw = (int(shape[1]), int(shape[2])) if len(shape) == 4 and shape[1] > 0 else None
        self.num_outputs = int(self.out["shape"][-1])

    def run(self, batch: np.ndarray) -> np.ndarray:
        dtype = self.inp["dtype"]
        if dtype in (np.uint8, np.int8):  # fully-quantised INT8 model
            scale, zero = self.inp["quantization"]
            info = np.iinfo(dtype)
            batch = np.clip(np.round(batch / scale + zero), info.min, info.max)
        self.interpreter.set_tensor(self.inp["index"], batch.astype(dtype))
        self.interpreter.invoke()
        out = self.interpreter.get_tensor(self.out["index"])[0]
        if self.out["dtype"] in (np.uint8, np.int8):
            scale, zero = self.out["quantization"]
            out = (out.astype(np.float32) - zero) * scale
        return out


class _KerasBackend:
    def __init__(self, path: Path):
        try:
            import tensorflow as tf  # noqa: F401
        except ImportError as exc:
            raise RuntimeError(
                f"{path.suffix} models need full TensorFlow: pip install tensorflow "
                "(or use the .tflite file instead)."
            ) from exc
        import tensorflow as tf
        self.runtime = f"tensorflow {tf.__version__}"
        self.model = tf.keras.models.load_model(str(path), compile=False)
        shape = self.model.input_shape
        self.input_hw = (int(shape[1]), int(shape[2])) if shape[1] else None
        self.num_outputs = int(self.model.output_shape[-1])

    def run(self, batch: np.ndarray) -> np.ndarray:
        return np.asarray(self.model(batch, training=False))[0]


class ModelService:
    """Holds the loaded model. One instance per process, created at startup."""

    def __init__(self):
        self.backend = None
        self.class_names: list[str] = []
        self.loaded = False
        self.is_mock = False
        self.error: Optional[str] = None
        self.input_hw = (settings.IMAGE_SIZE, settings.IMAGE_SIZE)
        self.runtime: Optional[str] = None
        self._lock = threading.Lock()  # TFLite interpreters are not thread-safe

    # ---------- loading ----------
    def load(self) -> None:
        model_path = settings.resolve(settings.MODEL_PATH)
        classes_path = settings.resolve(settings.CLASS_NAMES_PATH)
        try:
            if settings.USE_MOCK_MODEL:
                self._load_mock(classes_path)
                return
            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            self.class_names = load_class_names(classes_path)
            suffix = model_path.suffix.lower()
            if suffix == ".tflite":
                self.backend = _TFLiteBackend(model_path)
            elif suffix in (".keras", ".h5"):
                self.backend = _KerasBackend(model_path)
            else:
                raise ValueError(f"Unsupported model format '{suffix}' (use .tflite, .keras or .h5)")
            if self.backend.num_outputs != len(self.class_names):
                raise ValueError(
                    f"Model has {self.backend.num_outputs} outputs but class-name file has "
                    f"{len(self.class_names)} names. They must match."
                )
            if self.backend.input_hw:
                self.input_hw = self.backend.input_hw
            self.runtime = self.backend.runtime
            self.loaded, self.error = True, None
            log.info(
                "Model loaded: %s | %d classes | input %sx%s | preprocessing=%s | runtime=%s",
                model_path.name, len(self.class_names), *self.input_hw,
                settings.PREPROCESSING, self.runtime,
            )
        except Exception as exc:
            self.loaded = False
            self.error = f"{type(exc).__name__}: {exc}"
            log.error("Model NOT loaded - /predict will return 503. %s", self.error)

    def _load_mock(self, classes_path: Path) -> None:
        try:
            self.class_names = load_class_names(classes_path)
        except Exception:
            self.class_names = list(PLANTVILLAGE_TOMATO_CLASSES)
        self.is_mock, self.loaded, self.runtime = True, True, "mock"
        log.warning("USE_MOCK_MODEL=true: predictions are RANDOM. Never use this for evidence.")

    def info(self) -> dict:
        return {
            "loaded": self.loaded,
            "name": "mock" if self.is_mock else settings.MODEL_NAME,
            "is_mock": self.is_mock,
            "file": Path(settings.MODEL_PATH).name,
            "runtime": self.runtime,
            "num_classes": len(self.class_names),
            "input_size": list(self.input_hw),
            "preprocessing": settings.PREPROCESSING,
            "error": self.error,
        }

    # ---------- inference ----------
    def predict_bytes(self, data: bytes) -> dict:
        """Decode, preprocess and classify one image. Raises InvalidImageError / ModelNotReadyError."""
        img = decode_image(data)  # validates before we touch the model
        if not self.loaded:
            raise ModelNotReadyError(self.error or "Model is not loaded.")

        start = time.perf_counter()
        if self.is_mock:
            probs = np.random.dirichlet(np.ones(len(self.class_names)) * 0.3)
            probs[random.randrange(len(probs))] += 1.0
            probs = probs / probs.sum()
        else:
            batch = preprocess(img, *self.input_hw, settings.PREPROCESSING)
            with self._lock:
                raw = self.backend.run(batch)
            probs = _softmax_if_needed(np.asarray(raw).reshape(-1))
        elapsed_ms = (time.perf_counter() - start) * 1000

        order = np.argsort(probs)[::-1]
        top = [
            {
                "label": self.class_names[i],
                "display_name": display_name(self.class_names[i]),
                "confidence": round(float(probs[i]), 4),
            }
            for i in order[: max(1, settings.TOP_K)]
        ]
        return {
            "disease": top[0]["label"],
            "display_name": top[0]["display_name"],
            "confidence": top[0]["confidence"],
            "top_predictions": top,
            "inference_ms": round(elapsed_ms, 2),
            "image_width": img.width,
            "image_height": img.height,
        }


model_service = ModelService()
