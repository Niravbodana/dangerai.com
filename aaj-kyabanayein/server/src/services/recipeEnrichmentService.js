/** Minimal recipe enrichment — returns recipe as-is (pipelines removed). */
export function getEnrichmentStatus() {
  return { enabled: false, provider: null, cached: 0 };
}

export function getCachedRecipeOverlay(recipe) {
  return recipe;
}

export function enrichRecipeInBackground() {
  /* no-op */
}

export async function getEnrichedRecipe(recipe) {
  return recipe;
}
