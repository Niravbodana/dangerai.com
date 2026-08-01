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

  return {
    date: date.toISOString().split("T")[0],
    dayLabel: DAY_LABELS[dayOffset % 7],
    healthTip: HEALTH_TIPS[dayOffset % 7],
    diet,
    totalCalories: meals.reduce((sum, m) => sum + (m.recipe.calories || 0), 0),
    meals,
  };
}

function getHealthyPool(diet) {
  let pool = filterRecipeIndex({ diet, category: "healthy" });
  if (pool.length < 20) pool = filterRecipeIndex({ diet });
  if (pool.length < 10) pool = filterRecipeIndex({});
  return pool;
}

/** Today's recommended healthy meals — breakfast, lunch, snack, dinner */
export function generateDailyHealthyPlan(diet = "veg") {
  const pool = getHealthyPool(diet);
  return buildDayPlan(pool, 0, diet);
}

export function generateWeeklyHealthyPlan(diet = "veg") {
  const pool = getHealthyPool(diet);
  const plans = [];
  for (let day = 0; day < 7; day++) {
    plans.push(buildDayPlan(pool, day, diet));
  }
  return plans;
}
