/**
 * Public catalog quality gate — only recipes scoring 90+ appear in browse/search.
 * Famous Indian dishes rank first when browsing without a search query.
 */
import { ensureIntelligenceDb, getIntelligenceDb } from "../intelligence/repository.js";
import { POPULAR_RECIPES } from "../phase3/popularRecipes.js";

export const MIN_PUBLIC_QUALITY = Number(process.env.MIN_RECIPE_QUALITY || 90);

let qualityById = new Map();
let popularityByName = new Map();

function normalizeName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/\b(home|traditional|authentic|classic|special|quick|easy|style|recipe)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPopularityIndex() {
  popularityByName = new Map();
  for (const entry of POPULAR_RECIPES) {
    const score = entry.popularityScore || 80;
    const priorityBoost = entry.priority === 1 ? 8 : 0;
    const finalScore = score + priorityBoost;
    popularityByName.set(normalizeName(entry.name), finalScore);
    for (const alt of entry.alternativeNames || []) {
      popularityByName.set(normalizeName(alt), finalScore);
    }
  }
}

export function initQualityCatalog() {
  try {
    ensureIntelligenceDb();
    const db = getIntelligenceDb();
    const rows = db
      .prepare("SELECT id, quality_score FROM recipe_intelligence WHERE quality_score > 0")
      .all();
    qualityById = new Map(rows.map((r) => [r.id, Number(r.quality_score)]));
    buildPopularityIndex();
  } catch {
    qualityById = new Map();
    buildPopularityIndex();
  }
}

export function refreshQualityCatalog() {
  initQualityCatalog();
}

export function getQualityScore(id) {
  return qualityById.get(id) ?? 0;
}

export function passesQualityGate(id) {
  if (process.env.DISABLE_QUALITY_GATE === "1") return true;
  if (!id || id.startsWith("tmdb-")) return false;
  return getQualityScore(id) >= MIN_PUBLIC_QUALITY;
}

export function getPopularityScore(recipe) {
  if (!recipe?.name) return 0;
  const key = normalizeName(recipe.name);
  const direct = popularityByName.get(key);
  if (direct) return direct;

  // Partial match for variants like "Home Style Butter Chicken"
  let best = 0;
  for (const [name, score] of popularityByName) {
    if (key.includes(name) || name.includes(key)) {
      best = Math.max(best, score - 5);
    }
  }
  if (best > 0) return best;

  // Curated hand-picked recipes get a small boost
  if (recipe.id && !recipe.id.startsWith("lib-") && !recipe.id.startsWith("phase3-")) {
    return 72;
  }
  return 0;
}

/** Sort: famous dishes first, then quality score, then name */
export function sortCatalogForBrowse(list) {
  return [...list].sort((a, b) => {
    const popDiff = getPopularityScore(b) - getPopularityScore(a);
    if (popDiff !== 0) return popDiff;
    const qDiff = getQualityScore(b.id) - getQualityScore(a.id);
    if (qDiff !== 0) return qDiff;
    return (a.name || "").localeCompare(b.name || "");
  });
}

export function filterQualityApproved(list) {
  return list.filter((r) => passesQualityGate(r.id));
}

export function getPublicRecipeCount() {
  if (process.env.DISABLE_QUALITY_GATE === "1") return qualityById.size;
  let count = 0;
  for (const score of qualityById.values()) {
    if (score >= MIN_PUBLIC_QUALITY) count++;
  }
  return count;
}
