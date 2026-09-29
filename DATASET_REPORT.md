# Smart-Tomato Dataset Report

## 1. Objective

The objective of the Smart-Tomato dataset pipeline is to evaluate **lab-to-field generalization** for tomato disease classification.

Instead of randomly combining all available images into a single dataset, the project separates the data by domain:

* **PlantVillage** is treated as the controlled/lab-domain dataset used for training and validation.
* **PlantDoc** and **Tomato-Village** are treated as field-domain datasets and are completely held out for final testing.

This setup allows the project to evaluate how well a model trained on controlled laboratory-style images generalizes to more variable field images.

---

## 2. Source Datasets

### 2.1 PlantVillage

* **Source:** https://github.com/spMohanty/PlantVillage-Dataset
* **Used subset:** Color images (`raw/color/`)
* **Raw images:** 54,305
* **Raw classes:** 38
* **Corrupted images:** 0
* **Image resolution:** 256 × 256
* **Tomato classes available:** 10
* **Processed images retained:** 16,756
* **Processed classes retained:** 9

PlantVillage provides the controlled/lab-domain data used to construct the training and validation sets.

### 2.2 PlantDoc

* **Used subsets:** `train` and `test`
* **Raw images:** 2,569
* **Raw classes:** 28
* **Corrupted/unreadable files:** 6
* **Processed images retained:** 681
* **Processed classes retained:** 8

PlantDoc contains more varied field-style imagery and is therefore used as part of the held-out field-domain test set.

### 2.3 Tomato-Village

* **Source:** https://github.com/mamta-joshi-gehlot/Tomato-Village
* **Used subset:** Variant-a (Multiclass Classification)
* **Raw images:** 4,525
* **Raw classes:** 8
* **Corrupted images:** 0
* **Image resolution:** 256 × 256
* **Processed images retained:** 1,616
* **Processed classes represented:** 3

The original Variant-a data contained separate `train`, `val`, and `test` directories. These were merged into the raw dataset directory because project-specific splits were created later.

Tomato-Village is used as part of the held-out field-domain test set.

---

## 3. Unified Class Taxonomy

The project uses nine final unified classes:

1. `bacterial_spot`
2. `early_blight`
3. `late_blight`
4. `leaf_mold`
5. `septoria_leaf_spot`
6. `spider_mites`
7. `healthy`
8. `tomato_mosaic_virus`
9. `yellow_leaf_curl_virus`

The PlantVillage class names were used as the starting point, and corresponding PlantDoc and Tomato-Village classes were mapped where reliable semantic correspondence existed.

---

## 4. Class Selection Decisions

### Retained classes

| Unified class          | PlantVillage | PlantDoc | Tomato-Village |
| ---------------------- | -----------: | -------: | -------------: |
| bacterial_spot         |        2,127 |      110 |              — |
| early_blight           |        1,000 |       88 |            496 |
| late_blight            |        1,909 |      111 |            904 |
| leaf_mold              |          952 |       91 |              — |
| septoria_leaf_spot     |        1,771 |      150 |              — |
| spider_mites           |        1,676 |        2 |              — |
| healthy                |        1,591 |        — |            216 |
| tomato_mosaic_virus    |          373 |       54 |              — |
| yellow_leaf_curl_virus |        5,357 |       75 |              — |

### Dropped class

`target_spot` was removed from the final taxonomy because no corresponding field-domain representation was available in PlantDoc or Tomato-Village.

This prevents the class from being represented only in the controlled/lab domain while having no corresponding field-domain evaluation data.

### Ambiguous PlantDoc class

The PlantDoc class `Tomato leaf` was not mapped to `healthy`.

The class name does not provide sufficient evidence that the images represent healthy tomato leaves, so mapping it to `healthy` could introduce label noise.

### Spider mites caveat

`spider_mites` was retained because it has substantial PlantVillage representation, but only **2 PlantDoc images** were available for the field domain.

Therefore, field-test performance for this class should be interpreted cautiously because the field-domain sample is extremely small.

---

## 5. Dataset Cleaning and Processing

The raw datasets were audited before processing.

The processing pipeline:

1. Audited image counts, class distributions, image dimensions, and corrupted files.
2. Identified suspected duplicate and near-duplicate images.
3. Applied the unified class mapping.
4. Removed classes excluded by the mapping.
5. Created controlled-domain training and validation data from PlantVillage.
6. Created a completely held-out field-test pool from PlantDoc and Tomato-Village.
7. Checked cross-split similarity using perceptual hashing.

Raw datasets were preserved separately from the processed datasets.

---

## 6. Duplicate Analysis

Duplicate detection was performed separately for each source dataset.

### PlantVillage

* 434 suspected duplicate groups across the complete dataset
* 61 suspected duplicate groups involving tomato classes
* 14 tomato duplicate groups were exact duplicates
* 47 tomato groups were near-duplicate candidates

Exact duplicates were not removed from the raw dataset. Duplicate handling was performed during split review so that identical images would not appear across train and validation.

### PlantDoc

* 34 suspected duplicate groups
* 0 groups were exact duplicates
* 34 groups were near-duplicate candidates

### Tomato-Village

* 360 suspected duplicate groups
* 0 groups were exact duplicates
* 360 groups were near-duplicate candidates

The raw datasets were not modified during duplicate analysis.

---

## 7. Train, Validation, and Field-Test Strategy

The project uses a domain-separated evaluation strategy.

### Training set

The training set contains only processed PlantVillage images.

**Images:** 13,404

### Validation set

The validation set contains only processed PlantVillage images.

**Images:** 3,338

A nominal 80/20 split was created using random seed 42. During manual duplicate review, additional validation rows were removed to prevent confirmed duplicate images from appearing across train and validation.

### Field-test set

The field-test set contains processed PlantDoc and Tomato-Village images only.

**Images:** 2,297

This set remains completely held out from training and validation.

---

## 8. Final Split Distribution

### Training

| Class                  |     Images |
| ---------------------- | ---------: |
| yellow_leaf_curl_virus |      4,285 |
| bacterial_spot         |      1,701 |
| late_blight            |      1,527 |
| septoria_leaf_spot     |      1,417 |
| spider_mites           |      1,341 |
| healthy                |      1,273 |
| early_blight           |        800 |
| leaf_mold              |        762 |
| tomato_mosaic_virus    |        298 |
| **Total**              | **13,404** |

### Validation

| Class                  |    Images |
| ---------------------- | --------: |
| yellow_leaf_curl_virus |     1,066 |
| bacterial_spot         |       424 |
| late_blight            |       381 |
| septoria_leaf_spot     |       354 |
| spider_mites           |       335 |
| healthy                |       313 |
| early_blight           |       200 |
| leaf_mold              |       190 |
| tomato_mosaic_virus    |        75 |
| **Total**              | **3,338** |

### Field test

| Class                  |    Images |
| ---------------------- | --------: |
| late_blight            |     1,015 |
| early_blight           |       584 |
| healthy                |       216 |
| septoria_leaf_spot     |       150 |
| bacterial_spot         |       110 |
| leaf_mold              |        91 |
| yellow_leaf_curl_virus |        75 |
| tomato_mosaic_virus    |        54 |
| spider_mites           |         2 |
| **Total**              | **2,297** |

### Overall

**19,039 images** are included in the finalized train, validation, and field-test manifests.

---

## 9. Leakage Verification

Cross-split leakage verification was performed using perceptual hashing with a hash-distance threshold of 5.

Final results:

* **Train vs field test:** 0 suspected pairs
* **Validation vs field test:** 0 suspected pairs
* **Train vs validation:** 1 suspected near-duplicate pair

The remaining train-validation pair had a pHash distance of 4 and was manually inspected. The two images were judged to be visually distinct and were therefore retained.

No confirmed cross-split leakage was identified.

The final leakage review is documented in:

`data/splits/leakage_report.md`

---

## 10. Final Dataset Structure

### Raw data

```text
data/raw/
├── plantvillage/
├── plantdoc/
└── tomato_village/
```

### Processed data

```text
data/processed/
├── plantvillage/
├── plantdoc/
└── tomato_village/
```

### Final split manifests

```text
data/splits/
├── train.csv
├── val.csv
├── field_test.csv
├── split_manifest.md
├── leakage_report.md
└── final_backup/
    ├── train.csv
    ├── val.csv
    └── field_test.csv
```

---

## 11. Important Limitations

1. The field-test class distribution is naturally imbalanced because PlantDoc and Tomato-Village do not contain all unified classes equally.
2. `spider_mites` has only two field-domain images, making class-specific field performance unreliable as a standalone estimate.
3. Some PlantDoc images were unreadable and were excluded during processing.
4. The source datasets differ substantially in image resolution and visual characteristics.
5. The model is trained primarily on PlantVillage controlled imagery, so the field-test results are specifically intended to expose the domain gap between controlled and field imagery.
6. Near-duplicate detection is based on perceptual hashing and therefore requires manual review for borderline cases.

---

## 12. Reproducibility

The finalized experiment should use the frozen split manifests rather than regenerating the splits.

Key configuration:

* **Controlled dataset:** PlantVillage
* **Field datasets:** PlantDoc + Tomato-Village
* **Validation fraction:** 0.2
* **Random seed:** 42
* **Final train images:** 13,404
* **Final validation images:** 3,338
* **Final field-test images:** 2,297
* **Final classes:** 9

The finalized CSV manifests are backed up under:

`data/splits/final_backup/`

Regenerating the split without team agreement may change the evaluation set and reduce comparability between experiments.
