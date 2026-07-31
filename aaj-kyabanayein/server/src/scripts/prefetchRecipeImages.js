import { BASE_RECIPES } from "../data/baseRecipes.js";
import { MORE_RECIPES } from "../data/moreRecipes.js";
import { ensureRecipeImage, hasCachedImage } from "../services/recipeImageService.js";

const RECIPES = [...BASE_RECIPES, ...MORE_RECIPES];

async function prefetch() {
  console.log(`Prefetching images for ${RECIPES.length} hand-crafted recipes...`);
  let ok = 0;
  let fail = 0;

  for (const recipe of RECIPES) {
    if (hasCachedImage(recipe.id)) {
      ok++;
      continue;
    }
    try {
      await ensureRecipeImage(recipe);
      ok++;
      console.log(`✓ ${recipe.name}`);
    } catch (err) {
      fail++;
      console.warn(`✗ ${recipe.name}: ${err.message}`);
    }
  }

  // Default fallback image
  if (!hasCachedImage("_default")) {
    try {
      await ensureRecipeImage({ id: "_default", name: "Indian thali food" });
      console.log("✓ Default fallback image");
    } catch (err) {
      console.warn("✗ Default image:", err.message);
    }
  }

  console.log(`Done: ${ok} cached, ${fail} failed`);
}

prefetch();
