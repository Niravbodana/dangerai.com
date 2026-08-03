/**
 * Persist intelligence recipes to SQLite store (+ optional PostgreSQL).
 */
import { getIntelligenceDb } from "./repository.js";
import { writeAuditLog } from "./auditLog.js";
import { isPostgresConfigured } from "../pipeline/db/postgresClient.js";

export function saveIntelligenceRecipe(recipe) {
  const db = getIntelligenceDb();
  const now = new Date().toISOString();

  const sourceMeta = {
    source_name: recipe.sourceName || recipe.dataSource,
    source_url: recipe.sourceUrl || null,
    license_name: recipe.licenseName || recipe.licenseSpdx || recipe.sourceLicense,
    license_url: recipe.licenseUrl || null,
    commercial_use_allowed: recipe.commercialUseAllowed ? 1 : 0,
    attribution_required: recipe.attributionRequired ? 1 : 0,
    verified_on: recipe.verifiedOn || recipe.lastVerifiedAt || now,
    imported_on: recipe.importedOn || now,
  };

  db.prepare(`
    INSERT OR REPLACE INTO recipe_intelligence (
      id, slug, title, payload_json,
      source_name, source_url, license_name, license_url,
      commercial_use_allowed, attribution_required, verified_on, imported_on,
      review_status, duplicate_score, similarity_score, content_hash,
      cuisine, region, meal_type, diet, calories, protein_g, difficulty,
      cook_time_min, image_url, image_license, seo_title, updated_at
    ) VALUES (
      @id, @slug, @title, @payload_json,
      @source_name, @source_url, @license_name, @license_url,
      @commercial_use_allowed, @attribution_required, @verified_on, @imported_on,
      @review_status, @duplicate_score, @similarity_score, @content_hash,
      @cuisine, @region, @meal_type, @diet, @calories, @protein_g, @difficulty,
      @cook_time_min, @image_url, @image_license, @seo_title, @updated_at
    )
  `).run({
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    payload_json: JSON.stringify(recipe),
    ...sourceMeta,
    review_status: recipe.reviewStatus || "pending",
    duplicate_score: recipe.duplicateScore || 0,
    similarity_score: recipe.similarityScore || 0,
    content_hash: recipe.contentHash,
    cuisine: recipe.cuisine,
    region: recipe.region,
    meal_type: recipe.mealType,
    diet: JSON.stringify(recipe.diet || []),
    calories: recipe.calories,
    protein_g: recipe.nutrition?.proteinG,
    difficulty: recipe.difficulty,
    cook_time_min: recipe.cookTimeMin,
    image_url: recipe.imageUrl,
    image_license: recipe.imageLicense,
    seo_title: recipe.seoTitle,
    updated_at: now,
  });

  writeAuditLog({
    action: "recipe_saved",
    entityType: "recipe",
    entityId: recipe.id,
    details: { source: sourceMeta.source_name, license: sourceMeta.license_name },
  });

  return recipe.id;
}

export async function saveToPostgresIfConfigured(recipe, batchId) {
  if (!isPostgresConfigured()) return false;
  try {
    const { upsertProductionRecipe } = await import("../pipeline/db/postgresRepository.js");
    await upsertProductionRecipe(recipe, batchId);
    return true;
  } catch (err) {
    writeAuditLog({
      action: "postgres_save_failed",
      entityType: "recipe",
      entityId: recipe.id,
      details: { error: err.message },
    });
    return false;
  }
}

export function getIntelligenceRecipe(id) {
  const db = getIntelligenceDb();
  const row = db.prepare("SELECT * FROM recipe_intelligence WHERE id = ?").get(id);
  if (!row) return null;
  return JSON.parse(row.payload_json);
}

export function countIntelligenceRecipes(status = null) {
  const db = getIntelligenceDb();
  if (!status) {
    return db.prepare("SELECT COUNT(*) as c FROM recipe_intelligence").get()?.c || 0;
  }
  return db.prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE review_status = ?").get(status)?.c || 0;
}
