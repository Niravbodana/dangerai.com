-- Rasoira Recipe Data Pipeline — PostgreSQL production schema
-- Run: psql $DATABASE_URL -f server/src/pipeline/db/postgresSchema.sql

CREATE TABLE IF NOT EXISTS pipeline_datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT,
  license_spdx TEXT NOT NULL,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_text TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'skipped')),
  skipped_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'paused', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  checkpoint JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  error TEXT
);

CREATE TABLE IF NOT EXISTS pipeline_skipped (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT REFERENCES pipeline_runs(id),
  dataset_id TEXT,
  reason TEXT NOT NULL,
  details JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_skipped_run ON pipeline_skipped(run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_skipped_dataset ON pipeline_skipped(dataset_id);

CREATE TABLE IF NOT EXISTS recipes_production (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_hi TEXT,
  introduction TEXT,
  cuisine TEXT,
  region TEXT,
  category TEXT,
  meal_type TEXT,
  diet TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'medium',
  servings INTEGER DEFAULT 4,
  prep_time_min INTEGER DEFAULT 10,
  cook_time_min INTEGER DEFAULT 30,
  total_time_min INTEGER DEFAULT 40,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  steps_hi JSONB DEFAULT '[]',
  tips TEXT,
  storage TEXT,
  reheating TEXT,
  substitutions JSONB DEFAULT '[]',
  allergens TEXT[] DEFAULT '{}',
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sugar_g NUMERIC,
  sodium_mg NUMERIC,
  vitamins JSONB DEFAULT '{}',
  minerals JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  faq JSONB DEFAULT '[]',
  schema_org JSONB,
  image_url TEXT,
  image_license TEXT,
  image_attribution TEXT,
  data_source TEXT NOT NULL,
  source_license TEXT NOT NULL,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_text TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified',
  last_verified_at TIMESTAMPTZ,
  content_hash TEXT,
  duplicate_of TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_production_slug ON recipes_production(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_production_cuisine ON recipes_production(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_production_meal_type ON recipes_production(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_production_content_hash ON recipes_production(content_hash);
CREATE INDEX IF NOT EXISTS idx_recipes_production_data_source ON recipes_production(data_source);

CREATE TABLE IF NOT EXISTS recipe_provenance (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes_production(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  external_id TEXT,
  source_url TEXT,
  license_spdx TEXT NOT NULL,
  commercial_use_allowed BOOLEAN NOT NULL,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_text TEXT,
  content_hash TEXT,
  ingest_batch_id TEXT,
  fetched_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_provenance_source ON recipe_provenance(source_system);
CREATE INDEX IF NOT EXISTS idx_recipe_provenance_batch ON recipe_provenance(ingest_batch_id);
