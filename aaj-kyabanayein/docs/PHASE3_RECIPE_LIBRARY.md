# Rasoira Phase 3 — India's Most Complete Recipe Library

Build the largest **verified** Indian recipe collection. Quality over quantity. No random recipes.

## Mission

Import recipes that Indians **actually cook and search for** — researched for popularity, written as original content, verified before publication.

## Import Priority

### Phase 1 (Top Priority)
Most-searched dishes across every major cuisine. Import these first.

### Phase 2
Popular regional staples and festival favourites.

### Phase 3
Fill cuisine quotas with verified regional classics.

## Cuisine Targets

| Category | Target |
|----------|--------|
| Gujarati | 800+ |
| Punjabi | 1,000+ |
| North Indian | 1,200+ |
| South Indian | 1,500+ |
| Maharashtrian | 700+ |
| Rajasthani | 600+ |
| Bengali | 600+ |
| Goan | 300+ |
| Hyderabadi | 500+ |
| Street Food | 700+ |
| Breakfast | 600+ |
| Snacks | 800+ |
| Desserts | 700+ |
| Chicken | 1,500+ |
| Mutton | 700+ |
| Fish | 700+ |
| Seafood | 500+ |
| Healthy | 500+ |
| Festival | 500+ |

**Total target: 14,000+** (expandable via manifest growth)

## Curated Manifest

`server/src/phase3/popularRecipes.js` — 150+ hand-curated popular dishes with:
- Popularity score (search demand signals)
- Priority (1 = Phase 1)
- Alternative names
- Cuisine, state, category, diet
- Festival associations

**NOT** combinatorial random generation.

## Architecture

```
Popular Recipe Manifest → Import Planner (priority queue)
  → Enterprise v2 (10 agents) → Quality Gate → Review Queue
```

### Module: `server/src/phase3/`

| File | Purpose |
|------|---------|
| `importTargets.js` | Cuisine/category count targets |
| `popularRecipes.js` | Curated popular dish manifest |
| `importPlanner.js` | Priority queue + import plan |
| `phase3Runner.js` | Import runner |
| `schema.js` | `phase3_import_progress` tracking |

## Commands

```bash
npm run phase3:plan          # Show import plan + progress
npm run phase3:count         # Curated vs target counts
npm run phase3:import -- --limit 3 --dry-run
npm run phase3:import -- --phase 1 --cuisine punjabi,gujarati
```

## Admin API

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/intelligence/phase3/plan` | Full import plan |
| `GET /api/admin/intelligence/phase3/progress` | Import progress |
| `POST /api/admin/intelligence/phase3/import-sync` | Run import |

Admin UI: **Phase 3 Import** tab

## Quality Policy

- No random recipe generation
- Original content only (RASOIRA-AI license)
- USDA-verified nutrition required
- Human review before publication
- Reject: wrong ingredients, bad timings, unknown licenses, duplicates

## Popularity Research Signals

- Google Trends India (factual signal)
- YouTube India cooking engagement
- Rasoira internal search analytics
- Wikipedia pageviews (factual only)
- Rasoira culinary knowledge base

Never copy recipe text from any source.

## Related

- [ENTERPRISE_RESEARCH_V2.md](./ENTERPRISE_RESEARCH_V2.md) — 10-agent pipeline
- [RESEARCH_SYSTEM.md](./RESEARCH_SYSTEM.md) — v1.0 research
