-- Rasoira Phase 2 — Recipe Intelligence System (extends postgresSchema.sql)
-- Run after base schema: psql $DATABASE_URL -f server/src/pipeline/db/postgresSchemaPhase2.sql

-- Permanent source registry (required for every import)
CREATE TABLE IF NOT EXISTS source_registry (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT,
  license_name TEXT NOT NULL,
  license_url TEXT,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_text TEXT,
  robots_txt_respected BOOLEAN DEFAULT TRUE,
  api_commercial_use BOOLEAN DEFAULT FALSE,
  allowed_fields TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'skipped')),
  verified_on TIMESTAMPTZ,
  imported_on TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS license_registry (
  spdx_id TEXT PRIMARY KEY,
  license_name TEXT NOT NULL,
  license_url TEXT,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  verified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend recipes_production with Phase 2 fields
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS alternate_names TEXT[] DEFAULT '{}';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS city_origin TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS optional_ingredients JSONB DEFAULT '[]';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS ingredient_alternatives JSONB DEFAULT '[]';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS cooking_equipment TEXT[] DEFAULT '{}';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS cooking_method TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS temperature TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS chef_notes TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS serving_suggestions TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS shelf_life TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS common_mistakes TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS recipe_tags TEXT[] DEFAULT '{}';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS festival TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS cholesterol_mg NUMERIC;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS nutrition_source TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS image_author TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS image_provider TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS image_verified_on TIMESTAMPTZ;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS license_name TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS license_url TEXT;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS verified_on TIMESTAMPTZ;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS imported_on TIMESTAMPTZ;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS duplicate_score REAL DEFAULT 0;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS similarity_score REAL DEFAULT 0;
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS seo_bundle JSONB DEFAULT '{}';
ALTER TABLE recipes_production ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'auto_approved'));

-- Review queue for admin
CREATE TABLE IF NOT EXISTS recipe_review_queue (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes_production(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  duplicate_score REAL DEFAULT 0,
  similarity_score REAL DEFAULT 0,
  license_status TEXT,
  image_license_status TEXT,
  quality_issues JSONB DEFAULT '[]',
  preview JSONB,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON recipe_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_recipe ON recipe_review_queue(recipe_id);

-- Audit log
CREATE TABLE IF NOT EXISTS intelligence_audit_log (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_run ON intelligence_audit_log(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON intelligence_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON intelligence_audit_log(created_at DESC);

-- Background job queue
CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON job_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(job_type);

-- Search performance indexes
CREATE INDEX IF NOT EXISTS idx_recipes_production_diet ON recipes_production USING GIN(diet);
CREATE INDEX IF NOT EXISTS idx_recipes_production_tags ON recipes_production USING GIN(recipe_tags);
CREATE INDEX IF NOT EXISTS idx_recipes_production_review ON recipes_production(review_status);
CREATE INDEX IF NOT EXISTS idx_recipes_production_calories ON recipes_production(calories);
CREATE INDEX IF NOT EXISTS idx_recipes_production_protein ON recipes_production(protein_g);
CREATE INDEX IF NOT EXISTS idx_recipes_production_title_trgm ON recipes_production USING gin(title gin_trgm_ops);
-- Note: enable pg_trgm extension manually: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Seed license registry
INSERT INTO license_registry (spdx_id, license_name, license_url, commercial_use_allowed, attribution_required) VALUES
  ('CC0-1.0', 'Creative Commons CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', TRUE, FALSE),
  ('PD', 'Public Domain', NULL, TRUE, FALSE),
  ('US-GOV', 'U.S. Government Work', 'https://www.usa.gov/government-works', TRUE, FALSE),
  ('CC-BY-4.0', 'Creative Commons Attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/', TRUE, TRUE),
  ('RASOIRA-AI', 'Rasoira AI-generated', NULL, TRUE, FALSE),
  ('RASOIRA-CURATED', 'Rasoira Original', NULL, TRUE, FALSE),
  ('RASOIRA-USER-TOS', 'Rasoira User ToS', NULL, TRUE, FALSE)
ON CONFLICT (spdx_id) DO NOTHING;
