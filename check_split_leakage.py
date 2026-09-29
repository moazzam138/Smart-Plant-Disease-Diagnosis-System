import pandas as pd
from pathlib import Path

CSV_PATH = Path("data/audit/tomato_village_duplicate_groups.csv")
BACKUP_ROOT = Path.home() / "Downloads" / "tomato_village_download"

df = pd.read_csv(CSV_PATH)

split_map = {}

for split in ["train", "val", "test"]:
    split_root = BACKUP_ROOT / split

    if not split_root.exists():
        continue

    for path in split_root.rglob("*"):
        if path.is_file():
            split_map[path.name] = split_map.get(path.name, set())
            split_map[path.name].add(split)

cross_split_groups = 0
same_split_groups = 0

for _, row in df.iterrows():
    files = str(row["file_paths"]).split(" | ")

    splits = set()

    for file_path in files:
        filename = Path(file_path).name

        if filename in split_map:
            splits.update(split_map[filename])

    if len(splits) > 1:
        cross_split_groups += 1
    else:
        same_split_groups += 1

print("Total duplicate groups:", len(df))
print("Groups within one original split:", same_split_groups)
print("Groups crossing original splits:", cross_split_groups)