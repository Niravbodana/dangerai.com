/**
 * Multi-API recipe import orchestrator — imports from all configured sources.
 */
import { importTheMealDbAll } from "./theMealDbImporter.js";
import { importSpoonacularByCuisine } from "./spoonacularImporter.js";
import { getConfiguredImageApis } from "../premium/multiApiImageSources.js";
import { getDb } from "../db/connection.js";
import { logger } from "../lib/logger.js";

export function getImportApiStatus() {
  const imageApis = getConfiguredImageApis();
  return {
    imageApis,
    recipeApis: {
      themealdb: { enabled: true, free: true, note: "Free test API — all world cuisines" },
      spoonacular: {
        enabled: Boolean(process.env.SPOONACULAR_API_KEY),
        free: "150 points/day",
        note: "Set SPOONACULAR_API_KEY in server/.env",
      },
      bulkLibrary: { enabled: true, note: "npm run library:build -- --target 10000" },
      phase3Curated: { enabled: true, note: "npm run phase3:import" },
    },
    catalog: {
      total: getDb().prepare("SELECT COUNT(*) as c FROM recipes").get()?.c || 0,
      quality90Plus:
        getDb().prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE quality_score >= 90").get()?.c || 0,
    },
  };
}

/**
 * Import from all available recipe APIs.
 */
export async function runMultiApiImport(options = {}) {
  const { mealdb = true, spoonacular = true, mealdbLimit = 0, dryRun = false } = options;
  const report = { startedAt: new Date().toISOString(), sources: {}, finishedAt: null };

  if (mealdb) {
    logger.info("Importing TheMealDB (free API)…");
    report.sources.themealdb = await importTheMealDbAll({
      dryRun,
      premiumUpgrade: !dryRun,
      limit: mealdbLimit,
      concurrency: 3,
    });
  }

  if (spoonacular && process.env.SPOONACULAR_API_KEY) {
    logger.info("Importing Spoonacular…");
    report.sources.spoonacular = await importSpoonacularByCuisine({ dryRun, perCuisine: 30 });
  } else if (spoonacular) {
    report.sources.spoonacular = { skipped: true, reason: "SPOONACULAR_API_KEY not configured" };
  }

  report.finishedAt = new Date().toISOString();
  report.catalog = getImportApiStatus().catalog;
  return report;
}
