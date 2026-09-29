"""
03_apply_mapping_and_clean.py

PURPOSE
-------
Run this on Day 4, after you've:
  1. Filled in class_mapping_template.csv with your REAL class names
     (copy exact folder names from your Day 2 audit reports).
  2. Reviewed duplicate_groups.csv from script 02 and decided which
     files to remove.
  3. Reviewed corrupted files from script 01's audit report.

This script builds a clean, unified dataset folder where:
  - Every image lives under its UNIFIED class name (not the dataset's
    original label), so PlantVillage/PlantDoc/Tomato-Village all speak
    the same class vocabulary.
  - Excluded files (duplicates you chose to drop, corrupted files) are
    left out entirely.
  - Classes marked "keep_class = no" in your mapping are dropped.

It does NOT delete your raw data - it creates a new folder of symlinks
(or copies, if you prefer) pointing at the files you're keeping. This
way your raw downloads stay untouched and you can always redo this
step if you change your mind about a class or a duplicate.

INPUTS YOU NEED TO PREPARE
----------------------------
1. class_mapping.csv - your filled-in version of class_mapping_template.csv
   Required columns: unified_class_name, keep_class, and one column
   per dataset (e.g. plantvillage_label, plantdoc_label, ...) matching
   the --dataset_column argument you pass in.

2. exclude_list.txt (optional) - one file path per line, for images
   you've decided to remove (duplicates, corrupted, bad labels).
   Leave this empty or omit --exclude_list if you have nothing to
   exclude yet.

HOW TO RUN (once per dataset)
-------------------------------
    python 03_apply_mapping_and_clean.py \\
        --dataset_root data/raw/plantvillage \\
        --mapping_csv class_mapping.csv \\
        --dataset_column plantvillage_label \\
        --output_root data/processed/plantvillage \\
        --exclude_list exclude_plantvillage.txt

Repeat for plantdoc and tomato_village with their own --dataset_column
and --output_root.

WHAT TO DO WITH THE OUTPUT
---------------------------
Check data/processed/<dataset>/<unified_class>/ folders look right -
spot check a few images per class. This processed folder is what
04_make_splits.py will read from next.
"""

import argparse
import os
import shutil
from pathlib import Path

import pandas as pd
from tqdm import tqdm

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


def load_exclude_list(exclude_list_path):
    if not exclude_list_path or not Path(exclude_list_path).exists():
        return set()
    with open(exclude_list_path) as f:
        return {line.strip() for line in f if line.strip()}


def apply_mapping_and_clean(dataset_root, mapping_csv, dataset_column,
                             output_root, exclude_list=None, mode="symlink"):
    dataset_root = Path(dataset_root)
    output_root = Path(output_root)
    output_root.mkdir(parents=True, exist_ok=True)

    mapping_df = pd.read_csv(mapping_csv)
    if dataset_column not in mapping_df.columns:
        raise ValueError(
            f"Column '{dataset_column}' not found in {mapping_csv}. "
            f"Available columns: {list(mapping_df.columns)}"
        )

    excluded = load_exclude_list(exclude_list)
    if excluded:
        print(f"Loaded {len(excluded)} files to exclude.")

    kept_counts = {}
    dropped_class_count = 0
    total_copied = 0

    for _, row in mapping_df.iterrows():
        keep = str(row.get("keep_class", "yes")).strip().lower()
        source_label = row.get(dataset_column)
        unified_name = row["unified_class_name"]

        if keep not in ("yes", "true", "1"):
            dropped_class_count += 1
            continue

        if pd.isna(source_label) or str(source_label).strip() == "":
            # This dataset doesn't have this class - skip silently, that's expected
            continue

        source_folder = dataset_root / str(source_label).strip()
        if not source_folder.exists():
            print(f"  WARNING: expected folder not found: {source_folder} "
                  f"(check spelling against your Day 2 audit)")
            continue

        dest_folder = output_root / unified_name
        dest_folder.mkdir(parents=True, exist_ok=True)

        image_files = [
            f for f in source_folder.iterdir()
            if f.suffix.lower() in VALID_EXTENSIONS
        ]

        kept_here = 0
        for img_path in tqdm(image_files, desc=f"{source_label} -> {unified_name}", leave=False):
            if str(img_path) in excluded:
                continue
            dest_path = dest_folder / img_path.name
            # Avoid name collisions when merging multiple source classes
            # into the same unified class (rare, but possible).
            if dest_path.exists():
                dest_path = dest_folder / f"{source_folder.name}_{img_path.name}"

            if mode == "symlink":
                if not dest_path.exists():
                    os.symlink(img_path.resolve(), dest_path)
            else:
                shutil.copy2(img_path, dest_path)
            kept_here += 1
            total_copied += 1

        kept_counts[unified_name] = kept_counts.get(unified_name, 0) + kept_here

    print(f"\nDone. Classes dropped by mapping: {dropped_class_count}")
    print(f"Total images placed: {total_copied}")
    print("\nPer unified class counts in this dataset:")
    for c, n in sorted(kept_counts.items(), key=lambda x: -x[1]):
        print(f"  {c}: {n}")
    print(f"\nProcessed dataset written to: {output_root}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply class mapping and exclusions to build a unified dataset.")
    parser.add_argument("--dataset_root", required=True)
    parser.add_argument("--mapping_csv", required=True)
    parser.add_argument("--dataset_column", required=True,
                         help="Which mapping column matches this dataset, e.g. plantvillage_label")
    parser.add_argument("--output_root", required=True)
    parser.add_argument("--exclude_list", default=None)
    parser.add_argument("--mode", choices=["symlink", "copy"], default="symlink",
                         help="symlink (default, saves disk space) or copy (safer on some filesystems/OSes)")
    args = parser.parse_args()

    apply_mapping_and_clean(
        args.dataset_root, args.mapping_csv, args.dataset_column,
        args.output_root, args.exclude_list, args.mode
    )
