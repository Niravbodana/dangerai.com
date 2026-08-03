/**
 * Admin review queue — approve/reject pipeline imports.
 */
import crypto from "crypto";
import { getIntelligenceDb } from "./repository.js";
import { writeAuditLog } from "./auditLog.js";
import { runQualityGate } from "./qualityGate.js";

export function enqueueForReview(recipe, qualityResult) {
  const db = getIntelligenceDb();
  const id = `review-${recipe.id}-${crypto.randomBytes(4).toString("hex")}`;

  const preview = {
    title: recipe.title,
    cuisine: recipe.cuisine,
    mealType: recipe.mealType,
    diet: recipe.diet,
    calories: recipe.calories,
    imageUrl: recipe.imageUrl,
    sourceName: recipe.sourceName || recipe.dataSource,
    licenseName: recipe.licenseName || recipe.licenseSpdx,
    stepsCount: (recipe.steps || []).length,
    ingredientsCount: (recipe.ingredients || []).length,
  };

  db.prepare(`
    INSERT OR REPLACE INTO recipe_review_queue (
      id, recipe_id, status, duplicate_score, similarity_score,
      license_status, image_license_status, quality_issues, preview_json
    ) VALUES (
      @id, @recipe_id, @status, @duplicate_score, @similarity_score,
      @license_status, @image_license_status, @quality_issues, @preview_json
    )
  `).run({
    id,
    recipe_id: recipe.id,
    status: qualityResult.autoApprove ? "approved" : "pending",
    duplicate_score: qualityResult.scores?.duplicate || 0,
    similarity_score: qualityResult.scores?.similarity || 0,
    license_status: recipe.commercialUseAllowed ? "verified" : "unknown",
    image_license_status: recipe.imageLicense || "none",
    quality_issues: JSON.stringify(qualityResult.issues || []),
    preview_json: JSON.stringify(preview),
  });

  if (qualityResult.autoApprove) {
    approveRecipe(recipe.id, "auto");
  }

  return id;
}

export function listReviewQueue({ status = "pending", limit = 50, offset = 0 } = {}) {
  const db = getIntelligenceDb();
  const rows = db.prepare(`
    SELECT * FROM recipe_review_queue
    WHERE (@status = 'all' OR status = @status)
    ORDER BY created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ status, limit, offset });

  return rows.map(parseReviewRow);
}

export function getReviewItem(id) {
  const db = getIntelligenceDb();
  const row = db.prepare("SELECT * FROM recipe_review_queue WHERE id = ?").get(id);
  return row ? parseReviewRow(row) : null;
}

export function approveRecipe(recipeId, actor = "admin") {
  const db = getIntelligenceDb();
  db.prepare(`
    UPDATE recipe_review_queue SET status = 'approved', reviewed_by = @actor, reviewed_at = datetime('now')
    WHERE recipe_id = @recipe_id AND status = 'pending'
  `).run({ recipe_id: recipeId, actor });

  db.prepare(`
    UPDATE recipe_intelligence SET review_status = 'approved', updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: recipeId });

  writeAuditLog({ action: "recipe_approved", entityType: "recipe", entityId: recipeId, actor });
  return { ok: true, recipeId };
}

export function rejectRecipe(recipeId, actor = "admin", reason = "") {
  const db = getIntelligenceDb();
  db.prepare(`
    UPDATE recipe_review_queue SET status = 'rejected', reviewed_by = @actor, reviewed_at = datetime('now')
    WHERE recipe_id = @recipe_id
  `).run({ recipe_id: recipeId, actor });

  db.prepare(`
    UPDATE recipe_intelligence SET review_status = 'rejected', updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: recipeId });

  writeAuditLog({
    action: "recipe_rejected",
    entityType: "recipe",
    entityId: recipeId,
    actor,
    details: { reason },
  });
  return { ok: true, recipeId, reason };
}

export function bulkApprove(recipeIds = [], actor = "admin") {
  const results = [];
  for (const id of recipeIds) {
    results.push(approveRecipe(id, actor));
  }
  return results;
}

function parseReviewRow(row) {
  return {
    ...row,
    qualityIssues: row.quality_issues ? JSON.parse(row.quality_issues) : [],
    preview: row.preview_json ? JSON.parse(row.preview_json) : null,
  };
}

export function getReviewStats() {
  const db = getIntelligenceDb();
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM recipe_review_queue GROUP BY status
  `).all();
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}
