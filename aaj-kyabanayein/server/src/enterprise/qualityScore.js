/**
 * Composite quality score (0–100) for enterprise recipes.
 */
const WEIGHTS = {
  ingredientCompleteness: 15,
  nutritionConfidence: 20,
  instructionQuality: 15,
  seoQuality: 10,
  licenseVerification: 15,
  imageQuality: 10,
  duplicateConfidence: 15,
};

/**
 * @param {object} agentResults - map of agent name → result
 * @param {object} recipe - assembled recipe
 */
export function calculateQualityScore(agentResults = {}, recipe = {}) {
  const breakdown = {
    ingredientCompleteness: scoreIngredients(agentResults, recipe),
    nutritionConfidence: scoreNutrition(agentResults, recipe),
    instructionQuality: scoreInstructions(agentResults, recipe),
    seoQuality: scoreSeo(agentResults),
    licenseVerification: scoreLicense(agentResults),
    imageQuality: scoreImage(agentResults),
    duplicateConfidence: scoreDuplicate(agentResults),
  };

  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += (breakdown[key] / 100) * weight;
  }

  return {
    score: Math.round(total),
    breakdown,
    weights: WEIGHTS,
    grade: gradeFromScore(total),
  };
}

function scoreIngredients(results, recipe) {
  const ing = results.ingredient_knowledge;
  if (ing?.data?.totalCount) {
    return Math.round((ing.data.normalizedCount / ing.data.totalCount) * 100);
  }
  const count = (recipe.ingredients || []).length;
  if (count >= 5) return 100;
  if (count >= 3) return 75;
  if (count >= 2) return 50;
  return 25;
}

function scoreNutrition(results, recipe) {
  const nut = results.nutrition;
  if (nut?.data?.nutrition?.verified) return nut.data.nutrition.coverage || 100;
  if (recipe.nutrition?.verified) return recipe.nutrition.coverage || 80;
  return 0;
}

function scoreInstructions(results, recipe) {
  const qa = results.recipe_qa;
  if (qa?.data?.checks) {
    const passed = Object.values(qa.data.checks).filter(Boolean).length;
    return Math.round((passed / Object.keys(qa.data.checks).length) * 100);
  }
  const steps = (recipe.steps || []).length;
  if (steps >= 5) return 100;
  if (steps >= 3) return 75;
  return 40;
}

function scoreSeo(results) {
  const seo = results.seo;
  return Math.round((seo?.confidence || 0) * 100);
}

function scoreLicense(results) {
  const lic = results.license_compliance;
  return lic?.success ? 100 : 0;
}

function scoreImage(results) {
  const img = results.image_verification;
  if (img?.data?.imageMetadata?.skipped) return 50;
  return img?.success ? 100 : 0;
}

function scoreDuplicate(results) {
  const dup = results.duplicate_detection;
  if (!dup) return 100;
  return Math.round((1 - (dup.data?.duplicateScore || 0)) * 100);
}

function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export { WEIGHTS };
