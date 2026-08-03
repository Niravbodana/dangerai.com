/**
 * SQLite schema for Recipe Intelligence System (works without PostgreSQL).
 */
export function createIntelligenceSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS source_registry (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      source_url TEXT,
      license_name TEXT NOT NULL,
      license_url TEXT,
      commercial_use_allowed INTEGER NOT NULL DEFAULT 0,
      attribution_required INTEGER NOT NULL DEFAULT 0,
      attribution_text TEXT,
      robots_txt_respected INTEGER DEFAULT 1,
      api_commercial_use INTEGER DEFAULT 0,
      allowed_fields TEXT DEFAULT '[]',
      verification_status TEXT NOT NULL DEFAULT 'pending',
      verified_on TEXT,
      imported_on TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS license_registry (
      spdx_id TEXT PRIMARY KEY,
      license_name TEXT NOT NULL,
      license_url TEXT,
      commercial_use_allowed INTEGER NOT NULL DEFAULT 0,
      attribution_required INTEGER NOT NULL DEFAULT 0,
      verified_on TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipe_intelligence (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      source_name TEXT,
      source_url TEXT,
      license_name TEXT,
      license_url TEXT,
      commercial_use_allowed INTEGER NOT NULL DEFAULT 0,
      attribution_required INTEGER NOT NULL DEFAULT 0,
      verified_on TEXT,
      imported_on TEXT,
      review_status TEXT DEFAULT 'pending',
      duplicate_score REAL DEFAULT 0,
      similarity_score REAL DEFAULT 0,
      content_hash TEXT,
      cuisine TEXT,
      region TEXT,
      meal_type TEXT,
      diet TEXT DEFAULT '[]',
      calories INTEGER,
      protein_g REAL,
      difficulty TEXT,
      cook_time_min INTEGER,
      image_url TEXT,
      image_license TEXT,
      seo_title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_intel_slug ON recipe_intelligence(slug);
    CREATE INDEX IF NOT EXISTS idx_intel_review ON recipe_intelligence(review_status);
    CREATE INDEX IF NOT EXISTS idx_intel_cuisine ON recipe_intelligence(cuisine);
    CREATE INDEX IF NOT EXISTS idx_intel_meal ON recipe_intelligence(meal_type);
    CREATE INDEX IF NOT EXISTS idx_intel_hash ON recipe_intelligence(content_hash);
    CREATE INDEX IF NOT EXISTS idx_intel_calories ON recipe_intelligence(calories);

    CREATE TABLE IF NOT EXISTS recipe_review_queue (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      duplicate_score REAL DEFAULT 0,
      similarity_score REAL DEFAULT 0,
      license_status TEXT,
      image_license_status TEXT,
      quality_issues TEXT DEFAULT '[]',
      preview_json TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_review_status ON recipe_review_queue(status);

    CREATE TABLE IF NOT EXISTS intelligence_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      actor TEXT,
      details_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_created ON intelligence_audit_log(created_at);

    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY,
      job_type TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error TEXT,
      scheduled_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_job_status ON job_queue(status, scheduled_at);

    INSERT OR IGNORE INTO license_registry (spdx_id, license_name, license_url, commercial_use_allowed, attribution_required) VALUES
      ('CC0-1.0', 'Creative Commons CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 1, 0),
      ('PD', 'Public Domain', NULL, 1, 0),
      ('US-GOV', 'U.S. Government Work', 'https://www.usa.gov/government-works', 1, 0),
      ('CC-BY-4.0', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/', 1, 1),
      ('RASOIRA-AI', 'Rasoira AI-generated', NULL, 1, 0),
      ('RASOIRA-CURATED', 'Rasoira Original', NULL, 1, 0),
      ('RASOIRA-USER-TOS', 'Rasoira User ToS', NULL, 1, 0);
  `);
}
