/**
 * On-demand recipe load — photo + ingredients via Google/Gemini pipeline.
 * Called when user selects a recipe.
 */
import { getRecipeById } from "../data/recipes.js";
import { enrichRecipeWithFlow } from "./cookingFlowService.js";
import { getEnrichedRecipe } from "./recipeEnrichmentService.js";
import { ensureRecipeImage, hasCachedImage, imageUrlForRecipe } from "./recipeImageService.js";

export async function loadRecipeOnSelect(recipeId) {
  const base = getRecipeById(recipeId);
  if (!base) return null;

  const needsFetch = !hasCachedImage(recipeId);
  const enriched = await getEnrichedRecipe(base, { force: needsFetch });
  const recipe = enrichRecipeWithFlow(enriched);

  let imageReady = hasCachedImage(recipeId);
  if (!imageReady) {
    try {
      await ensureRecipeImage(recipe);
      imageReady = true;
    } catch {
      imageReady = false;
    }
  }

  return {
    recipe,
    image: {
      url: imageUrlForRecipe(recipeId),
      ready: imageReady,
      cached: hasCachedImage(recipeId),
    },
    loadedAt: new Date().toISOString(),
  };
}
