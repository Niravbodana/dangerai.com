#!/usr/bin/env node
/**
 * Initialize SQLite database: schema + import curated JSON + world cuisines + sync image metadata.
 * Usage: npm run db:init
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, DB_PATH } from "../db/connection.js";
import { createSchema } from "../db/schema.js";
import { importRecipesFromJson, importJsonStores } from "../db/migrate.js";
import { upsertRecipe, getRecipeCount, setLocalImage } from "../db/recipeRepository.js";
import { WORLD_CUISINE_RECIPES } from "../data/recipeBookWorldCuisines.js";
import { NEW_2026_RECIPES } from "../data/recipeBookNew2026.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED = path.join(__dirname, "../data/curated/recipes.json");
const IMAGE_CACHE = path.join(__dirname, "../../data/image-cache");

createSchema(getDb());

let imported = 0;
if (fs.existsSync(CURATED)) {
  imported += importRecipesFromJson(CURATED);
}

for (const raw of [...NEW_2026_RECIPES, ...WORLD_CUISINE_RECIPES]) {
  upsertRecipe(raw);
  imported++;
}

importJsonStores();

// Link existing local image cache files to DB
if (fs.existsSync(IMAGE_CACHE)) {
  const files = fs.readdirSync(IMAGE_CACHE).filter((f) => f.endsWith(".jpg"));
  for (const file of files) {
    const recipeId = file.replace(".jpg", "");
    const filePath = path.join(IMAGE_CACHE, file);
    setLocalImage(recipeId, filePath, { source: "local-cache", fetchedAt: new Date().toISOString() });
  }
  console.log(`Linked ${files.length} cached images to database`);
}

console.log(`Database ready at ${DB_PATH}`);
console.log(`Total recipes in DB: ${getRecipeCount()}`);
