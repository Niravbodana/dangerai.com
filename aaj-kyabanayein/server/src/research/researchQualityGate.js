/**
 * Research-quality gate — stricter than pipeline QC.
 * Rejects wrong ingredients, impossible steps, bad temps/timings, unverified nutrition.
 */
import { runQualityGate } from "../intelligence/qualityGate.js";

const IMPOSSIBLE_PATTERNS = [
  /cook for \d{3,} minutes/i,
  /heat to \d{4,}°?c/i,
  /boil for 0 minutes/i,
  /freeze.*then.*deep.?fry/i,
];

const TEMP_RANGES = {
  steaming: [90, 105],
  simmering: [80, 100],
  "shallow frying": [160, 200],
  "deep frying": [170, 200],
  baking: [150, 220],
  grilling: [180, 280],
  "pressure cooking": [110, 125],
  tempering: [140, 190],
};

/**
 * @param {object} recipe - full research recipe
 */
export function runResearchQualityGate(recipe) {
  const base = runQualityGate({ ...recipe, autoApprove: false });
  const issues = [...base.issues];

  if (recipe.nutritionStatus === "insufficient_data" || recipe.nutrition?.status === "insufficient_data") {
    issues.push("Nutrition not verified from USDA — cannot publish");
  }
  if (!recipe.nutrition?.verified && recipe.requireVerifiedNutrition !== false) {
    if (!recipe.calories) issues.push("Missing verified nutrition data");
  }

  for (const step of recipe.steps || []) {
    const s = typeof step === "string" ? step : step.body || "";
    for (const pat of IMPOSSIBLE_PATTERNS) {
      if (pat.test(s)) issues.push(`Impossible cooking step: "${s.slice(0, 60)}..."`);
    }
  }

  if (recipe.temperature && recipe.cookingMethod) {
    const tempIssue = validateTemperature(recipe.temperature, recipe.cookingMethod);
    if (tempIssue) issues.push(tempIssue);
  }

  if (recipe.totalTimeMin > 480) {
    issues.push("Total time exceeds 8 hours — verify timings");
  }
  if (recipe.cookTimeMin < 1 && (recipe.steps || []).length > 2) {
    issues.push("Cook time too short for recipe complexity");
  }

  if (!recipe.recipeHistory || recipe.recipeHistory.length < 30) {
    issues.push("Missing recipe history");
  }
  if (!recipe.originalityVerified) {
    issues.push("Originality not verified");
  }

  const scores = {
    ...base.scores,
    nutritionVerified: recipe.nutrition?.verified ? 1 : 0,
  };

  return {
    passed: issues.length === 0,
    issues,
    scores,
    autoApprove: false,
    requiresReview: true,
  };
}

function validateTemperature(tempStr, method) {
  const match = String(tempStr).match(/(\d+)/);
  if (!match) return null;
  const temp = parseInt(match[1], 10);
  const range = TEMP_RANGES[method.toLowerCase()];
  if (!range) return null;
  if (temp < range[0] - 20 || temp > range[1] + 30) {
    return `Temperature ${temp}°C unusual for ${method} (expected ${range[0]}-${range[1]}°C)`;
  }
  return null;
}
