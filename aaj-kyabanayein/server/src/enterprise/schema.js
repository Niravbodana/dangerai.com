/**
 * Enterprise AI Research System v2.0 — schema extensions.
 */
export function ensureEnterpriseSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients_master (
      id TEXT PRIMARY KEY,
      english_name TEXT NOT NULL,
      hindi_name TEXT,
      gujarati_name TEXT,
      scientific_name TEXT,
      category TEXT,
      nutrition_json TEXT DEFAULT '{}',
      shelf_life TEXT,
      storage TEXT,
      season TEXT,
      substitutes_json TEXT DEFAULT '[]',
      common_uses_json TEXT DEFAULT '[]',
      allergens_json TEXT DEFAULT '[]',
      aliases_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ingredient_english ON ingredients_master(english_name);
    CREATE INDEX IF NOT EXISTS idx_ingredient_category ON ingredients_master(category);

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      recipe_id TEXT,
      run_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      confidence REAL DEFAULT 0,
      duration_ms INTEGER,
      output_json TEXT,
      issues_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_agent_runs_recipe ON agent_runs(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_run ON agent_runs(run_id);
  `);

  ensureColumn(db, "recipe_intelligence", "quality_score", "REAL DEFAULT 0");
  ensureColumn(db, "recipe_intelligence", "nutrition_status", "TEXT DEFAULT 'unknown'");
  ensureColumn(db, "recipe_intelligence", "verification_status", "TEXT DEFAULT 'pending'");
  ensureColumn(db, "recipe_review_queue", "quality_score", "REAL DEFAULT 0");
  ensureColumn(db, "recipe_review_queue", "nutrition_status", "TEXT DEFAULT 'unknown'");
  ensureColumn(db, "recipe_review_queue", "verification_status", "TEXT DEFAULT 'pending_review'");
}

function ensureColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
