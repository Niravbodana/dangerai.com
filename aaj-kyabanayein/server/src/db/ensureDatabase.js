import fs from "fs";
import { DB_PATH, getDb } from "./connection.js";
import { seedFromCurated, initDatabase } from "./migrate.js";
import { upsertRecipe, getRecipeCount } from "./recipeRepository.js";
import { WORLD_CUISINE_RECIPES } from "../data/recipeBookWorldCuisines.js";
import { VEG_EXPANSION_RECIPES } from "../data/recipeBookVegExpansion.js";
import { NEW_2026_RECIPES } from "../data/recipeBookNew2026.js";

/** Minimum recipes expected after a healthy curated seed. */
const MIN_SEEDED_RECIPES = 200;

/**
 * Create DB on first run and import curated recipes if empty / under-seeded.
 * Bugfix: previously initDatabase() created the file first, so curated seed never ran
 * and only ~98 world/veg expansion recipes appeared.
 */
export function ensureDatabase() {
  const existedBefore = fs.existsSync(DB_PATH);
  initDatabase();

  // Ensure indexes exist on older DBs (createSchema is IF NOT EXISTS)
  try {
    getDb().exec(`
      CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    `);
  } catch {
    /* ignore */
  }

  let count = 0;
  try {
    count = getRecipeCount();
  } catch {
    count = 0;
  }

  const needsSeed = !existedBefore || count < MIN_SEEDED_RECIPES;
  if (needsSeed) {
    const { total } = seedFromCurated();
    for (const raw of [...NEW_2026_RECIPES, ...WORLD_CUISINE_RECIPES, ...VEG_EXPANSION_RECIPES]) {
      upsertRecipe(raw);
    }
    count = getRecipeCount();
    console.log(`SQLite seeded: ${count} recipes (was ${existedBefore ? "under-seeded" : "missing"})`);
    return { created: !existedBefore, total: count };
  }

  // Upsert any new expansion recipes on every boot (idempotent)
  for (const raw of [...NEW_2026_RECIPES, ...WORLD_CUISINE_RECIPES, ...VEG_EXPANSION_RECIPES]) {
    upsertRecipe(raw);
  }
  return { created: false, total: getRecipeCount() };
}
