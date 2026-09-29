# Dataset Sources

## 1. PlantVillage

- **Dataset:** PlantVillage Dataset
- **Source:** https://github.com/spMohanty/PlantVillage-Dataset
- **Used subset:** Color images (`raw/color/`)
- **Location in project:** `data/raw/plantvillage/`
- **Download date:** September 27, 2026
- **Original audit:** 54,305 images, 38 classes, 0 corrupted images
- **Tomato classes:** 10
- **Processed tomato images retained:** 16,756
- **Processed classes retained:** 9
- **Dropped class:** `target_spot` because no corresponding field-domain representation was available
- **License:** See the license information provided by the original PlantVillage dataset repository.
- **Notes:** The complete downloaded color dataset is retained in the raw directory. Only the mapped tomato classes are included in the processed dataset.

## 2. PlantDoc

- **Dataset:** PlantDoc
- **Used subsets:** `train` and `test`
- **Location in project:** `data/raw/plantdoc/`
- **Original audit:** 2,569 images, 28 classes, 6 corrupted images
- **Processed images retained:** 681
- **Processed classes retained:** 8
- **Dropped class:** `Tomato leaf` because it could not be reliably mapped to the `healthy` class
- **Tomato-related source classes:** Tomato Septoria leaf spot (150), Tomato leaf late blight (111), Tomato leaf bacterial spot (110), Tomato mold leaf (91), Tomato Early blight leaf (88), Tomato leaf yellow virus (75), Tomato leaf (63), Tomato leaf mosaic virus (54), Tomato two spotted spider mites leaf (2)
- **Notes:** PlantDoc is used as part of the held-out field-domain test set.

## 3. Tomato-Village

- **Dataset:** Tomato-Village
- **Source:** https://github.com/mamta-joshi-gehlot/Tomato-Village
- **Used subset:** Variant-a (Multiclass Classification)
- **Location in project:** `data/raw/tomato_village/`
- **Download date:** September 28, 2026
- **Original audit:** 4,525 images, 8 classes, 0 corrupted images
- **Processed images retained:** 1,616
- **Processed classes represented:** 3
- **Original structure:** Variant-a contains `train`, `val`, and `test` splits. These were merged into the raw dataset directory because project-specific train/validation/test splits are created later.
- **License:** See the license information provided by the original Tomato-Village repository.
- **Notes:** Only Variant-a (Multiclass Classification) was downloaded. Tomato-Village is used as part of the held-out field-domain test set. The original downloaded copy is retained separately as a backup.

