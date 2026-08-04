# Rasoira Master Recipe Research & Knowledge System v1.0

Research-driven, legally compliant recipe generation for commercial use.

**This is NOT scraping. This is NOT copying.**

## Mission

Build the largest, highest-quality, research-driven Indian recipe knowledge base — targeting **50,000+** original recipes across every major cuisine.

## Legal rules (non-negotiable)

- Never copy recipe text, instructions, introductions, or images from copyrighted websites
- Never bypass robots.txt or violate Terms of Service
- Never use unknown license data
- If commercial rights cannot be verified → **SKIP**
- Every recipe and asset maintains a complete audit trail

## Architecture

```
Taxonomy → Research Seeds → Factual Brief (KB + USDA)
  → Original Content Generator → Strict Nutrition (USDA FDC)
  → Research Quality Gate → Review Queue → Intelligence DB
```

### Module: `server/src/research/`

| File | Purpose |
|------|---------|
| `taxonomy.js` | 26+ cuisines, meal types, festivals, 50k target |
| `recipeCatalog.js` | Research seeds (expandable catalog) |
| `researchSources.js` | Allowed/forbidden sources |
| `factualKnowledge.js` | Factual briefs — no copyrighted text |
| `originalContentGenerator.js` | Original title, intro, steps, FAQ, history |
| `strictNutrition.js` | USDA-only nutrition (≥50% ingredient match) |
| `researchQualityGate.js` | Stricter QC than pipeline |
| `auditTrail.js` | `recipe_audit_trail`, `research_briefs` tables |
| `researchRunner.js` | Main orchestrator |

## Allowed research sources

| Source | License | Fields |
|--------|---------|--------|
| USDA FoodData Central | US-GOV | Nutrition |
| Rasoira Culinary KB | RASOIRA-AI | Methods, temps, equipment |
| Wikipedia (facts only) | CC-BY-3.0 | History, cultural context |
| IFCT India (ICMR-NIN) | US-GOV | Indian nutrition (planned) |

## Every recipe includes

Title, slug, cuisine, state, region, category, meal type, diet, difficulty, timings, servings, verified nutrition, ingredients with units, optional/substitutes, equipment, method, temperature, original steps, chef notes, common mistakes, storage, shelf life, reheating, serving suggestions, recipe history, interesting facts, festival association, tags, allergens, SEO bundle, Schema.org, FAQ schema, source metadata, verification date.

## Commands

```bash
# Catalog stats (target 50,000+)
npm run research:status

# Dry run — research + generate, no save
npm run research:run -- --limit 5 --dry-run

# Generate and queue for admin review
npm run research:run -- --limit 10

# Filter by cuisine
npm run research:run -- --cuisine gujarati,punjabi --limit 20

# Audit trail for a recipe
node scripts/run-research.mjs audit <recipe-id>
```

## Admin API

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/intelligence/research/status` | Catalog stats |
| `POST /api/admin/intelligence/research/run` | Enqueue research job |
| `POST /api/admin/intelligence/research/run-sync` | Run research synchronously |
| `GET /api/admin/intelligence/research/audit/:recipeId` | Recipe audit trail |
| `GET /api/admin/intelligence/research/brief/:briefId` | Research brief |

Admin UI: **Intelligence → Research** tab in the admin panel.

## Quality control

Recipes are **rejected** when:

- Nutrition not verified from USDA (insufficient ingredient match)
- Impossible cooking steps or temperatures
- Missing recipe history or originality flag
- Duplicate or license issues (via base quality gate)

Every generated recipe enters the **review queue** (`autoApprove: false`).

## Audit trail

Tables in SQLite intelligence DB:

- `recipe_audit_trail` — events per recipe (source, license, nutrition status, verification)
- `research_briefs` — stored factual briefs with source references

## Tests

```bash
npm run test:server   # includes research.test.js
```

## Scale path to 50,000+

1. Expand `DISH_PATTERNS` in `taxonomy.js`
2. Batch runner with `--offset` for pagination
3. PostgreSQL at scale (`postgresSchemaPhase2.sql`)
4. IFCT-India integration for Indian ingredient nutrition
5. Image pipeline (CC0 / original only) — metadata fields ready, generation TBD

## Related docs

- [RECIPE_INTELLIGENCE.md](./RECIPE_INTELLIGENCE.md) — Phase 2 intelligence system
- Pipeline: `npm run pipeline:run`
