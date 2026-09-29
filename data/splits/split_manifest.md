# Dataset Split Manifest

**This split is FROZEN. Do not regenerate without team agreement -**
**doing so invalidates comparability with prior experiments.**

- Controlled dataset source: `data\processed\plantvillage`
- Field dataset source(s): data\processed\plantdoc, data\processed\tomato_village
- Random seed: 42
- Validation fraction: 0.2

## Train set: 13404 images

| Class | Count |
|---|---|
| yellow_leaf_curl_virus | 4285 |
| bacterial_spot | 1701 |
| late_blight | 1527 |
| septoria_leaf_spot | 1417 |
| spider_mites | 1341 |
| healthy | 1273 |
| early_blight | 800 |
| leaf_mold | 762 |
| tomato_mosaic_virus | 298 |

## Validation set: 3338 images

| Class | Count |
|---|---|
| yellow_leaf_curl_virus | 1066 |
| bacterial_spot | 424 |
| late_blight | 381 |
| septoria_leaf_spot | 354 |
| spider_mites | 335 |
| healthy | 313 |
| early_blight | 200 |
| leaf_mold | 190 |
| tomato_mosaic_virus | 75 |

## Field test set (held out, untouched): 2297 images

| Class | Count |
|---|---|
| late_blight | 1015 |
| early_blight | 584 |
| healthy | 216 |
| septoria_leaf_spot | 150 |
| bacterial_spot | 110 |
| leaf_mold | 91 |
| yellow_leaf_curl_virus | 75 |
| tomato_mosaic_virus | 54 |
| spider_mites | 2 |
