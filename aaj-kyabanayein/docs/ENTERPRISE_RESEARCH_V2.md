# Rasoira Enterprise AI Research System v2.0

World-class, legally compliant, AI-powered recipe knowledge platform for Indian cuisine.

## Core principles

1. **Accuracy over quantity**
2. **Original content over copied content**
3. **Verified facts over assumptions**
4. **Licensed assets over unknown assets**
5. **Human review before publication**

## 10 AI Agents

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | Recipe Research | Factual techniques, regional variations, confidence score |
| 2 | Ingredient Knowledge | Normalize names (EN/HI/GU), allergens, substitutes |
| 3 | Nutrition | USDA FDC only — never invent values |
| 4 | Cuisine Expert | 20 cuisine expertise profiles |
| 5 | Image Verification | CC0, public domain, commercial only |
| 6 | License Compliance | Verify every source, audit history |
| 7 | Original Writing | Unique title, intro, steps, FAQ |
| 8 | Recipe QA | Times, temps, quantities, logic |
| 9 | SEO | Schema.org, OG, Twitter, breadcrumbs |
| 10 | Duplicate Detection | Title, ingredient, instruction similarity |

## Architecture

```
Research Seed → Agent Orchestrator (10 agents)
  → Quality Score (0–100) → Quality Gate → Review Queue → Intelligence DB
```

### Module: `server/src/enterprise/`

| Path | Purpose |
|------|---------|
| `agents/` | 10 specialized agent classes |
| `agentOrchestrator.js` | Sequential agent pipeline + run logging |
| `enterpriseRunner.js` | Batch runner with review queue |
| `qualityScore.js` | Composite 0–100 score |
| `ingredients/` | Master ingredient database (30+ seeded) |
| `schema.js` | `ingredients_master`, `agent_runs`, quality columns |

## Quality Score (0–100)

| Component | Weight |
|-----------|--------|
| Ingredient completeness | 15% |
| Nutrition confidence | 20% |
| Instruction quality | 15% |
| SEO quality | 10% |
| License verification | 15% |
| Image quality | 10% |
| Duplicate confidence | 15% |

Grades: A (90+), B (80+), C (70+), D (60+), F (&lt;60)

## Ingredient Database

Each ingredient stores:
- English, Hindi, Gujarati names
- Scientific name, category
- Shelf life, storage, season
- Substitutes, common uses, allergens

Target: 1,000,000+ records at scale.

## Commands

```bash
npm run enterprise:status
npm run enterprise:run -- --limit 3 --dry-run
npm run enterprise:run -- --cuisine gujarati,punjabi --min-score 70
npm run enterprise:agents -- <recipe-id>
```

## Admin API

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/intelligence/enterprise/status` | v2 status |
| `POST /api/admin/intelligence/enterprise/run-sync` | Run 10-agent pipeline |
| `GET /api/admin/intelligence/enterprise/agents` | Agent run history |
| `GET /api/admin/intelligence/ingredients` | Search ingredient DB |

Admin UI tabs: **Agents**, **Quality**, **Ingredients**, **Jobs**, **Pipeline**

## Enhanced Search

New filters: `state`, `allergen`, `equipment`, `minQualityScore`, `includeIntelligence`

```bash
GET /api/recipes/search?cuisine=gujarati&allergen=gluten&equipment=pressure+cooker
```

## Scalability path

- 100,000+ recipes via batch runner with `--offset`
- PostgreSQL + `pg_trgm` for full-text search
- Redis job queue (SQLite queue today)
- IFCT-India nutrition integration
- Vector embeddings for semantic duplicate detection

## Legal compliance

- Never copy copyrighted recipe text
- Never use images without verified commercial rights
- Unclear license → DO NOT IMPORT
- Permanent audit trail for every recipe, ingredient, image, nutrition source

## Related

- [RESEARCH_SYSTEM.md](./RESEARCH_SYSTEM.md) — v1.0 research system
- [RECIPE_INTELLIGENCE.md](./RECIPE_INTELLIGENCE.md) — Phase 2 intelligence
