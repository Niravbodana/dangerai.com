#!/usr/bin/env node
/**
 * Download and save all recipe photos locally. Updates SQLite local_image paths.
 * Usage: npm run sync-images [-- --limit=50]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/connection.js";
import { createSchema } from "../db/schema.js";
import { getRecipeById, setLocalImage, getRecipeCount } from "../db/recipeRepository.js";
import { ensureRecipeImage, hasCachedImage, readCachedImage } from "../services/recipeImageService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

createSchema(getDb());
fs.mkdirSync(CACHE_DIR, { recursive: true });

const rows = getDb().prepare("SELECT id FROM recipes ORDER BY id").all();
const toProcess = rows.slice(0, LIMIT);

let ok = 0;
let skip = 0;
let fail = 0;

for (const { id } of toProcess) {
  try {
    if (hasCachedImage(id)) {
      const file = readCachedImage(id);
      setLocalImage(id, file, { source: "local-cache" });
      skip++;
      continue;
    }
    const recipe = getRecipeById(id) || { id, name: id };
    await ensureRecipeImage(recipe);
    if (hasCachedImage(id)) {
      setLocalImage(id, readCachedImage(id), { source: "fetched" });
      ok++;
      console.log(`✓ ${recipe.name || id}`);
    } else {
      fail++;
    }
  } catch (err) {
    fail++;
    console.warn(`✗ ${id}: ${err.message}`);
  }
}

console.log(`Done: ${ok} fetched, ${skip} already cached, ${fail} failed (${getRecipeCount()} total recipes)`);
