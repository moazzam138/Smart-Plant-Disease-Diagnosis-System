"""Image decoding and preprocessing for inference.

The goal (Week 2, item 04) is to feed the model exactly what it saw during
training. Keras `image_dataset_from_directory` resizes with TensorFlow's
bilinear resize (half-pixel centres, no antialiasing), so that is what
`tf_bilinear_resize` reproduces here with NumPy, without needing TensorFlow.
"""
import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

# Pillow format name -> MIME type we accept.
ALLOWED_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
ALLOWED_CONTENT_TYPES = set(ALLOWED_FORMATS.values()) | {"image/jpg"}


class InvalidImageError(ValueError):
    """Raised when uploaded bytes are not a usable JPG/PNG/WebP image."""


def decode_image(data: bytes) -> Image.Image:
    """Decode bytes into an RGB PIL image, verifying the real file format."""
    if not data:
        raise InvalidImageError("The uploaded file is empty.")
    try:
        probe = Image.open(io.BytesIO(data))
        fmt = probe.format
        probe.verify()  # detects truncated/corrupt files
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise InvalidImageError("The file is not a readable image.") from exc
    if fmt not in ALLOWED_FORMATS:
        raise InvalidImageError(
            f"Unsupported image format '{fmt}'. Please upload a JPG, PNG or WebP image."
        )
    img = Image.open(io.BytesIO(data))  # verify() invalidates the first handle
    img = ImageOps.exif_transpose(img)  # phone photos: respect camera rotation
    if img.width < 32 or img.height < 32:
        raise InvalidImageError("The image is too small to analyse (minimum 32x32 pixels).")
    return img.convert("RGB")


def tf_bilinear_resize(arr: np.ndarray, height: int, width: int) -> np.ndarray:
    """NumPy equivalent of tf.image.resize(method='bilinear', antialias=False)."""
    in_h, in_w = arr.shape[:2]
    if (in_h, in_w) == (height, width):
        return arr.astype(np.float32)

    def coords(out_size: int, in_size: int):
        scale = in_size / out_size
        src = (np.arange(out_size, dtype=np.float64) + 0.5) * scale - 0.5
        src = np.clip(src, 0, in_size - 1)
        lo = np.floor(src).astype(np.int64)
        hi = np.minimum(lo + 1, in_size - 1)
        return lo, hi, (src - lo).astype(np.float32)

    y0, y1, wy = coords(height, in_h)
    x0, x1, wx = coords(width, in_w)
    a = arr.astype(np.float32)
    top = a[y0][:, x0] * (1 - wx)[None, :, None] + a[y0][:, x1] * wx[None, :, None]
    bot = a[y1][:, x0] * (1 - wx)[None, :, None] + a[y1][:, x1] * wx[None, :, None]
    return top * (1 - wy)[:, None, None] + bot * wy[:, None, None]


def scale_pixels(arr: np.ndarray, mode: str) -> np.ndarray:
    """Apply the model-specific pixel scaling. `arr` is float32 in 0..255."""
    if mode == "raw_0_255":  # keras EfficientNet: normalisation is inside the model
        return arr
    if mode == "mobilenet_v2":  # tf.keras.applications.mobilenet_v2.preprocess_input
        return arr / 127.5 - 1.0
    if mode == "rescale_0_1":
        return arr / 255.0
    raise ValueError(f"Unknown PREPROCESSING mode: {mode}")


def preprocess(img: Image.Image, height: int, width: int, mode: str) -> np.ndarray:
    """RGB PIL image -> float32 batch of shape (1, height, width, 3)."""
    arr = np.asarray(img, dtype=np.uint8)
    arr = tf_bilinear_resize(arr, height, width)
    arr = scale_pixels(arr, mode)
    return np.expand_dims(arr.astype(np.float32), 0)
