import fs from "fs";
import { DB_PATH } from "./connection.js";
import { seedFromCurated } from "./migrate.js";
import { upsertRecipe } from "./recipeRepository.js";
import { WORLD_CUISINE_RECIPES } from "../data/recipeBookWorldCuisines.js";
import { VEG_EXPANSION_RECIPES } from "../data/recipeBookVegExpansion.js";

/** Create DB on first run and import recipes if empty. */
export function ensureDatabase() {
  const exists = fs.existsSync(DB_PATH);
  if (!exists) {
    const { recipes, total } = seedFromCurated();
    for (const raw of [...WORLD_CUISINE_RECIPES, ...VEG_EXPANSION_RECIPES]) upsertRecipe(raw);
    console.log(`SQLite initialized: ${total} recipes`);
    return { created: true, total };
  }
  // Upsert any new expansion recipes on every boot (idempotent)
  for (const raw of [...WORLD_CUISINE_RECIPES, ...VEG_EXPANSION_RECIPES]) upsertRecipe(raw);
  return { created: false };
}
