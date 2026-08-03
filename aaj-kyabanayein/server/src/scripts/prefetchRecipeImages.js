/**
 * Batch image prefetch pipeline for all curated recipes.
 * Usage: npm run prefetch-images [-- --limit=100] [-- --trending]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { warmRecipeImage, hasCachedImage } from "../services/recipeImageService.js";
import { getEnrichedRecipe } from "../services/recipeEnrichmentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_FILE = path.join(__dirname, "../data/curated/recipes.json");

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const TRENDING_ONLY = process.argv.includes("--trending");

async function prefetch() {
  const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf-8"));
  let list = recipes;

  if (TRENDING_ONLY) {
    list = recipes.filter((r) => r.tags?.includes("popular") || r.tags?.includes("trending")).slice(0, 50);
  }

  const toProcess = list.filter((r) => !hasCachedImage(r.id)).slice(0, LIMIT);
  console.log(`Prefetch pipeline: ${toProcess.length} recipes need images (${recipes.length} total)`);

  let ok = 0;
  let fail = 0;
  const BATCH = 6;

  for (let i = 0; i < toProcess.length; i += BATCH) {
    const batch = toProcess.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (recipe) => {
        try {
          await getEnrichedRecipe(recipe, { force: false });
          warmRecipeImage(recipe);
          if (hasCachedImage(recipe.id)) {
            ok++;
            console.log(`✓ ${recipe.name}`);
          } else {
            fail++;
          }
        } catch (err) {
          fail++;
          console.warn(`✗ ${recipe.name}: ${err.message}`);
        }
      })
    );
  }

  console.log(`Done: ${ok} cached, ${fail} pending/failed`);
}

prefetch();
