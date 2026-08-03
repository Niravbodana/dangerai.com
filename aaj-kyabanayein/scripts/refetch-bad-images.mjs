#!/usr/bin/env node
/**
 * Force re-fetch bad/missing recipe images and update SQLite.
 * Usage: npm run refetch-images [-- --ids=shahi-paneer,dal-tadka] [-- --all-bad]
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "server");

const idsArg = process.argv.find((a) => a.startsWith("--ids="));
const allBad = process.argv.includes("--all-bad");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog, RECIPE_INDEX, getRecipeById } = await import(
  path.join(serverRoot, "src/data/recipes.js")
);
const { auditCachedImage, ensureRecipeImage, invalidateCachedImage } = await import(
  path.join(serverRoot, "src/services/recipeImageService.js")
);
const { setLocalImage } = await import(path.join(serverRoot, "src/db/recipeRepository.js"));

ensureDatabase();
initRecipeCatalog(true);

let targets = [];
if (idsArg) {
  targets = idsArg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
} else if (allBad) {
  targets = RECIPE_INDEX.filter((meta) => {
    const recipe = getRecipeById(meta.id) || meta;
    const audit = auditCachedImage(recipe);
    return !audit.ok;
  }).map((m) => m.id);
} else {
  console.error("Provide --ids=id1,id2 or --all-bad");
  process.exit(1);
}

targets = targets.slice(0, LIMIT);
let ok = 0;
let fail = 0;

for (const id of targets) {
  const recipe = getRecipeById(id);
  if (!recipe) {
    console.warn(`skip unknown ${id}`);
    continue;
  }
  try {
    invalidateCachedImage(id);
    const file = await ensureRecipeImage(recipe, { force: true });
    setLocalImage(id, file, { source: "refetched", fetchedAt: new Date().toISOString() });
    ok++;
    console.log(`✓ ${recipe.name}`);
  } catch (err) {
    fail++;
    console.warn(`✗ ${recipe.name}: ${err.message}`);
  }
}

console.log(`Done: ${ok} refetched, ${fail} failed`);
