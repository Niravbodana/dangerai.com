/**
 * Phase 3 — import planner.
 * Builds prioritized import queue from curated popular recipes (NOT random).
 */
import { POPULAR_RECIPES, getPhase1Recipes } from "./popularRecipes.js";
import { PHASE3_TARGETS, IMPORT_PHASES, TOTAL_PHASE3_TARGET, TRUSTED_POPULARITY_SIGNALS } from "./importTargets.js";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

/**
 * Convert curated popular recipe → enterprise seed.
 */
export function toImportSeed(recipe) {
  const id = `phase3-${slugify(`${recipe.cuisine}-${recipe.name}`)}`;
  return {
    id,
    slug: slugify(`${recipe.name}-${recipe.cuisine}`),
    name: recipe.name,
    alternativeNames: recipe.alternativeNames || [],
    cuisine: recipe.cuisine,
    region: recipe.region || recipe.state,
    state: recipe.state,
    mealType: recipe.mealType,
    diet: Array.isArray(recipe.diet) ? recipe.diet : [recipe.diet].filter(Boolean),
    category: recipe.category,
    festival: recipe.festival || null,
    popularityScore: recipe.popularityScore,
    priority: recipe.priority,
    searchKeywords: recipe.searchKeywords || [recipe.name.toLowerCase()],
    researchStatus: "pending",
    dataSource: "rasoira-phase3",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    curated: true,
    phase3: true,
  };
}

/**
 * Build import queue sorted by priority then popularity.
 * @param {{ phase?: number, cuisines?: string[], categories?: string[], limit?: number, offset?: number, excludeImported?: Set }} opts
 */
export function buildImportQueue(opts = {}) {
  const phase = opts.phase ?? 1;
  const phaseConfig = IMPORT_PHASES[phase] || IMPORT_PHASES[1];
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const exclude = opts.excludeImported || new Set();

  let queue = POPULAR_RECIPES.filter((r) => {
    if (r.priority > phaseConfig.maxPriority) return false;
    if (r.popularityScore < phaseConfig.minPopularityScore) return false;
    if (opts.cuisines?.length && !opts.cuisines.includes(r.cuisine) && !opts.cuisines.includes(r.category)) return false;
    if (opts.categories?.length && !opts.categories.includes(r.category)) return false;
    const seed = toImportSeed(r);
    if (exclude.has(seed.id)) return false;
    return true;
  });

  queue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.popularityScore - a.popularityScore;
  });

  return queue.slice(offset, offset + limit).map(toImportSeed);
}

/**
 * Full import plan with progress vs targets.
 */
export function buildImportPlan(importedCounts = {}) {
  const byCuisine = {};
  const byCategory = {};

  for (const recipe of POPULAR_RECIPES) {
    byCuisine[recipe.cuisine] = (byCuisine[recipe.cuisine] || 0) + 1;
    byCategory[recipe.category] = (byCategory[recipe.category] || 0) + 1;
  }

  const targets = Object.entries(PHASE3_TARGETS).map(([key, target]) => {
    const curated = byCuisine[key] || byCategory[key] || 0;
    const imported = importedCounts[key] || 0;
    const gap = Math.max(0, target - imported);
    return {
      key,
      target,
      curatedInManifest: curated,
      imported,
      gap,
      percentComplete: target > 0 ? Math.round((imported / target) * 100) : 0,
      status: imported >= target ? "complete" : imported > 0 ? "in_progress" : "pending",
    };
  });

  const phase1Queue = getPhase1Recipes().map(toImportSeed);

  return {
    version: "3.0",
    totalTarget: TOTAL_PHASE3_TARGET,
    curatedRecipes: POPULAR_RECIPES.length,
    phase1Count: phase1Queue.length,
    popularitySignals: TRUSTED_POPULARITY_SIGNALS,
    phases: IMPORT_PHASES,
    targets,
    phase1Top20: phase1Queue.slice(0, 20).map((s) => ({
      id: s.id,
      name: s.name,
      cuisine: s.cuisine,
      popularityScore: s.popularityScore,
    })),
    policy: {
      noRandomRecipes: true,
      qualityOverQuantity: true,
      humanReviewRequired: true,
      originalContentOnly: true,
    },
  };
}

export function getImportStats(db) {
  let importedCounts = {};
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT cuisine, COUNT(*) as c FROM recipe_intelligence
        WHERE payload_json LIKE '%"phase3":true%' OR source_name LIKE '%Phase 3%'
        GROUP BY cuisine
      `).all();
      importedCounts = Object.fromEntries(rows.map((r) => [r.cuisine, r.c]));
    } catch {
      /* table may not exist yet */
    }
  }
  return buildImportPlan(importedCounts);
}
