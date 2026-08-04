/**
 * Complete audit trail for every recipe and asset.
 */
import { getIntelligenceDb } from "../intelligence/repository.js";
import { writeAuditLog } from "../intelligence/auditLog.js";

export function ensureAuditTrailSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipe_audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT DEFAULT 'system',
      source_name TEXT,
      license_name TEXT,
      image_license TEXT,
      nutrition_status TEXT,
      verification_status TEXT,
      details_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_trail_recipe ON recipe_audit_trail(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_event ON recipe_audit_trail(event_type);

    CREATE TABLE IF NOT EXISTS research_briefs (
      id TEXT PRIMARY KEY,
      seed_id TEXT NOT NULL,
      brief_json TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_briefs_seed ON research_briefs(seed_id);
  `);
}

export function recordRecipeAudit(recipeId, event) {
  const db = getIntelligenceDb();
  ensureAuditTrailSchema(db);

  db.prepare(`
    INSERT INTO recipe_audit_trail (
      recipe_id, event_type, actor, source_name, license_name,
      image_license, nutrition_status, verification_status, details_json
    ) VALUES (
      @recipe_id, @event_type, @actor, @source_name, @license_name,
      @image_license, @nutrition_status, @verification_status, @details_json
    )
  `).run({
    recipe_id: recipeId,
    event_type: event.type,
    actor: event.actor || "system",
    source_name: event.sourceName || null,
    license_name: event.licenseName || null,
    image_license: event.imageLicense || null,
    nutrition_status: event.nutritionStatus || null,
    verification_status: event.verificationStatus || null,
    details_json: event.details ? JSON.stringify(event.details) : null,
  });

  writeAuditLog({
    action: event.type,
    entityType: "recipe",
    entityId: recipeId,
    actor: event.actor,
    details: event.details,
  });
}

export function saveResearchBrief(brief) {
  const db = getIntelligenceDb();
  ensureAuditTrailSchema(db);
  db.prepare(`
    INSERT OR REPLACE INTO research_briefs (id, seed_id, brief_json, sources_json, status)
    VALUES (@id, @seed_id, @brief_json, @sources_json, 'completed')
  `).run({
    id: brief.briefId,
    seed_id: brief.dishName,
    brief_json: JSON.stringify(brief),
    sources_json: JSON.stringify(brief.sources),
  });
}

export function getRecipeAuditTrail(recipeId, limit = 50) {
  const db = getIntelligenceDb();
  ensureAuditTrailSchema(db);
  return db.prepare(`
    SELECT * FROM recipe_audit_trail WHERE recipe_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(recipeId, limit).map((row) => ({
    ...row,
    details: row.details_json ? JSON.parse(row.details_json) : null,
  }));
}

export function getResearchBrief(briefId) {
  const db = getIntelligenceDb();
  const row = db.prepare("SELECT * FROM research_briefs WHERE id = ?").get(briefId);
  if (!row) return null;
  return {
    ...row,
    brief: JSON.parse(row.brief_json),
    sources: JSON.parse(row.sources_json),
  };
}
