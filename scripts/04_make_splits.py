"""
04_make_splits.py

PURPOSE
-------
Run this on Day 4, right after 03_apply_mapping_and_clean.py, to
produce the FROZEN train/validation/test split that Member 2 (ML
Lead) will build the baseline CNN from.

This is the most important script in the whole pipeline: once you
freeze this and hand it off, it must not casually change. If it
changes later, every experiment run against the old split becomes
incomparable.

DESIGN (matches your project's non-negotiable rules)
------------------------------------------------------
- TRAIN + VALIDATION come from your controlled dataset (PlantVillage),
  stratified by class, with a fixed random seed for reproducibility.
- FIELD TEST SET comes entirely from your field-style dataset(s)
  (PlantDoc / Tomato-Village) and is kept completely separate. This
  set is never touched during training or tuning - only for final
  evaluation.
- Nothing is copied here - this script only writes CSV manifests
  (filepath, unified_class, split) that Member 2 loads at training
  time. Your image files never move.

HOW TO RUN
----------
    python 04_make_splits.py \\
        --controlled_dataset data/processed/plantvillage \\
        --field_dataset data/processed/plantdoc \\
        --field_dataset data/processed/tomato_village \\
        --output_dir data/splits \\
        --val_fraction 0.2 \\
        --seed 42

(--field_dataset can be passed multiple times to combine several
field-style sources into one held-out test set.)

OUTPUT
------
data/splits/train.csv         - filepath, unified_class
data/splits/val.csv           - filepath, unified_class
data/splits/field_test.csv    - filepath, unified_class
data/splits/split_manifest.md - human-readable summary + the exact
                                 command/seed used, for your docs

WHY STRATIFIED
---------------
Stratified splitting keeps the same class proportions in train and
val as in the full controlled dataset, so a rare class doesn't
accidentally end up almost entirely in one split.

AFTER RUNNING THIS
--------------------
1. Open split_manifest.md and sanity-check the per-class counts in
   each split - do they look reasonable? Any class end up with very
   few validation examples?
2. Commit the three CSV files (not the images) to your repo, per
   your team's Git rules.
3. Hand this off to Member 2 - this is the Day 4 checkpoint.
4. Move on to Day 5: run 05_verify_no_leakage.py to double check
   nothing crossed between train/val and the field test set.
"""

import argparse
from pathlib import Path
from collections import defaultdict

import pandas as pd
from sklearn.model_selection import train_test_split

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


def collect_images(dataset_root: Path):
    """Returns list of (filepath, class_name) from an ImageFolder-style dataset."""
    rows = []
    for class_folder in sorted([d for d in dataset_root.iterdir() if d.is_dir()]):
        for img_path in class_folder.iterdir():
            if img_path.suffix.lower() in VALID_EXTENSIONS:
                rows.append((str(img_path.resolve()), class_folder.name))
    return rows


def make_splits(controlled_dataset, field_datasets, output_dir,
                 val_fraction=0.2, seed=42):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    controlled_rows = collect_images(Path(controlled_dataset))
    if not controlled_rows:
        raise ValueError(f"No images found in controlled dataset: {controlled_dataset}")

    df = pd.DataFrame(controlled_rows, columns=["filepath", "unified_class"])
    print(f"Controlled dataset ({controlled_dataset}): {len(df)} images, "
          f"{df['unified_class'].nunique()} classes")

    # Stratified train/val split, fixed seed for reproducibility
    train_df, val_df = train_test_split(
        df,
        test_size=val_fraction,
        stratify=df["unified_class"],
        random_state=seed,
    )

    # Field test set: everything from the field dataset(s), untouched
    field_rows = []
    for fd in field_datasets:
        field_rows.extend(collect_images(Path(fd)))
    field_df = pd.DataFrame(field_rows, columns=["filepath", "unified_class"])
    print(f"Field test dataset(s): {len(field_df)} images, "
          f"{field_df['unified_class'].nunique() if len(field_df) else 0} classes")

    train_df.to_csv(output_dir / "train.csv", index=False)
    val_df.to_csv(output_dir / "val.csv", index=False)
    field_df.to_csv(output_dir / "field_test.csv", index=False)

    # Write a human-readable manifest for your docs / team handoff
    manifest_path = output_dir / "split_manifest.md"
    with open(manifest_path, "w") as f:
        f.write("# Dataset Split Manifest\n\n")
        f.write("**This split is FROZEN. Do not regenerate without team agreement -**\n")
        f.write("**doing so invalidates comparability with prior experiments.**\n\n")
        f.write(f"- Controlled dataset source: `{controlled_dataset}`\n")
        f.write(f"- Field dataset source(s): {', '.join(str(d) for d in field_datasets)}\n")
        f.write(f"- Random seed: {seed}\n")
        f.write(f"- Validation fraction: {val_fraction}\n\n")

        f.write(f"## Train set: {len(train_df)} images\n\n")
        f.write("| Class | Count |\n|---|---|\n")
        for c, n in train_df["unified_class"].value_counts().items():
            f.write(f"| {c} | {n} |\n")

        f.write(f"\n## Validation set: {len(val_df)} images\n\n")
        f.write("| Class | Count |\n|---|---|\n")
        for c, n in val_df["unified_class"].value_counts().items():
            f.write(f"| {c} | {n} |\n")

        f.write(f"\n## Field test set (held out, untouched): {len(field_df)} images\n\n")
        if len(field_df):
            f.write("| Class | Count |\n|---|---|\n")
            for c, n in field_df["unified_class"].value_counts().items():
                f.write(f"| {c} | {n} |\n")
        else:
            f.write("**WARNING: field test set is empty. Check your --field_dataset paths.**\n")

        # Flag classes with zero or very few field test examples
        train_classes = set(train_df["unified_class"].unique())
        field_classes = set(field_df["unified_class"].unique()) if len(field_df) else set()
        missing_in_field = train_classes - field_classes
        if missing_in_field:
            f.write("\n## Classes With NO Field Test Representation\n\n")
            f.write("These classes can't be evaluated for field generalization - flag this "
                    "as a known limitation in your report:\n\n")
            for c in sorted(missing_in_field):
                f.write(f"- {c}\n")

    print(f"\nSplit written to {output_dir}/")
    print(f"  train.csv:      {len(train_df)} images")
    print(f"  val.csv:        {len(val_df)} images")
    print(f"  field_test.csv: {len(field_df)} images")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the frozen train/val/field-test split.")
    parser.add_argument("--controlled_dataset", required=True,
                         help="Path to processed controlled dataset (e.g. data/processed/plantvillage)")
    parser.add_argument("--field_dataset", action="append", required=True,
                         help="Path to a processed field dataset. Repeat this flag to combine several.")
    parser.add_argument("--output_dir", default="data/splits")
    parser.add_argument("--val_fraction", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    make_splits(args.controlled_dataset, args.field_dataset, args.output_dir,
                args.val_fraction, args.seed)
