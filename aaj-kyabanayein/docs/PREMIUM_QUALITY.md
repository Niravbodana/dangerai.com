# Premium Recipe Quality (90+)

Upgrades the live catalog so every recipe has:

1. **Real ingredients** with exact quantities (dish-specific templates)
2. **Verified nutrition** summed from USDA / ICMR-NIN per-100g values (`verified: true`, coverage ≥ 85%)
3. **Original high-quality hero images** (1200×900 JPEG, RASOIRA-AI license — no scraped copyrighted photos)
4. **Quality score ≥ 90** (enterprise composite gate)

## Commands

```bash
npm run premium:status
npm run premium:upgrade -- --limit 100
npm run premium:upgrade -- --only-below 90          # resume unfinished
npm run premium:upgrade -- --dry-run --limit 20
```

## Why old bulk scores capped ~73

- Images were skipped → image component = 50/100
- Nutrition always `verified: false` → nutrition component = 0

Premium path writes real heroes and verified macros, so scores reach **90–100**.

## Image policy

1. **Real photos first** — Wikimedia Commons / Wikipedia / Openverse with commercial-safe licenses, dish-name title match ≥ 0.5, normalized to 1400×1050
2. **Studio fallback** — RASOIRA-AI original composition when no licensed photo matches
3. Cached in `server/data/image-cache/{id}.jpg` with `source: premium-hero-real` or `premium-hero`
4. Scrapers never overwrite premium heroes

## Modules

| File | Role |
|------|------|
| `server/src/premium/ingredientNutrition.js` | USDA/ICMR table + verified sum |
| `server/src/premium/dishIngredientBank.js` | Dish → real ingredient templates |
| `server/src/premium/heroImageGenerator.js` | Original 1200×900 heroes (sharp) |
| `server/src/premium/premiumRecipeBuilder.js` | Build + 90+ gate |
| `server/src/premium/upgradePipeline.js` | Catalog upgrade runner |
