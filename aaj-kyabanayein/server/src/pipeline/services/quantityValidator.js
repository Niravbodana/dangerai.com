/**
 * Validates ingredient quantities are reasonable before publish.
 */
const MAX_SINGLE_INGREDIENT_G = 2000;
const MIN_INGREDIENTS = 2;

/**
 * @param {{ name: string, quantity?: string|number, unit?: string }[]} ingredients
 * @returns {{ valid: boolean, issues: string[] }}
 */
export function validateIngredientQuantities(ingredients = []) {
  const issues = [];

  if (!Array.isArray(ingredients) || ingredients.length < MIN_INGREDIENTS) {
    issues.push(`At least ${MIN_INGREDIENTS} ingredients required`);
  }

  for (const ing of ingredients) {
    if (!ing.name?.trim()) {
      issues.push("Ingredient missing name");
      continue;
    }

    const q = ing.quantity;
    if (q === undefined || q === null || q === "") {
      issues.push(`"${ing.name}" missing quantity`);
      continue;
    }

    const num = typeof q === "number" ? q : parseFloat(String(q));
    if (Number.isFinite(num)) {
      if (num <= 0) issues.push(`"${ing.name}" quantity must be positive`);
      if (num > MAX_SINGLE_INGREDIENT_G && (ing.unit === "g" || !ing.unit)) {
        issues.push(`"${ing.name}" quantity ${num}g seems unreasonably high`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * @param {{ prepTimeMin?: number, cookTimeMin?: number, totalTimeMin?: number }} times
 */
export function validateTimes(times = {}) {
  const issues = [];
  const { prepTimeMin = 0, cookTimeMin = 0, totalTimeMin = 0 } = times;

  if (prepTimeMin < 0 || cookTimeMin < 0 || totalTimeMin < 0) {
    issues.push("Times cannot be negative");
  }
  if (totalTimeMin > 0 && prepTimeMin + cookTimeMin > totalTimeMin + 30) {
    issues.push("Total time should be >= prep + cook time");
  }
  if (totalTimeMin > 24 * 60) {
    issues.push("Total time exceeds 24 hours — verify");
  }

  return { valid: issues.length === 0, issues };
}
