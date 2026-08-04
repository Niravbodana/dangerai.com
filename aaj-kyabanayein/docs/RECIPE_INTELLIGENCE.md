# Rasoira Recipe Intelligence System — Phase 2

Enterprise-grade, copyright-safe recipe ingestion pipeline for commercial use.

## Legal compliance (non-negotiable)

- License verification runs **before** any dataset import
- Blocked sources: Allrecipes, Tasty, Tarla Dalal, Hebbars, Cookpad, Yummly, Food Network, TheMealDB, DummyJSON, scraped web
- Allowed: CC0, Public Domain, US-GOV (USDA), CC-BY (with attribution), Rasoira-authored, AI-generated originals, user ToS submissions
- Every recipe stores: `source_name`, `source_url`, `license_name`, `commercial_use_allowed`, `attribution_required`, `verified_on`, `imported_on`

## Architecture

```
License Gate → Source Registry → Fetch → Normalize → Unit Convert
  → Nutrition (USDA FDC) → AI Original Text → SEO Bundle → Quality Gate
  → Review Queue → SQLite + PostgreSQL
```

## Commands

```bash
# Pipeline
npm run pipeline:status
npm run pipeline:verify -- themealdb    # → SKIP
npm run pipeline:run -- --limit 50 --dry-run
DATABASE_URL=... npm run pipeline:init-db
DATABASE_URL=... npm run pipeline:run

# Tests
npm run test:server
npm run test:all
```

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/recipes/search` | Faceted search (cuisine, diet, calories, protein, mode) |
| `GET /api/admin/intelligence/dashboard` | Intelligence stats |
| `GET /api/admin/intelligence/review-queue` | Admin review queue |
| `POST /api/admin/intelligence/review-queue/:id/approve` | Approve recipe |
| `POST /api/admin/intelligence/pipeline/run-sync` | Run pipeline |

## Admin UI

`/admin` → **Intelligence** tab:
- Overview stats
- Review queue (approve/reject/bulk)
- Source registry
- Audit log
- Run pipeline

## Database

- **SQLite** (`recipe_intelligence`, `source_registry`, `recipe_review_queue`, `job_queue`) — works without PostgreSQL
- **PostgreSQL** (`recipes_production`, `recipe_provenance`, Phase 2 extensions) — production scale

Apply Phase 2 schema:
```bash
psql $DATABASE_URL -f server/src/pipeline/db/postgresSchema.sql
psql $DATABASE_URL -f server/src/pipeline/db/postgresSchemaPhase2.sql
```

## Scaling to 1M+ recipes

- PostgreSQL with `pg_trgm` for title search
- Redis queue (`REDIS_URL`) — optional; SQLite job queue works for moderate load
- Search result caching (60s TTL in-memory)
- Background workers via `POST /api/admin/intelligence/jobs/process-one`

## Quality rejection rules

Recipes are rejected if:
- License unknown or commercial use not allowed
- Missing ingredients or instructions (< 2 steps)
- Duplicate score above threshold
- Invalid nutrition values
- Image from blocked domain
