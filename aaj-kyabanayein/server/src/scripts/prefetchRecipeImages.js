import { BASE_RECIPES } from "../data/baseRecipes.js";
import { MORE_RECIPES } from "../data/moreRecipes.js";
import { getEnrichedRecipe } from "../services/recipeEnrichmentService.js";
import { hasCachedImage } from "../services/recipeImageService.js";

const RECIPES = [...BASE_RECIPES, ...MORE_RECIPES];

async function prefetch() {
  console.log(`Enriching & prefetching images for ${RECIPES.length} hand-crafted recipes...`);
  console.log(`Google Search: ${process.env.GOOGLE_API_KEY ? "enabled" : "not configured (using Wikipedia/TheMealDB)"}`);
  let ok = 0;
  let fail = 0;

  for (const recipe of RECIPES) {
    try {
      await getEnrichedRecipe(recipe, { force: true });
      if (hasCachedImage(recipe.id)) {
        ok++;
        console.log(`✓ ${recipe.name}`);
      } else {
        fail++;
        console.warn(`✗ ${recipe.name}: no cached image`);
      }
    } catch (err) {
      fail++;
      console.warn(`✗ ${recipe.name}: ${err.message}`);
    }
  }

  // Default fallback image
  if (!hasCachedImage("_default")) {
    try {
      await getEnrichedRecipe({ id: "_default", name: "Indian thali food", cuisine: "indian" }, { force: true });
      console.log("✓ Default fallback image");
    } catch (err) {
      console.warn("✗ Default image:", err.message);
    }
  }

  console.log(`Done: ${ok} enriched, ${fail} failed`);
}

prefetch();
