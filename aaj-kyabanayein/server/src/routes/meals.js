import { Router } from "express";
import { PRICING_PLANS, RECIPES } from "../data/recipes.js";
import {
  generateGroceryList,
  generateWeeklyPlan,
  getDefaultPreferences,
} from "../services/mealPlanner.js";

const router = Router();

router.get("/recipes", (_req, res) => {
  res.json({ success: true, count: RECIPES.length, recipes: RECIPES });
});

router.get("/pricing", (_req, res) => {
  res.json({ success: true, plans: PRICING_PLANS });
});

router.post("/plan", (req, res) => {
  const prefs = { ...getDefaultPreferences(), ...req.body };
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
  res.json({ success: true, message: "AajKyaBanayein API is running" });
});

export default router;
