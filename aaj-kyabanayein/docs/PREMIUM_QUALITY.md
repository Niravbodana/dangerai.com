# Premium Recipe Quality (90+)

Upgrades the live catalog so every recipe has:

1. **Real ingredients** with exact quantities (dish-specific templates)
2. **Verified nutrition** summed from USDA / ICMR-NIN per-100g values (`verified: true`, coverage ≥ 85%)
3. **High-quality hero images** (1400×1050) — real licensed photos first, studio fallback
4. **Quality score ≥ 90** (enterprise composite gate)

## Commands

```bash
npm run premium:status
npm run premium:upgrade -- --limit 100
npm run premium:upgrade -- --only-below 90 --concurrency 8
npm run premium:upgrade -- --dry-run --limit 20
```

## Mac: sharp install error

If you see `Could not load the "sharp" module using the darwin-x64 runtime`:

```bash
cd ~/Projects/dangerai.com/dangerai.com/aaj-kyabanayein/server
rm -rf node_modules/sharp node_modules/@img
npm install --include=optional sharp
cd ..
npm run premium:upgrade -- --only-below 90 --concurrency 4
```

Premium also includes a **jpeg-js fallback** — upgrade still runs if sharp stays broken (studio plates + JPEG photo pass-through).

## Full Mac reset → 10k → premium 90+

```bash
cd ~/Projects/dangerai.com/dangerai.com/aaj-kyabanayein
git pull origin cursor/premium-quality-recipes-f8d6
npm install --prefix server
npm run library:build -- --target 10000
npm run premium:upgrade -- --only-below 90 --concurrency 4
npm run premium:status
npm run dev:kill
npm run dev
```

**Bulk build is fast by default** (~minutes for 10k). It skips per-recipe photo fetches during generation. Run `premium:upgrade` afterward to reach 90+ scores with real heroes and verified nutrition.

Use `--premium` only if you want photos during bulk (very slow on Mac — hours).

While building, progress logs every 50 recipes:
`[bulk] processed=50 approved=48 synced=48 catalog=1338/10000`

Invalid API keys: leave empty in `server/.env` (`GROQ_API_KEY=`, `GEMINI_API_KEY=`, `GOOGLE_API_KEY=`). App works without them.

## Why old bulk scores capped ~73

- Images were skipped → image component = 50/100
- Nutrition always `verified: false` → nutrition component = 0

## Image policy

1. **Real photos first** — Wikimedia Commons / Wikipedia / Openverse (commercial-safe), title match ≥ 0.5
2. **Studio fallback** — RASOIRA-AI original composition
3. Cache: `server/data/image-cache/{id}.jpg`
4. Scrapers never overwrite premium heroes
