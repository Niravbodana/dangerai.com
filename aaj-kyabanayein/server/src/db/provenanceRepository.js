import { getDb } from "./connection.js";

function rowToLink(row) {
  return {
    system: row.source_system,
    label: row.source_system === "wikipedia" ? "Wikipedia" : row.source_system === "themealdb" ? "TheMealDB" : row.source_system,
    url: row.source_url,
    license: row.license_spdx,
    attributionText: row.attribution_text,
  };
}

export function upsertProvenance(recipeId, data) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO recipe_provenance (
      recipe_id, source_system, external_id, source_url, license_spdx,
      commercial_use_allowed, attribution_required, attribution_text,
      verification_status, fetched_at, verified_at
    ) VALUES (
      @recipe_id, @source_system, @external_id, @source_url, @license_spdx,
      @commercial_use_allowed, @attribution_required, @attribution_text,
      @verification_status, @fetched_at, @verified_at
    )
    ON CONFLICT(recipe_id, source_system) DO UPDATE SET
      source_url=excluded.source_url,
      license_spdx=excluded.license_spdx,
      attribution_text=excluded.attribution_text,
      fetched_at=excluded.fetched_at
  `).run({
    recipe_id: recipeId,
    source_system: data.sourceSystem || "wikipedia",
    external_id: data.externalId || null,
    source_url: data.sourceUrl || null,
    license_spdx: data.licenseSpdx || "CC-BY-SA-4.0",
    commercial_use_allowed: data.commercialUseAllowed ? 1 : 0,
    attribution_required: data.attributionRequired !== false ? 1 : 0,
    attribution_text: data.attributionText || null,
    verification_status: "verified",
    fetched_at: now,
    verified_at: now,
  });
}

export function getProvenance(recipeId) {
  const rows = getDb().prepare("SELECT * FROM recipe_provenance WHERE recipe_id = ? ORDER BY source_system").all(recipeId);
  if (!rows.length) return null;

  const sourceLinks = rows.map(rowToLink);
  const wikipediaUrl = rows.find((r) => r.source_system === "wikipedia")?.source_url || null;
  const mealDbUrl = rows.find((r) => r.source_system === "themealdb")?.source_url || null;

  return {
    sourceSystem: rows[0].source_system,
    sourceUrl: wikipediaUrl || mealDbUrl || rows[0].source_url,
    wikipediaUrl,
    mealDbUrl,
    sourceLinks,
    licenseSpdx: rows.find((r) => r.source_system === "wikipedia")?.license_spdx || rows[0].license_spdx,
    attributionText: rows.map((r) => r.attribution_text).filter(Boolean).join(" · "),
  };
}

export function getAllProvenanceForIds(ids) {
  if (!ids?.length) return new Map();
  const placeholders = ids.map(() => "?").join(",");
  const rows = getDb()
    .prepare(`SELECT * FROM recipe_provenance WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, source_system`)
    .all(...ids);

  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.recipe_id) || { sourceLinks: [] };
    existing.sourceLinks.push(rowToLink(row));
    if (row.source_system === "wikipedia") existing.wikipediaUrl = row.source_url;
    if (row.source_system === "themealdb") existing.mealDbUrl = row.source_url;
    existing.sourceUrl = existing.wikipediaUrl || existing.mealDbUrl || row.source_url;
    map.set(row.recipe_id, existing);
  }
  return map;
}
