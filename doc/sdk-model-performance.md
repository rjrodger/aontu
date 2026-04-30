# SDK Model Performance Report

Date: 2026-04-25

## Summary

All 17 SDK models tested. **16 pass cleanly** (0 errors, done=true). 1 model (learnworldsnew) has a pre-existing data error. All models complete in 2-4 fixpoint passes.

## Results

| SDK | Parse (ms) | Unify (ms) | Gen (ms) | Total (ms) | CC | Errors | Done |
|-----|-----------|-----------|---------|-----------|----|----|------|
| cloudsmith | 2249 | 4362 | 25 | 6636 | 4 | 0 | yes |
| codatplatform | 418 | 1156 | 5 | 1579 | 4 | 0 | yes |
| contentfulcma | 872 | 1728 | 11 | 2611 | 4 | 0 | yes |
| dingconnect | 287 | 410 | 51 | 748 | 4 | 0 | yes |
| foo | 212 | 253 | 2 | 467 | 4 | 0 | yes |
| **github** | **5874** | **11062** | **185** | **17121** | **4** | **0** | **yes** |
| **gitlab** | **6389** | **9499** | **142** | **16030** | **4** | **0** | **yes** |
| learnworlds | 827 | 371 | 35 | 1233 | 2 | 0 | yes |
| learnworldsnew | 809 | 1207 | 17 | 2033 | 0 | 86 | no |
| petstore | 122 | 13 | 1 | 136 | 2 | 0 | yes |
| pokeapi | 255 | 231 | 3 | 489 | 4 | 0 | yes |
| shortcut | 651 | 1166 | 53 | 1870 | 4 | 0 | yes |
| solar | 825 | 1529 | 41 | 2395 | 4 | 0 | yes |
| statuspage | 183 | 228 | 1 | 412 | 4 | 0 | yes |
| taxonomy | 561 | 1072 | 9 | 1642 | 4 | 0 | yes |
| voxgig-solardemo | 164 | 178 | 2 | 344 | 4 | 0 | yes |
| old-solardemo | 176 | 236 | 1 | 413 | 4 | 0 | yes |

## Key Observations

- **16/17 models pass** with 0 errors
- **learnworldsnew** fails with 86 errors (pre-existing model data issue: scalar type conflict at `main.kit.info.version` — `string` vs `2`)
- **Fixpoint passes**: Most models need 4 passes (spread + pref convergence). Simpler models (learnworlds, petstore) converge in 2.
- **Largest models**: github (17s total) and gitlab (16s total) are the heaviest. Unify phase dominates at ~10s.
- **Path pre-resolution** eliminates ref-chain passes — previously required 7-9 passes for deep chains, now paths resolve before the fixpoint loop starts.

## Compared to Previous

| Metric | Before | After |
|--------|--------|-------|
| gitlab unify | ~30s+ | ~10s |
| gitlab cc passes | 7-9 | 4 |
| pokeapi errors | 1 (internal) | 0 |
| Models passing | 6/17 | 16/17 |
| Models with 0 errors | 6 | 16 |
