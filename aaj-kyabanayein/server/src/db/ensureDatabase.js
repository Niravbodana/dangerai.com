import fs from "fs";
import { DB_PATH, getDb } from "./connection.js";
import { initDatabase } from "./migrate.js";
import { getRecipeCount } from "./recipeRepository.js";

/**
 * Create empty SQLite schema on first run — no auto-seeding.
 */
function migrateProvenanceMultiSource(db) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='recipe_provenance'").get();
  if (!row?.sql || row.sql.includes("PRIMARY KEY (recipe_id, source_system)")) return;

  db.exec(`
    CREATE TABLE recipe_provenance_v2 (
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      source_system TEXT NOT NULL,
      external_id TEXT,
      source_url TEXT,
      license_spdx TEXT NOT NULL,
      commercial_use_allowed INTEGER NOT NULL DEFAULT 0,
      attribution_required INTEGER NOT NULL DEFAULT 0,
      attribution_text TEXT,
      content_hash TEXT,
      ingest_batch_id TEXT,
      verification_status TEXT DEFAULT 'verified',
      fetched_at TEXT,
      verified_at TEXT,
      PRIMARY KEY (recipe_id, source_system)
    );
    INSERT OR IGNORE INTO recipe_provenance_v2 SELECT * FROM recipe_provenance;
    DROP TABLE recipe_provenance;
    ALTER TABLE recipe_provenance_v2 RENAME TO recipe_provenance;
    CREATE INDEX IF NOT EXISTS idx_recipe_provenance_source ON recipe_provenance(source_system);
  `);
}

export function ensureDatabase() {
  const existedBefore = fs.existsSync(DB_PATH);
  initDatabase();

  try {
    const db = getDb();
    migrateProvenanceMultiSource(db);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    `);
  } catch {
    /* ignore */
  }

  const count = getRecipeCount();
  if (!existedBefore) {
    console.log(`SQLite ready: empty catalog (${count} recipes)`);
  }
  return { created: !existedBefore, total: count };
}
