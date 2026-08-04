import fs from "fs";
import { DB_PATH, getDb } from "./connection.js";
import { initDatabase } from "./migrate.js";
import { getRecipeCount } from "./recipeRepository.js";

/**
 * Create empty SQLite schema on first run — no auto-seeding.
 */
export function ensureDatabase() {
  const existedBefore = fs.existsSync(DB_PATH);
  initDatabase();

  try {
    getDb().exec(`
      CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    `);
  } catch {
    /* ignore */
  }

  const count = getRecipeCount();
  if (!existedBefore) {
    console.log(`SQLite ready: empty catalog (${count} recipes)`);
  }
  return { created: !existedBefore, total: count };
}
