import fs from "fs";
import { DB_PATH } from "./connection.js";
import { seedFromCurated } from "./migrate.js";
import { upsertRecipe } from "./recipeRepository.js";
import { WORLD_CUISINE_RECIPES } from "../data/recipeBookWorldCuisines.js";

/** Create DB on first run and import recipes if empty. */
export function ensureDatabase() {
  const exists = fs.existsSync(DB_PATH);
  if (!exists) {
    const { recipes, total } = seedFromCurated();
    for (const raw of WORLD_CUISINE_RECIPES) upsertRecipe(raw);
    console.log(`SQLite initialized: ${total} recipes (${recipes} curated + ${WORLD_CUISINE_RECIPES.length} world)`);
    return { created: true, total };
  }
  return { created: false };
}
