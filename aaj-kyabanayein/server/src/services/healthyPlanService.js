import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";
import { nutritionFromMeals } from "./nutritionService.js";

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

const MEAL_SLOTS = [
  { mealType: "breakfast", label: "Breakfast", labelHi: "नाश्ता", icon: "🌅" },
  { mealType: "lunch", label: "Lunch", labelHi: "दोपहर", icon: "☀️" },
  { mealType: "snack", label: "Snack", labelHi: "स्नैक", icon: "🍎" },
  { mealType: "dinner", label: "Dinner", labelHi: "रात", icon: "🌙" },
];

function daySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededIndex(seed, max, salt = 0) {
  const x = Math.sin(seed + salt) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

function getHealthyPool(diet) {
  let pool = filterRecipeIndex({ diet, category: "healthy" });
  if (pool.length < 30) {
    pool = filterRecipeIndex({ diet }).filter(
      (r) => r.tags?.includes("healthy") || (r.calories || 999) <= 350 || r.mealType === "snack"
    );
  }
  if (pool.length < 20) pool = filterRecipeIndex({ diet });
  return pool;
}

function pickHealthy(pool, usedIds, seed, mealType, salt) {
  const available = pool.filter((r) => r.mealType === mealType && !usedIds.has(r.id));
  if (available.length === 0) return null;
  const idx = seededIndex(seed, available.length, salt);
  const meta = available[idx];
  usedIds.add(meta.id);
  return getRecipeById(meta.id);
}

function buildDayPlan(pool, dayOffset, diet) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const seed = daySeed() + dayOffset;
  const usedIds = new Set();
  const meals = [];

  for (let i = 0; i < MEAL_SLOTS.length; i++) {
    const slot = MEAL_SLOTS[i];
    const recipe = pickHealthy(pool, usedIds, seed, slot.mealType, i * 17);
    if (recipe) {
      meals.push({
        mealType: slot.mealType,
        label: slot.label,
        labelHi: slot.labelHi,
        icon: slot.icon,
        recipe,
      });
    }
  }

  const nutrition = nutritionFromMeals(meals);

  return {
    date: date.toISOString().split("T")[0],
    dayLabel: DAY_LABELS[dayOffset % 7],
    healthTip: HEALTH_TIPS[dayOffset % 7],
    diet,
    totalCalories: nutrition.calories,
    nutrition,
    meals,
  };
}

export function generateDailyHealthyPlan(diet = "veg") {
  return buildDayPlan(getHealthyPool(diet), 0, diet);
}

export function generateWeeklyHealthyPlan(diet = "veg") {
  const pool = getHealthyPool(diet);
  const plans = Array.from({ length: 7 }, (_, day) => buildDayPlan(pool, day, diet));
  const weeklyNutrition = plans.reduce(
    (acc, day) => ({
      calories: acc.calories + (day.nutrition?.calories || 0),
      protein: acc.protein + (day.nutrition?.protein || 0),
      carbs: acc.carbs + (day.nutrition?.carbs || 0),
      fat: acc.fat + (day.nutrition?.fat || 0),
      fiber: acc.fiber + (day.nutrition?.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  return { plans, weeklyNutrition };
}
