import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";

const DAY_LABELS = [
  "Somvar - Healthy Start",
  "Mangalvar - Protein Day",
  "Budhvar - Light Food",
  "Guruvar - Green Veggies",
  "Shukravar - Balanced",
  "Shanivar - Family Special",
  "Ravivar - Detox Day",
];

const HEALTH_TIPS = [
  "Subah paani piyein, halka nashta karein",
  "Dopahar me protein aur fiber lein",
  "Raat ko halka khana khayein",
  "Hari sabziyan zyada khayein",
  "Tel kam, steamed food zyada",
  "Weekend pe thoda treat — lekin control me",
  "Fruit aur salad zaroor rakhein",
];

function pickHealthy(pool, usedIds, dayIndex, mealType) {
  const available = pool.filter(
    (r) => r.mealType === mealType && !usedIds.has(r.id)
  );
  if (available.length === 0) return null;

  const idx = (dayIndex + mealType.length) % available.length;
  const meta = available[idx];
  return getRecipeById(meta.id);
}

export function generateWeeklyHealthyPlan(diet = "veg") {
  const pool = filterRecipeIndex({ diet, cuisine: "healthy" });
  const fallbackPool = filterRecipeIndex({ diet });
  const usedIds = new Set();
  const plans = [];

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const meals = [];

    for (const mealType of ["breakfast", "lunch", "dinner"]) {
      let recipe = pickHealthy(pool.length ? pool : fallbackPool, usedIds, day, mealType);
      if (recipe) usedIds.add(recipe.id);
      if (recipe) meals.push({ mealType, recipe });
    }

    plans.push({
      date: date.toISOString().split("T")[0],
      dayLabel: DAY_LABELS[day],
      tip: HEALTH_TIPS[day],
      meals,
    });
  }

  return plans;
}
