/**
 * Nutrition estimation from recipe model — no external API.
 * Uses calories + meal type + diet/tags heuristics for macros.
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

/** Per-recipe nutrition (estimated from existing recipe fields) */
export function getRecipeNutrition(recipe) {
  if (!recipe) return { ...EMPTY };

  const calories = recipe.calories || 300;
  const profile = MACRO_PROFILES[recipe.mealType] || MACRO_PROFILES.lunch;
  const pPct = Math.min(0.35, profile.protein + proteinBoost(recipe));
  const fPct = profile.fat;
  const cPct = Math.max(0.3, 1 - pPct - fPct);

  const protein = Math.round((calories * pPct) / 4);
  const carbs = Math.round((calories * cPct) / 4);
  const fat = Math.round((calories * fPct) / 9);
  const fiber = Math.max(2, Math.round(3 + calories * (0.006 + fiberBoost(recipe))));

  return { calories, protein, carbs, fat, fiber };
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
  const items = meals.map((m) => getRecipeNutrition(m.recipe || m));
  return sumNutrition(items);
}

export function nutritionFromPlans(plans = []) {
  const days = plans.map((day) => ({
    date: day.date,
    dayLabel: day.dayLabel,
    nutrition: nutritionFromMeals(day.meals || []),
  }));
  const weekly = sumNutrition(days.map((d) => d.nutrition));
  return { days, weekly, dailyAverage: averageNutrition(weekly, plans.length || 1) };
}

function averageNutrition(total, days) {
  const d = Math.max(1, days);
  return {
    calories: Math.round(total.calories / d),
    protein: Math.round(total.protein / d),
    carbs: Math.round(total.carbs / d),
    fat: Math.round(total.fat / d),
    fiber: Math.round(total.fiber / d),
  };
}

export const DEFAULT_GOALS = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
  fiber: 25,
};

export function goalProgress(actual, goals = DEFAULT_GOALS) {
  const keys = ["calories", "protein", "carbs", "fat", "fiber"];
  const progress = {};
  for (const key of keys) {
    const target = goals[key] || 1;
    progress[key] = Math.min(100, Math.round(((actual[key] || 0) / target) * 100));
  }
  return progress;
}
