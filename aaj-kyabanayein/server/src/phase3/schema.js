/**
 * Phase 3 — schema for import progress tracking.
 */
export function ensurePhase3Schema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS phase3_import_progress (
      id TEXT PRIMARY KEY,
      recipe_name TEXT NOT NULL,
      cuisine TEXT,
      category TEXT,
      popularity_score INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 1,
      import_phase INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      quality_score REAL DEFAULT 0,
      recipe_id TEXT,
      run_id TEXT,
      error TEXT,
      imported_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_phase3_status ON phase3_import_progress(status);
    CREATE INDEX IF NOT EXISTS idx_phase3_cuisine ON phase3_import_progress(cuisine);
    CREATE INDEX IF NOT EXISTS idx_phase3_priority ON phase3_import_progress(priority, popularity_score);
  `);
}

export function recordImportProgress(db, entry) {
  ensurePhase3Schema(db);
  db.prepare(`
    INSERT OR REPLACE INTO phase3_import_progress (
      id, recipe_name, cuisine, category, popularity_score, priority,
      import_phase, status, quality_score, recipe_id, run_id, error, imported_at, updated_at
    ) VALUES (
      @id, @recipe_name, @cuisine, @category, @popularity_score, @priority,
      @import_phase, @status, @quality_score, @recipe_id, @run_id, @error, @imported_at, datetime('now')
    )
  `).run(entry);
}

export function getImportProgress(db, opts = {}) {
  ensurePhase3Schema(db);
  const { status, cuisine, limit = 100 } = opts;
  let sql = "SELECT * FROM phase3_import_progress WHERE 1=1";
  const params = [];
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (cuisine) { sql += " AND cuisine = ?"; params.push(cuisine); }
  sql += " ORDER BY priority ASC, popularity_score DESC LIMIT ?";
  params.push(limit);
  return db.prepare(sql).all(...params);
}

export function getImportedIds(db) {
  ensurePhase3Schema(db);
  const rows = db.prepare("SELECT id FROM phase3_import_progress WHERE status = 'imported'").all();
  return new Set(rows.map((r) => r.id));
}
