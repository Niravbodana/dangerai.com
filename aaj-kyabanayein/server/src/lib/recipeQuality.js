/** Shared recipe content quality checks */

export const GENERIC_STEP_RE =
  /prepare all ingredients|cook following traditional|season to taste and serve|traditional method until done/i;

export const MIN_INGREDIENT_COUNT = 6;
export const MIN_STEP_COUNT = 5;

export function isGenericSteps(steps) {
  if (!steps?.length) return true;
  if (steps.length <= 3 && GENERIC_STEP_RE.test(steps.join(" "))) return true;
  return false;
}

export function isQualityRecipe(recipe) {
  const ingCount = recipe.ingredients?.length || 0;
  const steps = recipe.steps || [];
  const stepsHi = recipe.stepsHi || [];
  const stepsOk = !isGenericSteps(steps) && steps.length >= MIN_STEP_COUNT;
  const hiOk = stepsHi.length >= MIN_STEP_COUNT && hasDevanagari(stepsHi.join(" "));
  const ingOk = ingCount >= MIN_INGREDIENT_COUNT;
  return stepsOk && hiOk && ingOk;
}

export function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(text || "");
}

export function needsEnrichment(recipe) {
  const ingCount = recipe.ingredients?.length || 0;
  const steps = recipe.steps || [];
  const stepsHi = recipe.stepsHi || [];
  const hasGoodSteps =
    (!isGenericSteps(steps) && steps.length >= 5) ||
    (stepsHi.length >= 5 && hasDevanagari(stepsHi.join(" ")));
  return ingCount < 8 || !hasGoodSteps;
}

export function isEnrichmentWorthCaching(enriched) {
  if (!enriched) return false;
  const stepsOk = !isGenericSteps(enriched.steps) && (enriched.steps?.length || 0) >= 5;
  const hiOk = enriched.stepsHi?.length >= 5 && hasDevanagari(enriched.stepsHi.join(" "));
  const ingOk = (enriched.ingredients?.length || 0) >= 8;
  return stepsOk || hiOk || ingOk;
}
