"""Sanity check: run known images through the SAME code the API uses and compare
with the expected labels (Week 2 item 09 / integration check "backend verifies
preprocessing matches the training pipeline").

Images can be given two ways:
  1) a folder of class sub-folders:   sanity_images/Tomato___Early_blight/img1.jpg
  2) a CSV with columns  image,expected_label[,expected_confidence]
     (image paths relative to the CSV file)

Examples (run from the backend folder, venv active):
  python scripts/sanity_check.py sanity_images
  python scripts/sanity_check.py sanity_images --try-all-preprocessing
  python scripts/sanity_check.py expected.csv

Results are printed and saved to reports/sanity_check_<mode>.csv
"""
import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.services.model_service import ModelService  # noqa: E402

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MODES = ["raw_0_255", "mobilenet_v2", "rescale_0_1"]


def collect(source: Path) -> list[dict]:
    items = []
    if source.is_dir():
        for class_dir in sorted(p for p in source.iterdir() if p.is_dir()):
            for img in sorted(class_dir.iterdir()):
                if img.suffix.lower() in IMAGE_EXT:
                    items.append({"image": img, "expected": class_dir.name, "expected_conf": None})
    elif source.suffix.lower() == ".csv":
        with source.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                conf = row.get("expected_confidence")
                items.append({
                    "image": (source.parent / row["image"]).resolve(),
                    "expected": row["expected_label"].strip(),
                    "expected_conf": float(conf) if conf not in (None, "") else None,
                })
    else:
        sys.exit(f"Not a folder or .csv file: {source}")
    if not items:
        sys.exit(f"No images found in {source}")
    return items


def run(items: list[dict], mode: str, verbose: bool) -> tuple[int, list[dict]]:
    settings.PREPROCESSING = mode
    svc = ModelService()
    svc.load()
    if not svc.loaded:
        sys.exit(f"Model failed to load: {svc.error}")
    unknown = {i["expected"] for i in items} - set(svc.class_names)
    if unknown:
        print(f"WARNING: expected labels not in class_names.json: {sorted(unknown)}")

    rows, correct = [], 0
    for it in items:
        res = svc.predict_bytes(Path(it["image"]).read_bytes())
        ok = res["disease"] == it["expected"]
        correct += ok
        conf_diff = (
            round(abs(res["confidence"] - it["expected_conf"]), 4)
            if it["expected_conf"] is not None and ok else ""
        )
        rows.append({
            "image": Path(it["image"]).name,
            "expected": it["expected"],
            "predicted": res["disease"],
            "confidence": res["confidence"],
            "match": "YES" if ok else "NO",
            "conf_diff_vs_report": conf_diff,
            "inference_ms": res["inference_ms"],
        })
        if verbose:
            flag = "OK " if ok else "XX "
            print(f"  {flag}{rows[-1]['image'][:40]:40s} expected={it['expected'][:30]:30s} "
                  f"got={res['disease'][:30]:30s} {res['confidence']:.3f}")
    return correct, rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", type=Path, help="folder of class sub-folders, or a CSV file")
    ap.add_argument("--try-all-preprocessing", action="store_true",
                    help="run every preprocessing mode to find the one that matches training")
    args = ap.parse_args()

    items = collect(args.source)
    modes = MODES if args.try_all_preprocessing else [settings.PREPROCESSING]
    print(f"Model: {settings.MODEL_PATH} | images: {len(items)}\n")

    out_dir = settings.resolve("reports")
    out_dir.mkdir(exist_ok=True)
    summary = []
    for mode in modes:
        print(f"== PREPROCESSING={mode}")
        correct, rows = run(items, mode, verbose=len(modes) == 1)
        acc = correct / len(items)
        summary.append((mode, correct, acc))
        path = out_dir / f"sanity_check_{mode}.csv"
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
        print(f"   {correct}/{len(items)} correct ({acc:.0%})  -> saved {path}\n")

    if len(summary) > 1:
        best = max(summary, key=lambda s: s[2])
        print("Summary:")
        for mode, correct, acc in summary:
            print(f"   {mode:14s} {correct}/{len(items)}  ({acc:.0%})" + ("   <- best" if mode == best[0] else ""))
        print(f"\nSet PREPROCESSING={best[0]} in backend/.env (and confirm with the ML lead).")

    # Non-zero exit if the configured mode did not reproduce every expected label
    sys.exit(0 if all(c == len(items) for m, c, _ in summary if m == settings.PREPROCESSING) else 1)


if __name__ == "__main__":
    main()
