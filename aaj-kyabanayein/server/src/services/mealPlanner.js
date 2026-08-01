import { RECIPE_INDEX, filterRecipeIndex, getRecipeById } from "../data/recipes.js";

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];
const WEEKLY_DAYS = 7;
const DAY_LABELS = ["Aaj", "Kal", "Parso", "Agle din", "Agle din", "Agle din", "Agle din"];
const BUDGET_RANK = { low: 1, medium: 2, high: 3 };

function matchesDiet(recipe, diet) {
  if (diet === "veg") return recipe.diet.includes("veg");
  if (diet === "non-veg") return true;
  if (diet === "vegan") return recipe.diet.includes("vegan");
  if (diet === "jain") return recipe.diet.includes("jain");
  if (diet === "diabetic") return recipe.diet.includes("diabetic");
  return true;
}

function matchesBudget(recipe, budget) {
  return BUDGET_RANK[recipe.budget] <= BUDGET_RANK[budget];
}

function filterRecipes(prefs, mealType) {
  return filterRecipeIndex({ mealType, diet: prefs.diet }).filter(
    (r) => matchesBudget(r, prefs.budget) && r.cookTime <= prefs.maxCookTime
  );
}

function pickRecipe(pool, usedIds, seed) {
  const available = pool.filter((r) => !usedIds.has(r.id));
  if (available.length === 0) {
    return pool[seed % Math.max(pool.length, 1)] ?? null;
  }
  return available[seed % available.length];
}

function generateDayPlan(prefs, dayOffset, usedIds) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  const meals = [];
  const seed = date.getDate() + dayOffset * 7 + prefs.familySize;

  for (const mealType of MEAL_ORDER) {
    const pool = filterRecipes(prefs, mealType);
    if (pool.length === 0) continue;

    const meta = pickRecipe(pool, usedIds, seed + MEAL_ORDER.indexOf(mealType));
    if (meta) {
      usedIds.add(meta.id);
      const recipe = getRecipeById(meta.id);
      if (recipe) meals.push({ mealType, recipe });
    }
  }

  return {
    date: date.toISOString().split("T")[0],
    dayLabel: DAY_LABELS[dayOffset] ?? date.toLocaleDateString("hi-IN", { weekday: "long" }),
    meals,
  };
}

export function generateWeeklyPlan(prefs) {
  const usedIds = new Set();
  const plans = [];

  for (let i = 0; i < WEEKLY_DAYS; i++) {
    plans.push(generateDayPlan(prefs, i, usedIds));
  }

  return plans;
}

export { generateGroceryList, buildGroceryList } from "./groceryService.js";

export function getDefaultPreferences() {
  return {
    diet: "veg",
    budget: "medium",
    familySize: 4,
    maxCookTime: 45,
    spice: "medium",
    plan: "free",
  };
}
