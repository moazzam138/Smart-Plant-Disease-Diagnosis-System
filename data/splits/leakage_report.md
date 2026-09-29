# Cross-Split Leakage Report

**1 suspected cross-split near-duplicate pair found by pHash. Manual review completed.**

## train vs field_test: 0 suspected pairs


## val vs field_test: 0 suspected pairs


## train vs val: 1 suspected pairs

| File A | File B | Hash Distance |
|---|---|---|
| C:\Users\DELL\Desktop\smart-tomato\data\processed\plantvillage\bacterial_spot\611c6fa8-d805-4956-a786-2a4522c59f71___GCREC_Bact.Sp 5616.JPG | C:\Users\DELL\Desktop\smart-tomato\data\processed\plantvillage\bacterial_spot\efd6193d-7d5b-4207-999d-2aeb08cd64e2___GCREC_Bact.Sp 5739.JPG | 4 |



## Manual review

The remaining train-vs-validation pair in `bacterial_spot` had a pHash distance of 4. The two images were manually inspected and judged to be visually distinct. The pair was therefore retained. No confirmed cross-split leakage was identified. The train-vs-field_test and validation-vs-field_test comparisons returned zero suspected pairs.
