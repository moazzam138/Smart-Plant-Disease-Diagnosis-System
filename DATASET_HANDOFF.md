# Smart-Tomato Dataset Hand-Off Document

## 1. Purpose

This document provides the finalized dataset information required for the Smart-Tomato model-development team.

The dataset pipeline was designed specifically to evaluate **lab-to-field generalization** for tomato disease classification.

The key principle is:

> **Train and validate on controlled PlantVillage images, then evaluate generalization on completely held-out field-domain images from PlantDoc and Tomato-Village.**

---

## 2. Final Dataset Overview

| Dataset             | Domain           | Purpose                | Images Retained |
| ------------------- | ---------------- | ---------------------- | --------------: |
| PlantVillage        | Controlled / lab | Training + validation  |          16,756 |
| PlantDoc            | Field-style      | Held-out field testing |             681 |
| Tomato-Village      | Field-style      | Held-out field testing |           1,616 |
| **Total processed** |                  |                        |      **19,053** |

The final experimental manifests contain:

* **Training:** 13,404 images
* **Validation:** 3,338 images
* **Field test:** 2,297 images
* **Total experimental images:** **19,039**

The difference between processed images and experimental images is due to the finalized split and duplicate-review decisions.

---

## 3. Final Class Taxonomy

The model should use these **9 unified class names**:

1. `bacterial_spot`
2. `early_blight`
3. `late_blight`
4. `leaf_mold`
5. `septoria_leaf_spot`
6. `spider_mites`
7. `healthy`
8. `tomato_mosaic_virus`
9. `yellow_leaf_curl_virus`

These names should be treated as the canonical class labels throughout the model pipeline.

---

## 4. Dataset Split Strategy

### Training

**File:**

`data/splits/train.csv`

Contains **13,404 PlantVillage images only**.

Use this split for model training.

### Validation

**File:**

`data/splits/val.csv`

Contains **3,338 PlantVillage images only**.

Use this split for:

* model validation
* hyperparameter decisions
* checkpoint selection
* early stopping, if used

### Field Test

**File:**

`data/splits/field_test.csv`

Contains **2,297 images from PlantDoc + Tomato-Village**.

This is the most important evaluation split for the project.

### Critical rule

**Do not use `field_test.csv` during training, hyperparameter tuning, model selection, or repeated experimentation.**

It should remain untouched until the model has been finalized.

The field-test set is intended to measure the actual **lab-to-field domain gap**.

---

## 5. Final Split Counts

### Training — 13,404

| Class                    | Images |
| ------------------------ | -----: |
| `yellow_leaf_curl_virus` |  4,285 |
| `bacterial_spot`         |  1,701 |
| `late_blight`            |  1,527 |
| `septoria_leaf_spot`     |  1,417 |
| `spider_mites`           |  1,341 |
| `healthy`                |  1,273 |
| `early_blight`           |    800 |
| `leaf_mold`              |    762 |
| `tomato_mosaic_virus`    |    298 |

### Validation — 3,338

| Class                    | Images |
| ------------------------ | -----: |
| `yellow_leaf_curl_virus` |  1,066 |
| `bacterial_spot`         |    424 |
| `late_blight`            |    381 |
| `septoria_leaf_spot`     |    354 |
| `spider_mites`           |    335 |
| `healthy`                |    313 |
| `early_blight`           |    200 |
| `leaf_mold`              |    190 |
| `tomato_mosaic_virus`    |     75 |

### Field Test — 2,297

| Class                    | Images |
| ------------------------ | -----: |
| `late_blight`            |  1,015 |
| `early_blight`           |    584 |
| `healthy`                |    216 |
| `septoria_leaf_spot`     |    150 |
| `bacterial_spot`         |    110 |
| `leaf_mold`              |     91 |
| `yellow_leaf_curl_virus` |     75 |
| `tomato_mosaic_virus`    |     54 |
| `spider_mites`           |      2 |

---

## 6. Important Class Decisions

### `target_spot`

The original PlantVillage `Tomato___Target_Spot` class was excluded.

Reason:

There was no corresponding field-domain representation in PlantDoc or Tomato-Village.

Keeping it would create a class that exists in the training domain but cannot be meaningfully evaluated in the field domain.

### PlantDoc `Tomato leaf`

The PlantDoc class `Tomato leaf` was **not mapped to `healthy`**.

The class name does not provide enough evidence that the images are healthy.

This avoids introducing potentially incorrect labels.

### `spider_mites`

The class is retained, but there are only **2 field-test images**.

Therefore:

> Do not draw strong conclusions from the field-test performance of `spider_mites`.

The overall field-domain evaluation should also report this limitation.

---

## 7. Data Leakage Controls

Duplicate and near-duplicate analysis was performed on the source datasets and across the finalized splits.

Final cross-split verification:

| Comparison               | Suspected pairs |
| ------------------------ | --------------: |
| Train vs Field Test      |               0 |
| Validation vs Field Test |               0 |
| Train vs Validation      |               1 |

The remaining train-validation pair had a pHash distance of 4 and was manually inspected.

The images were judged to be visually distinct and were retained.

Therefore, **no confirmed cross-split leakage was identified**.

Detailed results are available in:

`data/splits/leakage_report.md`

---

## 8. Frozen Split

The finalized split is **FROZEN**.

Do not regenerate the train/validation/field-test split unless the team explicitly agrees to a new experimental version.

The finalized manifests are:

```text
data/splits/
├── train.csv
├── val.csv
├── field_test.csv
├── split_manifest.md
└── final_backup/
    ├── train.csv
    ├── val.csv
    └── field_test.csv
```

The files in `final_backup/` are backups of the finalized manifests.

---

## 9. How the Model Team Should Load the Data

The CSV files contain two columns:

```text
filepath
unified_class
```

Example:

```text
filepath:
C:\Users\DELL\Desktop\smart-tomato\data\processed\plantvillage\late_blight\...

unified_class:
late_blight
```

The model pipeline should read the CSV and use:

* `filepath` → image location
* `unified_class` → target label

Do not infer labels from directory names if the CSV manifest is being used as the source of truth.

---

## 10. Recommended Experimental Principle

The main experiment should answer:

> **How well does a model trained on controlled PlantVillage imagery generalize to field-domain imagery?**

Therefore, the evaluation should distinguish between:

### Controlled-domain validation

Performance on:

`data/splits/val.csv`

This tells us how well the model performs on images from a domain similar to its training data.

### Field-domain evaluation

Performance on:

`data/splits/field_test.csv`

This tells us how well the model generalizes to unseen field-style imagery.

The difference between these results is itself an important project finding.

---

## 11. Metrics to Report

The model team should report more than overall accuracy.

Recommended metrics:

* Overall accuracy
* Macro F1-score
* Per-class precision
* Per-class recall
* Per-class F1-score
* Confusion matrix

For the field test, especially report **macro F1** because the class distribution is highly imbalanced.

Per-class results should also be reported so that weaknesses in specific diseases are visible.

---

## 12. Important Dataset Limitations

1. The field-test distribution is naturally imbalanced.
2. `spider_mites` has only 2 field-domain images.
3. PlantVillage and the field datasets have substantially different visual characteristics.
4. PlantDoc contains some images that were unreadable and were excluded.
5. The model is trained primarily on controlled PlantVillage imagery.
6. Near-duplicate detection uses perceptual hashing and includes manual review for borderline cases.
7. Field-test results should therefore be interpreted as an evaluation of **cross-domain generalization**, not simply as another random test split.

---

## 13. Dataset Documentation

Additional documentation is available in:

```text
DATA_SOURCES.md
DATASET_REPORT.md
class_mapping.csv
data/splits/split_manifest.md
data/splits/leakage_report.md
```

These documents contain the source information, class mapping decisions, dataset statistics, duplicate analysis, split methodology, and reproducibility information.

---

## 14. Handoff Summary

### What the dataset team has completed

* Source datasets collected
* Dataset audits completed
* Corrupted/unreadable files identified
* Unified 9-class taxonomy created
* Class mapping documented
* Duplicate analysis completed
* Domain-separated train/validation/field-test split created
* Cross-split leakage checked
* Final manifests frozen
* Manifest backups created
* Dataset documentation completed
* Training paths verified

### Model team receives

```text
data/processed/
data/splits/train.csv
data/splits/val.csv
data/splits/field_test.csv
DATA_SOURCES.md
DATASET_REPORT.md
class_mapping.csv
data/splits/split_manifest.md
data/splits/leakage_report.md
```

### Final experimental configuration

```text
Classes:              9
Training images:      13,404
Validation images:     3,338
Field-test images:     2,297

Training domain:      PlantVillage
Validation domain:    PlantVillage
Field-test domain:    PlantDoc + Tomato-Village

Random seed:          42
Validation fraction:  0.2

Split status:         FROZEN
```

**The dataset is ready for model development.**
