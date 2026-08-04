/**
 * PostgreSQL persistence for pipeline recipes and run metadata.
 */
import { runPostgresQuery } from "./postgresClient.js";

/**
 * @param {object} recipe - full production recipe record
 * @param {string} batchId
 */
export async function upsertProductionRecipe(recipe, batchId) {
  const sql = `
    INSERT INTO recipes_production (
      id, slug, title, title_hi, introduction, cuisine, region, category, meal_type,
      diet, difficulty, servings, prep_time_min, cook_time_min, total_time_min,
      ingredients, steps, steps_hi, tips, storage, reheating, substitutions, allergens,
      calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      vitamins, minerals, seo_title, seo_description, faq, schema_org,
      image_url, image_license, image_attribution,
      data_source, source_license, commercial_use_allowed, attribution_required,
      attribution_text, verification_status, last_verified_at, content_hash, duplicate_of,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
      $24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      ingredients = EXCLUDED.ingredients,
      steps = EXCLUDED.steps,
      calories = EXCLUDED.calories,
      content_hash = EXCLUDED.content_hash,
      last_verified_at = EXCLUDED.last_verified_at,
      updated_at = NOW()
  `;

  const params = [
    recipe.id,
    recipe.slug,
    recipe.title,
    recipe.titleHi || null,
    recipe.introduction || null,
    recipe.cuisine || null,
    recipe.region || null,
    recipe.category || null,
    recipe.mealType || null,
    recipe.diet || [],
    recipe.difficulty || "medium",
    recipe.servings || 4,
    recipe.prepTimeMin || 10,
    recipe.cookTimeMin || recipe.cookTime || 30,
    recipe.totalTimeMin || 40,
    JSON.stringify(recipe.ingredients || []),
    JSON.stringify(recipe.steps || []),
    JSON.stringify(recipe.stepsHi || []),
    recipe.tips || null,
    recipe.storage || null,
    recipe.reheating || null,
    JSON.stringify(recipe.substitutions || []),
    recipe.allergens || [],
    recipe.calories ?? recipe.nutrition?.calories ?? null,
    recipe.nutrition?.proteinG ?? null,
    recipe.nutrition?.carbsG ?? null,
    recipe.nutrition?.fatG ?? null,
    recipe.nutrition?.fiberG ?? null,
    recipe.nutrition?.sugarG ?? null,
    recipe.nutrition?.sodiumMg ?? null,
    JSON.stringify(recipe.nutrition?.vitamins || {}),
    JSON.stringify(recipe.nutrition?.minerals || {}),
    recipe.seoTitle || null,
    recipe.seoDescription || null,
    JSON.stringify(recipe.faq || []),
    JSON.stringify(recipe.schemaOrg || null),
    recipe.imageUrl || null,
    recipe.imageLicense || null,
    recipe.imageAttribution || null,
    recipe.dataSource,
    recipe.licenseSpdx || recipe.sourceLicense,
    recipe.commercialUseAllowed === true,
    recipe.attributionRequired === true,
    recipe.attributionText || null,
    recipe.verificationStatus || "verified",
    recipe.lastVerifiedAt || new Date().toISOString(),
    recipe.contentHash || null,
    recipe.duplicateOf || null,
  ];

  await runPostgresQuery(sql, params);

  await runPostgresQuery(
    `INSERT INTO recipe_provenance (
      recipe_id, source_system, external_id, source_url, license_spdx,
      commercial_use_allowed, attribution_required, attribution_text,
      content_hash, ingest_batch_id, fetched_at, verified_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
    ON CONFLICT (recipe_id) DO UPDATE SET
      content_hash = EXCLUDED.content_hash,
      verified_at = NOW()`,
    [
      recipe.id,
      recipe.dataSource,
      recipe.externalId || null,
      recipe.sourceUrl || null,
      recipe.licenseSpdx || recipe.sourceLicense,
      recipe.commercialUseAllowed === true,
      recipe.attributionRequired === true,
      recipe.attributionText || null,
      recipe.contentHash || null,
      batchId,
    ]
  );
}

export async function createPipelineRun(runId, config = {}) {
  await runPostgresQuery(
    `INSERT INTO pipeline_runs (id, status, config) VALUES ($1, 'running', $2)`,
    [runId, JSON.stringify(config)]
  );
}

export async function updatePipelineRun(runId, patch) {
  const fields = [];
  const params = [runId];
  let idx = 2;

  for (const [key, val] of Object.entries(patch)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = $${idx}`);
    params.push(typeof val === "object" ? JSON.stringify(val) : val);
    idx++;
  }

  if (!fields.length) return;
  await runPostgresQuery(`UPDATE pipeline_runs SET ${fields.join(", ")} WHERE id = $1`, params);
}

export async function logSkippedToPostgres({ runId, datasetId, reason, details }) {
  await runPostgresQuery(
    `INSERT INTO pipeline_skipped (run_id, dataset_id, reason, details) VALUES ($1,$2,$3,$4)`,
    [runId, datasetId, reason, JSON.stringify(details || null)]
  );
}

export async function getExistingContentHashes() {
  const res = await runPostgresQuery(
    `SELECT id, content_hash, title, ingredients FROM recipes_production WHERE content_hash IS NOT NULL`
  );
  return res.rows;
}

export async function countProductionRecipes() {
  const res = await runPostgresQuery(`SELECT COUNT(*)::int AS count FROM recipes_production`);
  return res.rows[0]?.count || 0;
}
