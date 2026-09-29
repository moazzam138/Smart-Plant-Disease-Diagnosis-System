"""
01_audit_dataset.py

PURPOSE
-------
Run this FIRST on every dataset you download (PlantVillage, PlantDoc,
Tomato-Village, etc.) before doing anything else to it.

It answers the questions you need answered on Day 2:
- How many images total?
- What are the exact class folder names?
- How many images per class? (imbalance check)
- Are any files corrupted / unreadable?
- What resolutions/aspect ratios are present?

EXPECTED FOLDER STRUCTURE
--------------------------
This script assumes the standard "ImageFolder" layout, which is how
PlantVillage and PlantDoc are usually distributed:

    <dataset_root>/
        ClassName1/
            img001.jpg
            img002.jpg
        ClassName2/
            img001.jpg
            ...

If your downloaded dataset has a different structure (e.g. a CSV of
labels, like some Tomato-Village distributions), tell me and I'll
adapt this script for that format instead.

HOW TO RUN
----------
    python 01_audit_dataset.py --dataset_root data/raw/plantvillage --output_name plantvillage

This produces two files in data/audit/:
    plantvillage_class_counts.csv   -> per-class image counts
    plantvillage_audit_report.md    -> human-readable summary

WHAT TO DO WITH THE OUTPUT
---------------------------
1. Open the class_counts.csv and look for classes with very few images
   (under ~200-300 is a common danger zone).
2. Read the corrupted files list in the report - decide whether to
   discard or try to repair those files.
3. Note the exact class folder names somewhere safe - you'll need
   these exact strings for the class-mapping step (Day 3-4).
4. Run this on EVERY dataset before moving to Day 3.
"""

import argparse
import os
from pathlib import Path
from collections import defaultdict

from PIL import Image
import pandas as pd
from tqdm import tqdm

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


def audit_dataset(dataset_root: str, output_name: str, output_dir: str = "data/audit"):
    dataset_root = Path(dataset_root)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not dataset_root.exists():
        raise FileNotFoundError(f"Dataset root not found: {dataset_root}")

    class_folders = sorted([d for d in dataset_root.iterdir() if d.is_dir()])
    if not class_folders:
        raise ValueError(
            f"No class subfolders found inside {dataset_root}. "
            "Check that this is an ImageFolder-style dataset."
        )

    class_counts = {}
    corrupted_files = []
    resolutions = []
    total_images = 0

    print(f"Found {len(class_folders)} class folders in {dataset_root.name}")

    for class_folder in class_folders:
        class_name = class_folder.name
        image_files = [
            f for f in class_folder.iterdir()
            if f.suffix.lower() in VALID_EXTENSIONS
        ]
        class_counts[class_name] = len(image_files)
        total_images += len(image_files)

        for img_path in tqdm(image_files, desc=f"Checking {class_name}", leave=False):
            try:
                with Image.open(img_path) as img:
                    img.verify()
                with Image.open(img_path) as img:
                    resolutions.append(img.size)
            except Exception as e:
                corrupted_files.append((str(img_path), str(e)))

    # Save per-class counts as CSV
    counts_df = pd.DataFrame(
        sorted(class_counts.items(), key=lambda x: -x[1]),
        columns=["class_name", "image_count"]
    )
    counts_csv_path = output_dir / f"{output_name}_class_counts.csv"
    counts_df.to_csv(counts_csv_path, index=False)

    # Resolution stats
    if resolutions:
        widths = [r[0] for r in resolutions]
        heights = [r[1] for r in resolutions]
        res_summary = {
            "min_width": min(widths), "max_width": max(widths),
            "min_height": min(heights), "max_height": max(heights),
            "avg_width": sum(widths) / len(widths),
            "avg_height": sum(heights) / len(heights),
        }
    else:
        res_summary = {}

    # Flag thin classes: fewer than 300 images is a common danger zone for training
    thin_classes = {c: n for c, n in class_counts.items() if n < 300}

    # Write markdown report
    report_path = output_dir / f"{output_name}_audit_report.md"
    with open(report_path, "w") as f:
        f.write(f"# Audit Report: {output_name}\n\n")
        f.write(f"- **Dataset root:** `{dataset_root}`\n")
        f.write(f"- **Total classes:** {len(class_folders)}\n")
        f.write(f"- **Total images:** {total_images}\n")
        f.write(f"- **Corrupted/unreadable files:** {len(corrupted_files)}\n\n")

        f.write("## Class Distribution\n\n")
        f.write("| Class | Image Count |\n|---|---|\n")
        for c, n in sorted(class_counts.items(), key=lambda x: -x[1]):
            f.write(f"| {c} | {n} |\n")

        f.write("\n## Classes With Low Image Counts (< 300)\n\n")
        if thin_classes:
            for c, n in thin_classes.items():
                f.write(f"- **{c}**: {n} images — flag for review before finalizing class list\n")
        else:
            f.write("None — all classes have at least 300 images.\n")

        f.write("\n## Image Resolution Summary\n\n")
        for k, v in res_summary.items():
            f.write(f"- {k}: {v:.0f}\n" if isinstance(v, float) else f"- {k}: {v}\n")

        f.write("\n## Corrupted Files\n\n")
        if corrupted_files:
            for path, err in corrupted_files:
                f.write(f"- `{path}` — {err}\n")
        else:
            f.write("None found.\n")

    print(f"\nDone. Total images: {total_images} | Classes: {len(class_folders)} | Corrupted: {len(corrupted_files)}")
    print(f"Class counts saved to:  {counts_csv_path}")
    print(f"Full report saved to:   {report_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit an ImageFolder-style dataset.")
    parser.add_argument("--dataset_root", required=True, help="Path to dataset root (contains class subfolders)")
    parser.add_argument("--output_name", required=True, help="Short name used for output files, e.g. 'plantvillage'")
    parser.add_argument("--output_dir", default="data/audit", help="Where to save audit outputs")
    args = parser.parse_args()

    audit_dataset(args.dataset_root, args.output_name, args.output_dir)
