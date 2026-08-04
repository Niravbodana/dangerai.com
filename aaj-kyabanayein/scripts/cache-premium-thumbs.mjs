#!/usr/bin/env node
/**
 * Cache all premium MealDB/Wikipedia thumbs locally (fast, accurate photos).
 * Usage: npm run cache-premium-thumbs
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog, RECIPE_INDEX, getRecipeById } = await import(
  path.join(serverRoot, "src/data/recipes.js")
);
const { isPremiumThumbUrl } = await import(path.join(serverRoot, "src/lib/cdnImage.js"));
const { cacheImageFromUrl, hasCachedImage, auditCachedImage } = await import(
  path.join(serverRoot, "src/services/recipeImageService.js")
);
const { setLocalImage } = await import(path.join(serverRoot, "src/db/recipeRepository.js"));

ensureDatabase();
initRecipeCatalog(true);

let cached = 0;
let skipped = 0;
let failed = 0;

for (const meta of RECIPE_INDEX) {
  const recipe = getRecipeById(meta.id) || meta;
  const thumb = recipe.thumbUrl || meta.thumbUrl;
  if (!isPremiumThumbUrl(thumb)) {
    skipped++;
    continue;
  }
  const audit = hasCachedImage(recipe.id) ? auditCachedImage(recipe) : { ok: false };
  if (audit.ok) {
    skipped++;
    continue;
  }
  try {
    await cacheImageFromUrl(recipe.id, thumb, "thumb-embedded", {
      force: true,
      title: recipe.name,
    });
    setLocalImage(recipe.id, null, { source: "thumb-embedded" });
    cached++;
    if (cached % 50 === 0) console.log(`  … ${cached} cached`);
  } catch (err) {
    failed++;
    console.warn(`✗ ${recipe.id}: ${err.message}`);
  }
}

console.log(`\nPremium thumb cache: ${cached} cached, ${skipped} skipped, ${failed} failed (${RECIPE_INDEX.length} total)`);
