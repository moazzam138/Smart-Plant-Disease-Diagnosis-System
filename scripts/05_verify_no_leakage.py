"""
05_verify_no_leakage.py

PURPOSE
-------
Run this on Day 5, right after freezing your split, as your final
safety check before handing off to Member 2.

It checks for near-duplicate images that ended up on BOTH sides of a
split boundary - e.g. the same (or near-identical) leaf photo present
in both train.csv and field_test.csv. This is the single most common
and most dangerous mistake in image classification projects: it makes
your field-test accuracy look better than it actually is, because the
model has effectively already "seen" some of the test images.

HOW TO RUN
----------
    python 05_verify_no_leakage.py \\
        --split_dir data/splits \\
        --hash_distance 5

OUTPUT
------
data/splits/leakage_report.md - lists any suspected cross-split
duplicates found, or confirms none were found.

WHAT TO DO IF LEAKAGE IS FOUND
---------------------------------
1. Open the report and look at the flagged file pairs.
2. For each pair, decide which split should keep the image (usually:
   remove it from train/val, keep it in the field test set, since the
   field test set is precious and should stay intact).
3. Re-run 04_make_splits.py with those files added to an exclude list,
   OR manually remove the offending rows from train.csv/val.csv.
4. Re-run this script to confirm the report comes back clean.
5. Only THEN consider the split frozen and hand off to Member 2.

PERFORMANCE NOTE
-----------------
This does a full cross-comparison between splits (size A x size B),
which can be slow if both sides are large (e.g. thousands of train
images against thousands of field images). If it's taking too long,
use --sample_size to check a random sample from the larger side first
- catching a real leakage problem in a sample is usually enough to
tell you something is wrong; a fully clean sample is a good (though
not 100% exhaustive) signal.
"""

import argparse
from pathlib import Path

import imagehash
from PIL import Image
import pandas as pd
from tqdm import tqdm


def hash_file(path):
    try:
        with Image.open(path) as img:
            return imagehash.phash(img)
    except Exception:
        return None


def verify_no_leakage(split_dir: str, hash_distance: int = 5, sample_size: int = None):
    split_dir = Path(split_dir)

    train_df = pd.read_csv(split_dir / "train.csv")
    val_df = pd.read_csv(split_dir / "val.csv")
    field_df = pd.read_csv(split_dir / "field_test.csv")

    if sample_size:
        if len(train_df) > sample_size:
            train_df = train_df.sample(n=sample_size, random_state=42)
            print(f"Sampled {sample_size} train images for this check (use full run before final freeze).")
        if len(val_df) > sample_size:
            val_df = val_df.sample(n=sample_size, random_state=42)

    print("Hashing train set...")
    train_hashes = {row.filepath: hash_file(row.filepath) for row in tqdm(train_df.itertuples(), total=len(train_df))}
    print("Hashing val set...")
    val_hashes = {row.filepath: hash_file(row.filepath) for row in tqdm(val_df.itertuples(), total=len(val_df))}
    print("Hashing field test set...")
    field_hashes = {row.filepath: hash_file(row.filepath) for row in tqdm(field_df.itertuples(), total=len(field_df))}

    def compare_sets(name_a, hashes_a, name_b, hashes_b):
        suspicious = []
        for path_a, hash_a in tqdm(hashes_a.items(), desc=f"{name_a} vs {name_b}", leave=False):
            if hash_a is None:
                continue
            for path_b, hash_b in hashes_b.items():
                if hash_b is None:
                    continue
                if hash_a - hash_b <= hash_distance:
                    suspicious.append((path_a, path_b, hash_a - hash_b))
        return suspicious

    print("\nComparing train vs field_test (most important check)...")
    train_vs_field = compare_sets("train", train_hashes, "field_test", field_hashes)

    print("Comparing val vs field_test...")
    val_vs_field = compare_sets("val", val_hashes, "field_test", field_hashes)

    print("Comparing train vs val (should also be clean)...")
    train_vs_val = compare_sets("train", train_hashes, "val", val_hashes)

    report_path = split_dir / "leakage_report.md"
    with open(report_path, "w") as f:
        f.write("# Cross-Split Leakage Report\n\n")

        total_issues = len(train_vs_field) + len(val_vs_field) + len(train_vs_val)
        if total_issues == 0:
            f.write("**No cross-split near-duplicates found. Split looks clean.**\n\n")
        else:
            f.write(f"**WARNING: {total_issues} suspected cross-split near-duplicate pairs found. "
                    "Review and resolve before freezing the split.**\n\n")

        for name, results in [
            ("train vs field_test", train_vs_field),
            ("val vs field_test", val_vs_field),
            ("train vs val", train_vs_val),
        ]:
            f.write(f"## {name}: {len(results)} suspected pairs\n\n")
            if results:
                f.write("| File A | File B | Hash Distance |\n|---|---|---|\n")
                for a, b, d in results[:200]:  # cap the report length
                    f.write(f"| {a} | {b} | {d} |\n")
                if len(results) > 200:
                    f.write(f"\n... and {len(results) - 200} more pairs not shown.\n")
            f.write("\n")

    print(f"\nDone. Report saved to: {report_path}")
    if total_issues := (len(train_vs_field) + len(val_vs_field) + len(train_vs_val)):
        print(f"WARNING: {total_issues} suspected leakage pairs found - review before freezing the split.")
    else:
        print("No leakage detected. Split looks safe to freeze.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Check for near-duplicate images leaking across splits.")
    parser.add_argument("--split_dir", default="data/splits")
    parser.add_argument("--hash_distance", type=int, default=5)
    parser.add_argument("--sample_size", type=int, default=None,
                         help="Optional: check only a random sample of train/val (speeds up large datasets)")
    args = parser.parse_args()

    verify_no_leakage(args.split_dir, args.hash_distance, args.sample_size)
