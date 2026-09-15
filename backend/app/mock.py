import random

TOMATO_CLASSES = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites",
    "Tomato___Target_Spot",
    "Tomato___Yellow_Leaf_Curl_Virus",
    "Tomato___Mosaic_virus",
    "Tomato___healthy",
]


def mock_predict():
    raw = {c: random.random() for c in TOMATO_CLASSES}
    winner = random.choice(TOMATO_CLASSES)
    raw[winner] += 2.0
    total = sum(raw.values())
    scores = [{"label": c, "score": round(v / total, 4)} for c, v in raw.items()]
    scores.sort(key=lambda s: s["score"], reverse=True)
    top = scores[0]
    return {"disease": top["label"], "confidence": top["score"], "all_scores": scores}