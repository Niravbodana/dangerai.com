import { RECIPES } from "../data/recipes.js";

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

  available.sort((a, b) => (b.healthScore || 5) - (a.healthScore || 5));
  const idx = (dayIndex + mealType.length) % available.length;
  const recipe = available[idx];
  usedIds.add(recipe.id);
  return recipe;
}

export function generateWeeklyHealthyPlan(diet = "veg") {
  const pool = RECIPES.filter((r) => {
    if (diet === "veg") return r.diet.includes("veg");
    if (diet === "non-veg") return true;
    return true;
  }).filter(
    (r) =>
      (r.healthScore || 0) >= 6 ||
      r.tags?.includes("healthy") ||
      r.tags?.includes("diabetic-friendly") ||
      r.category === "healthy"
  );

  const usedIds = new Set();
  const plans = [];

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    const meals = [];
    for (const mealType of ["breakfast", "lunch", "snack", "dinner"]) {
      const recipe = pickHealthy(pool, usedIds, day, mealType);
      if (recipe) meals.push({ mealType, recipe });
    }

    plans.push({
      date: date.toISOString().split("T")[0],
      dayLabel: DAY_LABELS[day],
      healthTip: HEALTH_TIPS[day],
      totalCalories: meals.reduce((sum, m) => sum + (m.recipe.calories || 0), 0),
      meals,
    });
  }

  return plans;
}
