"""
02_find_duplicates.py

PURPOSE
-------
Run this on Day 3, after the audit, to find near-duplicate or exact-
duplicate images WITHIN a single dataset. PlantVillage in particular
is known to contain many near-identical images taken seconds apart
from the same plant/leaf - if these end up split across train and
test, your model will look artificially accurate.

HOW IT WORKS
------------
Uses perceptual hashing (phash): images that look visually similar
get hashes that differ by only a few bits. We group images whose
hashes are within a small "distance" of each other as likely
duplicates.

HOW TO RUN
----------
    python 02_find_duplicates.py --dataset_root data/raw/plantvillage --output_name plantvillage

This produces:
    data/audit/plantvillage_duplicate_groups.csv

Each row is one suspected duplicate group, listing all file paths in
that group. Nothing gets deleted automatically.

WHAT TO DO WITH THE OUTPUT
---------------------------
1. Open the CSV and spot-check a handful of groups by viewing the
   images side by side - confirm they really are duplicates/near-
   duplicates, not just visually similar but distinct leaves.
2. For each confirmed duplicate group, decide which ONE image to keep
   (e.g. the sharpest / best-lit one) and mark the rest for removal.
3. Feed your removal decisions into 03_apply_cleaning.py in the next step.

TUNING
------
--hash_distance controls sensitivity (default 5). Lower = stricter
(fewer false positives, might miss some real duplicates). Higher =
looser (catches more, but more false positives to review manually).
Start with the default and adjust based on what you see in a sample.

PERFORMANCE NOTE
-----------------
Comparing every image against every other image gets slow once a
dataset has thousands of images (grows quadratically). Since near-
duplicates almost always come from the same class (same plant,
same photo session), use --per_class to hash and compare within
each class folder separately instead of across the whole dataset.
This is dramatically faster and catches the leakage cases that
actually matter.
"""

import argparse
from pathlib import Path
from collections import defaultdict

import imagehash
from PIL import Image
import pandas as pd
from tqdm import tqdm

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


def _hash_images(image_paths):
    hashes = {}
    for path in tqdm(image_paths, desc="Hashing", leave=False):
        try:
            with Image.open(path) as img:
                hashes[str(path)] = imagehash.phash(img)
        except Exception as e:
            print(f"  Skipping unreadable file {path}: {e}")
    return hashes


def _group_by_distance(hashes: dict, hash_distance: int):
    paths = list(hashes.keys())
    parent = {p: p for p in paths}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py

    n = len(paths)
    for i in range(n):
        for j in range(i + 1, n):
            if hashes[paths[i]] - hashes[paths[j]] <= hash_distance:
                union(paths[i], paths[j])

    groups = defaultdict(list)
    for p in paths:
        groups[find(p)].append(p)
    return [g for g in groups.values() if len(g) > 1]


def find_duplicates(dataset_root: str, output_name: str, hash_distance: int = 5,
                     output_dir: str = "data/audit", per_class: bool = True):
    dataset_root = Path(dataset_root)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    duplicate_groups = []

    if per_class:
        class_folders = sorted([d for d in dataset_root.iterdir() if d.is_dir()])
        print(f"Running per-class duplicate search across {len(class_folders)} classes ...")
        for class_folder in tqdm(class_folders, desc="Classes"):
            image_paths = [
                p for p in class_folder.rglob("*")
                if p.suffix.lower() in VALID_EXTENSIONS
            ]
            hashes = _hash_images(image_paths)
            duplicate_groups.extend(_group_by_distance(hashes, hash_distance))
    else:
        image_paths = [
            p for p in dataset_root.rglob("*")
            if p.suffix.lower() in VALID_EXTENSIONS
        ]
        print(f"Hashing {len(image_paths)} images in {dataset_root.name} "
              "(whole-dataset mode - slower) ...")
        hashes = _hash_images(image_paths)
        print("Comparing hashes for near-duplicates (this is the slow part)...")
        duplicate_groups = _group_by_distance(hashes, hash_distance)

    output_csv = output_dir / f"{output_name}_duplicate_groups.csv"
    rows = []
    for i, group in enumerate(duplicate_groups):
        rows.append({
            "group_id": i,
            "group_size": len(group),
            "file_paths": " | ".join(group),
        })
    pd.DataFrame(rows).to_csv(output_csv, index=False)

    print(f"\nFound {len(duplicate_groups)} suspected duplicate groups "
          f"covering {sum(len(g) for g in duplicate_groups)} images.")
    print(f"Saved to: {output_csv}")
    print("Review this file manually before deciding what to remove.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Find near-duplicate images in a dataset.")
    parser.add_argument("--dataset_root", required=True)
    parser.add_argument("--output_name", required=True)
    parser.add_argument("--hash_distance", type=int, default=5)
    parser.add_argument("--output_dir", default="data/audit")
    parser.add_argument("--whole_dataset", action="store_true",
                         help="Compare across the entire dataset instead of per-class (much slower).")
    args = parser.parse_args()

    find_duplicates(args.dataset_root, args.output_name, args.hash_distance,
                     args.output_dir, per_class=not args.whole_dataset)
