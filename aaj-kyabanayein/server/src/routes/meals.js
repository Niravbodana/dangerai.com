import { Router } from "express";
import {
  getCategoryCounts,
  PRICING_PLANS,
  RECIPE_CATEGORIES,
  RECIPES,
} from "../data/recipes.js";
import { optionalAuth } from "../middleware/auth.js";
import { generateWeeklyHealthyPlan } from "../services/healthyPlanService.js";
import {
  generateGroceryList,
  generateWeeklyPlan,
  getDefaultPreferences,
} from "../services/mealPlanner.js";
import {
  COMMON_PANTRY_ITEMS,
  suggestFromPantry,
} from "../services/pantryService.js";
import { findUserById } from "../services/userStore.js";

const router = Router();

router.get("/recipes", (req, res) => {
  const { category, mealType, diet, search, page = 1, limit = 24 } = req.query;
  let filtered = RECIPES;

  if (category && category !== "all") {
    if (category === "snack") {
      filtered = filtered.filter((r) => r.mealType === "snack");
    } else {
      filtered = filtered.filter((r) => r.category === category);
    }
  }
  if (mealType) filtered = filtered.filter((r) => r.mealType === mealType);
  if (diet === "veg") filtered = filtered.filter((r) => r.diet.includes("veg"));
  if (diet === "non-veg") filtered = filtered.filter((r) => r.diet.includes("non-veg"));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nameHi.includes(search) ||
        r.tags?.some((t) => t.includes(q))
    );
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  res.json({
    success: true,
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum),
    recipes: paginated,
  });
});

router.get("/recipes/categories", (_req, res) => {
  res.json({
    success: true,
    categories: RECIPE_CATEGORIES,
    counts: getCategoryCounts(),
    totalRecipes: RECIPES.length,
  });
});

router.get("/pantry/items", (_req, res) => {
  res.json({ success: true, items: COMMON_PANTRY_ITEMS });
});

router.post("/pantry/suggest", (req, res) => {
  const { ingredients, diet, mealType, category, limit } = req.body;
  const result = suggestFromPantry({ ingredients, diet, mealType, category, limit });
  res.json({ success: true, ...result });
});

router.post("/plan/healthy", optionalAuth, (req, res) => {
  const diet = req.body.diet || "veg";
  const plans = generateWeeklyHealthyPlan(diet);
  const groceryList = generateGroceryList(plans);

  res.json({
    success: true,
    diet,
    plans,
    groceryList,
    message: "7 din ka healthy meal plan — sehat ke liye best!",
  });
});

router.get("/pricing", (_req, res) => {
  res.json({ success: true, plans: PRICING_PLANS });
});

router.post("/plan", optionalAuth, (req, res) => {
  let prefs = { ...getDefaultPreferences(), ...req.body };

  if (req.userId) {
    const user = findUserById(req.userId);
    if (user) {
      prefs = { ...user.preferences, ...req.body, plan: user.plan };
    }
  }

  const plans = generateWeeklyPlan(prefs);
  const planTier = prefs.plan || "free";
  const includeGrocery = planTier !== "free";

  res.json({
    success: true,
    preferences: prefs,
    plans,
    groceryList: includeGrocery ? generateGroceryList(plans) : [],
    groceryLocked: !includeGrocery,
  });
});

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "AajKyaBanayein API is running",
    totalRecipes: RECIPES.length,
  });
});

export default router;
