/**
 * Nutrition estimation — server-side mirror of client/lib/nutrition.js
 */
const MACRO_PROFILES = {
  breakfast: { protein: 0.15, carbs: 0.55, fat: 0.3 },
  lunch: { protein: 0.2, carbs: 0.5, fat: 0.3 },
  dinner: { protein: 0.22, carbs: 0.45, fat: 0.33 },
  snack: { protein: 0.12, carbs: 0.58, fat: 0.3 },
};

const EMPTY = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function proteinBoost(recipe) {
  const blob = `${recipe.name} ${(recipe.tags || []).join(" ")} ${(recipe.ingredients || []).map((i) => i.name).join(" ")}`.toLowerCase();
  let boost = 0;
  if (/protein|dal|paneer|chicken|egg|rajma|chana|moong|fish|mutton|anda/.test(blob)) boost += 0.08;
  if (recipe.diet?.includes("non-veg")) boost += 0.05;
  return boost;
}

function fiberBoost(recipe) {
  const blob = `${recipe.name} ${(recipe.tags || []).join(" ")}`.toLowerCase();
  if (/healthy|fiber|salad|sprout|vegetable|sabzi|palak|gobi|oats/.test(blob)) return 0.04;
  if (recipe.diet?.includes("vegan") || recipe.diet?.includes("veg")) return 0.02;
  return 0;
}

export function getRecipeNutrition(recipe) {
  if (!recipe) return { ...EMPTY };

  const calories = recipe.calories || 300;
  const profile = MACRO_PROFILES[recipe.mealType] || MACRO_PROFILES.lunch;
  const pPct = Math.min(0.35, profile.protein + proteinBoost(recipe));
  const fPct = profile.fat;
  const cPct = Math.max(0.3, 1 - pPct - fPct);

  return {
    calories,
    protein: Math.round((calories * pPct) / 4),
    carbs: Math.round((calories * cPct) / 4),
    fat: Math.round((calories * fPct) / 9),
    fiber: Math.max(2, Math.round(3 + calories * (0.006 + fiberBoost(recipe)))),
  };
}

export function sumNutrition(items = []) {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + (n.calories || 0),
      protein: acc.protein + (n.protein || 0),
      carbs: acc.carbs + (n.carbs || 0),
      fat: acc.fat + (n.fat || 0),
      fiber: acc.fiber + (n.fiber || 0),
    }),
    { ...EMPTY }
  );
}

export function nutritionFromMeals(meals = []) {
  return sumNutrition(meals.map((m) => getRecipeNutrition(m.recipe || m)));
}
