/**
 * Quality control gate — reject recipes that fail compliance or completeness checks.
 */
import { verifyImageLicense } from "../pipeline/license/licenseVerifier.js";
import { validateIngredientQuantities, validateTimes } from "../pipeline/services/quantityValidator.js";

const DUPLICATE_THRESHOLD = 0.85;
const MIN_STEPS = 2;
const MIN_INTRO_LENGTH = 20;

/**
 * @param {object} recipe - transformed production recipe
 * @returns {{ passed: boolean, issues: string[], scores: object }}
 */
export function runQualityGate(recipe) {
  const issues = [];
  const scores = { duplicate: 0, similarity: 0 };

  if (!recipe.commercialUseAllowed) {
    issues.push("License does not allow commercial use");
  }
  if (!recipe.licenseSpdx && !recipe.sourceLicense) {
    issues.push("License unknown — import rejected");
  }
  if (!recipe.dataSource && !recipe.sourceName) {
    issues.push("Missing source registry entry");
  }
  if (!recipe.verifiedOn && !recipe.lastVerifiedAt) {
    issues.push("Source not verified");
  }

  const qty = validateIngredientQuantities(recipe.ingredients || []);
  if (!qty.valid) issues.push(...qty.issues.map((i) => `Ingredient: ${i}`));

  const steps = recipe.steps || [];
  if (steps.length < MIN_STEPS) {
    issues.push(`Missing instructions — need at least ${MIN_STEPS} steps`);
  }

  const intro = recipe.introduction || "";
  if (intro.length < MIN_INTRO_LENGTH && steps.length < 3) {
    issues.push("Missing recipe introduction");
  }

  const times = validateTimes({
    prepTimeMin: recipe.prepTimeMin,
    cookTimeMin: recipe.cookTimeMin,
    totalTimeMin: recipe.totalTimeMin,
  });
  if (!times.valid) issues.push(...times.issues);

  if (recipe.nutrition) {
    const cal = recipe.nutrition.calories ?? recipe.calories;
    if (cal != null && (cal < 0 || cal > 5000)) {
      issues.push("Nutrition invalid — calories out of range");
    }
  }

  if (recipe.imageUrl) {
    const imgCheck = verifyImageLicense(
      {
        license: recipe.imageLicense,
        commercialUseAllowed: recipe.imageCommercialUseAllowed,
        licenseExplicit: Boolean(recipe.imageLicense),
        source: recipe.imageProvider,
      },
      { log: false }
    );
    if (!imgCheck.allowed && recipe.imageLicense) {
      issues.push(`Image license invalid: ${imgCheck.reason}`);
    }
  }

  if (recipe.duplicateScore >= DUPLICATE_THRESHOLD) {
    issues.push(`Duplicate score ${recipe.duplicateScore} above threshold`);
  }

  scores.duplicate = recipe.duplicateScore || 0;
  scores.similarity = recipe.similarityScore || 0;

  return {
    passed: issues.length === 0,
    issues,
    scores,
    autoApprove: issues.length === 0 && scores.duplicate < 0.5,
  };
}

export { DUPLICATE_THRESHOLD };
