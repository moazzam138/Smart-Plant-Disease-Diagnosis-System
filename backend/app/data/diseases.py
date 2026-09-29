"""Disease labels and reference information.

The model's raw class names (e.g. "Tomato___Spider_mites Two-spotted_spider_mite")
come from Member 2's class_names.json and are returned unchanged in the
`disease` field so they match the ML report. This module adds a readable
`display_name` and reference text for the app.

Guidance is general and educational; it deliberately contains no product
names or dosages. Users should confirm with a local agricultural adviser.
"""
import re
from typing import Optional

DISEASES: dict[str, dict] = {
    "bacterial_spot": {
        "display_name": "Bacterial Spot",
        "type": "Bacterial (Xanthomonas spp.)",
        "description": "A bacterial disease that spreads in warm, wet weather through splashing water, tools and infected seed.",
        "symptoms": "Small, dark, water-soaked spots on leaves that may turn brown with a yellow halo; spots can merge and leaves may drop.",
        "management": "Remove badly affected leaves, avoid overhead watering and working with wet plants, rotate crops and use clean seed or transplants.",
    },
    "early_blight": {
        "display_name": "Early Blight",
        "type": "Fungal (Alternaria spp.)",
        "description": "A common fungal disease that usually starts on older, lower leaves.",
        "symptoms": "Brown spots with concentric rings (a 'target' look), often with a yellow area around them; lower leaves yellow and fall.",
        "management": "Remove infected lower leaves, mulch to reduce soil splash, keep foliage dry, space plants for airflow and rotate crops.",
    },
    "late_blight": {
        "display_name": "Late Blight",
        "type": "Oomycete (Phytophthora infestans)",
        "description": "A fast-spreading, destructive disease favoured by cool, humid conditions.",
        "symptoms": "Large, greasy grey-green to dark brown patches on leaves, sometimes with white growth underneath in humid weather; stems and fruit can also rot.",
        "management": "Act quickly: remove and destroy affected plants, avoid wetting foliage, and seek local agricultural advice promptly because it can spread to nearby fields.",
    },
    "leaf_mold": {
        "display_name": "Leaf Mold",
        "type": "Fungal (Passalora fulva)",
        "description": "A fungal disease common in humid conditions, especially greenhouses.",
        "symptoms": "Pale green or yellow spots on the upper leaf surface with olive-green to brown velvety growth underneath.",
        "management": "Improve ventilation, reduce humidity, avoid wetting leaves and remove affected foliage.",
    },
    "septoria_leaf_spot": {
        "display_name": "Septoria Leaf Spot",
        "type": "Fungal (Septoria lycopersici)",
        "description": "A fungal leaf-spot disease that starts on lower leaves and moves upward.",
        "symptoms": "Many small, round spots with dark borders and grey or tan centres, sometimes with tiny black dots inside.",
        "management": "Remove infected lower leaves, mulch, avoid overhead watering, clear plant debris after harvest and rotate crops.",
    },
    "spider_mites": {
        "display_name": "Spider Mites",
        "type": "Pest (two-spotted spider mite)",
        "description": "Tiny sap-feeding mites that thrive in hot, dry conditions.",
        "symptoms": "Fine yellow or white speckling (stippling) on leaves, bronzing, and fine webbing on the underside in heavy infestations.",
        "management": "Check leaf undersides, spray plants with water to dislodge mites, remove heavily infested leaves and avoid water stress.",
    },
    "target_spot": {
        "display_name": "Target Spot",
        "type": "Fungal (Corynespora cassiicola)",
        "description": "A fungal disease favoured by warm, humid conditions.",
        "symptoms": "Brown spots with light centres and concentric rings on leaves; can look similar to early blight.",
        "management": "Improve airflow, remove lower infected leaves, avoid wet foliage and rotate crops.",
    },
    "yellow_leaf_curl_virus": {
        "display_name": "Yellow Leaf Curl Virus",
        "type": "Viral (TYLCV, spread by whiteflies)",
        "description": "A viral disease transmitted by whiteflies; infected plants cannot be cured.",
        "symptoms": "Upward curling and yellowing of leaf edges, small leaves, stunted growth and reduced fruit set.",
        "management": "Remove infected plants, control whiteflies, use insect netting and resistant varieties where available.",
    },
    "mosaic_virus": {
        "display_name": "Mosaic Virus",
        "type": "Viral (Tomato mosaic virus)",
        "description": "A highly contagious virus spread by contact, tools and hands; infected plants cannot be cured.",
        "symptoms": "Light and dark green mottled (mosaic) pattern on leaves, leaf distortion and stunted growth.",
        "management": "Remove infected plants, wash hands and disinfect tools, avoid handling plants when wet and use resistant varieties.",
    },
    "healthy": {
        "display_name": "Healthy",
        "type": "No disease detected",
        "description": "The leaf shows no signs of the diseases the model was trained on.",
        "symptoms": "None detected.",
        "management": "Keep monitoring regularly, water at the base of the plant and maintain good spacing and hygiene.",
    },
}

# Normalised raw-label fragments -> canonical key. Order matters (most specific first).
_KEY_PATTERNS: list[tuple[str, str]] = [
    ("yellowleafcurl", "yellow_leaf_curl_virus"),
    ("mosaic", "mosaic_virus"),
    ("spidermite", "spider_mites"),
    ("bacterialspot", "bacterial_spot"),
    ("earlyblight", "early_blight"),
    ("lateblight", "late_blight"),
    ("leafmold", "leaf_mold"),
    ("leafmould", "leaf_mold"),
    ("septoria", "septoria_leaf_spot"),
    ("targetspot", "target_spot"),
    ("healthy", "healthy"),
]


def canonical_key(raw_label: str) -> Optional[str]:
    """Map any PlantVillage-style label to a canonical disease key."""
    squashed = re.sub(r"[^a-z]", "", raw_label.lower())
    for fragment, key in _KEY_PATTERNS:
        if fragment in squashed:
            return key
    return None


def display_name(raw_label: str) -> str:
    key = canonical_key(raw_label)
    if key:
        return DISEASES[key]["display_name"]
    # Fallback: "Tomato___Some_label" -> "Some Label"
    text = re.sub(r"^tomato_+", "", raw_label, flags=re.IGNORECASE)
    return " ".join(w.capitalize() for w in re.split(r"[_\s]+", text) if w) or raw_label


def disease_info(raw_or_key: str) -> Optional[dict]:
    key = raw_or_key if raw_or_key in DISEASES else canonical_key(raw_or_key)
    if not key:
        return None
    return {"key": key, **DISEASES[key]}
