import { Router } from "express";
import {
  CUISINES,
  getCategoryCounts,
  isNonVegRecipe,
  isVegRecipe,
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
import { enrichRecipeWithFlow } from "../services/cookingFlowService.js";
import { getEnrichedRecipe, getEnrichmentStatus, getCachedRecipeOverlay, enrichRecipeInBackground, isRecipeEnriched } from "../services/recipeEnrichmentService.js";
import { findUserById } from "../services/userStore.js";
import { getTrendingRecipes } from "../services/trendingService.js";
import { attachRating } from "../services/ratingsStore.js";
import {
  ensureRecipeImage,
  readCachedImage,
  warmRecipeImage,
} from "../services/recipeImageService.js";
import path from "path";

const router = Router();

const DEFAULT_IMAGE_ID = "_default";

router.get("/recipes/image/:id", async (req, res) => {
  const { id } = req.params;
  const recipe = id === DEFAULT_IMAGE_ID
    ? { id: DEFAULT_IMAGE_ID, name: "Indian thali food" }
    : RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return res.status(404).json({ success: false, message: "Recipe not found" });
  }

  try {
    const file = readCachedImage(id) || await ensureRecipeImage(recipe);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    res.type("image/jpeg");
    return res.sendFile(path.resolve(file));
  } catch (err) {
    console.warn(`Image fetch failed for ${id}:`, err.message);
    if (id !== DEFAULT_IMAGE_ID) {
      const fallback = readCachedImage(DEFAULT_IMAGE_ID);
      if (fallback) {
        return res.sendFile(path.resolve(fallback));
      }
      try {
        const file = await ensureRecipeImage({ id: DEFAULT_IMAGE_ID, name: "Indian thali food" });
        return res.sendFile(path.resolve(file));
      } catch {
        return res.status(502).json({ success: false, message: "Image unavailable" });
      }
    }
    return res.status(502).json({ success: false, message: "Image unavailable" });
  }
});

router.get("/recipes/categories", (_req, res) => {
  const counts = getCategoryCounts();
  res.json({
    success: true,
    categories: RECIPE_CATEGORIES,
    counts: counts.categories,
    cuisineCounts: counts.cuisines,
    totalRecipes: RECIPES.length,
    cuisines: CUISINES,
  });
});

router.get("/recipes/trending", (req, res) => {
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
  const recipes = getTrendingRecipes(limit);
  const trendingDate = recipes[0]?.trendingDate || null;
  res.json({ success: true, recipes, total: recipes.length, trendingDate });
});

router.get("/recipes/suggest", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 8));
  if (!q || q.length < 1) {
    return res.json({ success: true, suggestions: [] });
  }
  const matches = [];
  for (const r of RECIPES) {
    if (
      r.name.toLowerCase().includes(q) ||
      r.nameHi?.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q)) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.ingredients?.some((i) => i.name.toLowerCase().includes(q))
    ) {
      matches.push(attachRating(r));
      if (matches.length >= limit) break;
    }
  }
  res.json({ success: true, suggestions: matches });
});

router.get("/recipes/enrichment-status", (_req, res) => {
  res.json({ success: true, ...getEnrichmentStatus() });
});

router.post("/recipes/:id/enrich", async (req, res) => {
  const recipe = RECIPES.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ success: false, message: "Recipe nahi mili" });
  }
  try {
    const enriched = await getEnrichedRecipe(recipe, { force: true });
    const full = enrichRecipeWithFlow(enriched);
    res.json({ success: true, recipe: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/recipes/:id", async (req, res) => {
  const recipe = RECIPES.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ success: false, message: "Recipe nahi mili" });
  }

  const waitEnrich = req.query.wait === "1";
  const skipEnrich = req.query.enrich === "0";

  if (skipEnrich) {
    const full = enrichRecipeWithFlow(recipe);
    return res.json({ success: true, recipe: full, enriched: false });
  }

  // Fast path: serve cache immediately
  const cached = getCachedRecipeOverlay(recipe);
  const isEnriched = isRecipeEnriched(recipe.id);

  if (!waitEnrich && isEnriched) {
    const full = enrichRecipeWithFlow(cached);
    return res.json({ success: true, recipe: full, enriched: true });
  }

  if (!waitEnrich) {
    // Return base/cached data instantly, enrich in background
    const full = enrichRecipeWithFlow(cached);
    enrichRecipeInBackground(recipe);
    return res.json({
      success: true,
      recipe: full,
      enriched: isEnriched,
      enriching: !isEnriched,
    });
  }

  // wait=1 for prefetch script
  const enriched = await getEnrichedRecipe(recipe);
  const full = enrichRecipeWithFlow(enriched);
  res.json({ success: true, recipe: full, enriched: true });
});

router.get("/recipes", (req, res) => {
  const { category, mealType, diet, cuisine, search, page = 1, limit = 24 } = req.query;
  let filtered = RECIPES;

  if (cuisine && cuisine !== "all") {
    filtered = filtered.filter((r) => r.cuisine === cuisine);
  }
  if (category && category !== "all") {
    if (category === "snack") {
      filtered = filtered.filter((r) => r.mealType === "snack");
    } else {
      filtered = filtered.filter((r) => r.category === category);
    }
  }
  if (mealType) filtered = filtered.filter((r) => r.mealType === mealType);
  if (diet === "veg") filtered = filtered.filter(isVegRecipe);
  if (diet === "non-veg") filtered = filtered.filter(isNonVegRecipe);
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

  // Warm image cache slowly in background (max 3 per page to avoid Wikipedia 429)
  for (const recipe of paginated.slice(0, 3)) {
    warmRecipeImage(recipe);
  }

  res.json({
    success: true,
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum),
    recipes: paginated.map(attachRating),
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
  const groceryList = generateGroceryList(plans);

  res.json({
    success: true,
    preferences: prefs,
    plans,
    groceryList,
    groceryLocked: false,
  });
});

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Rasoira API is running",
    totalRecipes: RECIPES.length,
  });
});

export default router;
