/**
 * On-demand recipe load — FAST path.
 * Never block UI on image download. Enrich with short timeout; continue in background.
 */
import { getRecipeById } from "../data/recipes.js";
import { enrichRecipeWithFlow } from "./cookingFlowService.js";
import { getCachedRecipeOverlay, getEnrichedRecipe, enrichRecipeInBackground } from "./recipeEnrichmentService.js";
import { hasCachedImage, imageUrlForRecipe, warmRecipeImage, attachRecipeImageFields } from "./recipeImageService.js";

const ENRICH_BUDGET_MS = 4500;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("enrich-timeout")), ms)),
  ]);
}

export async function loadRecipeOnSelect(recipeId) {
  const base = getRecipeById(recipeId);
  if (!base) return null;

  // Start with instant overlay (disk cache or base)
  let recipe = enrichRecipeWithFlow(getCachedRecipeOverlay(base));

  // Warm photo in background — never await
  warmRecipeImage(recipe);

  // Try fast enrich with budget; if slow, keep going in background
  try {
    const enriched = await withTimeout(getEnrichedRecipe(base, { force: false }), ENRICH_BUDGET_MS);
    recipe = enrichRecipeWithFlow(enriched);
    warmRecipeImage(recipe);
  } catch {
    enrichRecipeInBackground(base);
  }

  return {
    recipe: attachRecipeImageFields({
      ...recipe,
      image: imageUrlForRecipe(recipeId),
      thumbUrl: recipe.thumbUrl || null,
    }),
    image: {
      url: imageUrlForRecipe(recipeId),
      ready: hasCachedImage(recipeId),
      cached: hasCachedImage(recipeId),
      thumbUrl: recipe.thumbUrl || null,
    },
    loadedAt: new Date().toISOString(),
  };
}
