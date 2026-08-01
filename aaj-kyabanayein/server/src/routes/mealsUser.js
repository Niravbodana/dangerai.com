import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import {
  addCustomMeal,
  addSavedMeal,
  deleteCustomMeal,
  getCustomMeals,
  getSavedMeals,
  removeSavedMeal,
  loadAllCustomMeals,
} from "../services/mealsStore.js";
import { getRecipeById, registerCustomRecipe } from "../data/recipes.js";
import { enrichRecipeWithFlow } from "../services/cookingFlowService.js";

const router = Router();

function userId(req) {
  return req.userId || req.body?.guestId || req.query?.guestId;
}

// Saved meals (add to my plan)
router.get("/meals/saved", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.json({ success: true, meals: [] });
  const meals = getSavedMeals(uid).map((m) => ({
    ...m,
    recipe: getRecipeById(m.recipeId),
  }));
  res.json({ success: true, meals });
});

router.post("/meals/saved", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.status(400).json({ success: false, message: "Guest ID required" });
  const { recipeId, date, mealType } = req.body;
  const recipe = getRecipeById(recipeId);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  const meal = addSavedMeal(uid, { recipeId, recipeName: recipe.name, date, mealType });
  res.json({ success: true, meal, recipe });
});

router.delete("/meals/saved/:mealId", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.status(400).json({ success: false, message: "Guest ID required" });
  const meals = removeSavedMeal(uid, req.params.mealId);
  res.json({ success: true, meals });
});

// Custom meals (user-created)
router.get("/meals/custom", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.json({ success: true, meals: [] });
  res.json({ success: true, meals: getCustomMeals(uid) });
});

router.post("/meals/custom", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.status(400).json({ success: false, message: "Guest ID required" });
  const { name, nameHi, mealType, diet, cookTime, calories, ingredients, steps, stepsHi, cuisine } = req.body;
  if (!name || !ingredients?.length) {
    return res.status(400).json({ success: false, message: "Name and ingredients required" });
  }
  const recipe = addCustomMeal(uid, {
    name,
    nameHi: nameHi || name,
    mealType: mealType || "lunch",
    diet: diet || ["veg"],
    cookTime: cookTime || 30,
    calories: calories || 300,
    cuisine: cuisine || "indian",
    category: `veg-${mealType || "lunch"}`,
    ingredients,
    steps: steps || [],
    stepsHi: stepsHi || steps || [],
    tags: ["custom"],
  });
  registerCustomRecipe(recipe);
  res.json({ success: true, recipe: enrichRecipeWithFlow(recipe) });
});

router.delete("/meals/custom/:id", optionalAuth, (req, res) => {
  const uid = userId(req);
  if (!uid) return res.status(400).json({ success: false, message: "Guest ID required" });
  deleteCustomMeal(uid, req.params.id);
  res.json({ success: true });
});

// Load custom meals into memory on startup
export function loadCustomMealsOnStartup() {
  for (const recipe of loadAllCustomMeals()) {
    registerCustomRecipe(recipe);
  }
}

export default router;
