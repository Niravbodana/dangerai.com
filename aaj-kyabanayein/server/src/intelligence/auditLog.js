/**
 * Intelligence audit log — permanent compliance trail.
 */
import { getIntelligenceDb } from "./repository.js";

export function writeAuditLog({
  runId = null,
  action,
  entityType = null,
  entityId = null,
  actor = "system",
  details = null,
}) {
  const db = getIntelligenceDb();
  db.prepare(`
    INSERT INTO intelligence_audit_log (run_id, action, entity_type, entity_id, actor, details_json)
    VALUES (@run_id, @action, @entity_type, @entity_id, @actor, @details_json)
  `).run({
    run_id: runId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    actor,
    details_json: details ? JSON.stringify(details) : null,
  });
}

export function getAuditLog({ limit = 100, entityType = null, runId = null } = {}) {
  const db = getIntelligenceDb();
  let sql = "SELECT * FROM intelligence_audit_log WHERE 1=1";
  const params = [];

  if (entityType) {
    sql += " AND entity_type = ?";
    params.push(entityType);
  }
  if (runId) {
    sql += " AND run_id = ?";
    params.push(runId);
  }

  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  return db.prepare(sql).all(...params).map(parseRow);
}

function parseRow(row) {
  return {
    ...row,
    details: row.details_json ? JSON.parse(row.details_json) : null,
  };
}
