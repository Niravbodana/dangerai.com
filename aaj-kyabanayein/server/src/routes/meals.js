import { Router } from "express";
import {
  CUISINES,
  getCategoryCounts,
  getRecipeById,
  filterRecipeIndex,
  RECIPE_INDEX,
  RECIPE_COUNT,
  toListItem,
  PRICING_PLANS,
  RECIPE_CATEGORIES,
} from "../data/recipes.js";
import { optionalAuth } from "../middleware/auth.js";
import { generateDailyHealthyPlan, generateWeeklyHealthyPlan } from "../services/healthyPlanService.js";
import {
  generateGroceryList,
  generateWeeklyPlan,
  getDefaultPreferences,
} from "../services/mealPlanner.js";
import { generateSmartWeeklyPlan } from "../services/smartPlannerService.js";
import {
  COMMON_PANTRY_ITEMS,
  getGroceryRecommendations,
  getPantryAnalytics,
  suggestFromPantry,
} from "../services/pantryService.js";
import { enrichRecipeWithFlow } from "../services/cookingFlowService.js";
import { getEnrichedRecipe, getEnrichmentStatus } from "../services/recipeEnrichmentService.js";
import { findUserById } from "../services/userStore.js";
import { getTrendingRecipes } from "../services/trendingService.js";
import { attachRating } from "../services/ratingsStore.js";
import {
  ensureRecipeImage,
  readCachedImage,
  warmRecipeImage,
} from "../services/recipeImageService.js";
import { loadRecipeOnSelect } from "../services/recipeLoadService.js";
import { COLLECTIONS, getCollectionById } from "../data/collections.js";
import { generateDailyBrief, matchCollectionRecipes } from "../services/dailyBriefService.js";
import { getAIServiceStatus, recommendRecipes, semanticSearch } from "../services/ai/index.js";
import path from "path";

const router = Router();

const DEFAULT_IMAGE_ID = "_default";

router.get("/recipes/image/:id", async (req, res) => {
  const { id } = req.params;
  const wait = req.query.wait !== "0";
  res.setHeader("Cache-Control", "public, max-age=604800");

  const cached = readCachedImage(id);
  if (cached) {
    res.type("image/jpeg");
    return res.sendFile(path.resolve(cached));
  }

  const recipe = id === DEFAULT_IMAGE_ID
    ? { id: DEFAULT_IMAGE_ID, name: "Indian thali platter" }
    : getRecipeById(id);

  if (!recipe && id !== DEFAULT_IMAGE_ID) {
    return res.status(404).json({ success: false, message: "Recipe not found" });
  }

  // Instant: stream remote thumb into cache while client can use thumbUrl on cards
  if (recipe?.thumbUrl && !wait) {
    warmRecipeImage(recipe);
    return res.status(202).json({
      success: false,
      pending: true,
      thumbUrl: recipe.thumbUrl,
      message: "Image loading",
    });
  }

  if (!wait) {
    warmRecipeImage(recipe);
    return res.status(202).json({ success: false, message: "Image loading", pending: true });
  }

  try {
    const file = await ensureRecipeImage(recipe);
    res.type("image/jpeg");
    return res.sendFile(path.resolve(file));
  } catch {
    if (recipe?.thumbUrl) {
      return res.redirect(302, recipe.thumbUrl);
    }
    return res.status(404).json({ success: false, message: "Image unavailable" });
  }
});

/** Load recipe on select — fetches matching photo + enriched ingredients via Google/Gemini */
router.get("/recipes/:id/load", async (req, res) => {
  try {
    const result = await loadRecipeOnSelect(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Recipe nahi mili" });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/recipes/categories", (_req, res) => {
  const counts = getCategoryCounts();
  res.json({
    success: true,
    categories: RECIPE_CATEGORIES,
    counts: counts.categories,
    cuisineCounts: counts.cuisines,
    totalRecipes: RECIPE_COUNT,
    cuisines: CUISINES,
  });
});

router.get("/recipes/trending", (req, res) => {
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
  const recipes = getTrendingRecipes(limit).map(toListItem).map(attachRating);
  const trendingDate = recipes[0]?.trendingDate || null;
  res.json({ success: true, recipes, total: recipes.length, trendingDate });
});

router.get("/recipes/suggest", (req, res) => {
  const q = (req.query.q || "").trim();
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 8));

  if (!q) {
    const popular = getTrendingRecipes(limit).map(toListItem).map(attachRating);
    return res.json({ success: true, suggestions: popular, type: "popular" });
  }

  const { results } = semanticSearch(q, { limit });
  const suggestions = results.map(attachRating);
  res.json({ success: true, suggestions, type: "search" });
});

router.get("/ai/status", (_req, res) => {
  res.json({ success: true, ...getAIServiceStatus() });
});

router.post("/ai/recommend", optionalAuth, (req, res) => {
  const { context = {}, options = {} } = req.body || {};
  const result = recommendRecipes(context, options);
  res.json({ success: true, ...result });
});

router.get("/recipes/enrichment-status", (_req, res) => {
  res.json({ success: true, ...getEnrichmentStatus() });
});

router.post("/recipes/:id/enrich", async (req, res) => {
  const recipe = getRecipeById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe nahi mili" });
  try {
    const enriched = await getEnrichedRecipe(recipe, { force: true });
    res.json({ success: true, recipe: enrichRecipeWithFlow(enriched) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/recipes/:id", (req, res) => {
  const recipe = getRecipeById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe nahi mili" });
  const full = enrichRecipeWithFlow(recipe);
  res.json({ success: true, recipe: full });
});

router.get("/recipes", (req, res) => {
  const { category, mealType, diet, cuisine, search, maxCookTime, page = 1, limit = 24 } = req.query;
  const filtered = filterRecipeIndex({ category, mealType, diet, cuisine, search, maxCookTime });

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  res.json({
    success: true,
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum),
    recipes: paginated.map(toListItem).map(attachRating),
  });
});

router.get("/pantry/items", (_req, res) => {
  res.json({ success: true, items: COMMON_PANTRY_ITEMS });
});

router.post("/pantry/suggest", (req, res) => {
  const { ingredients, diet, mealType, category, limit, pantryOnly, budget, expiringKeys, includeAnalytics, includeGrocery } = req.body;
  const result = suggestFromPantry({ ingredients, diet, mealType, category, limit, pantryOnly, budget, expiringKeys, includeAnalytics, includeGrocery });
  res.json({ success: true, ...result });
});

router.post("/pantry/analytics", (req, res) => {
  const { ingredients, diet, mealType } = req.body;
  const { suggestions } = suggestFromPantry({ ingredients, diet, mealType, limit: 30 });
  const analytics = getPantryAnalytics({ ingredients, suggestions });
  res.json({ success: true, analytics });
});

router.post("/pantry/grocery", (req, res) => {
  const { ingredients, diet, mealType, limit } = req.body;
  const { suggestions } = suggestFromPantry({ ingredients, diet, mealType, limit: 20 });
  const grocery = getGroceryRecommendations({ ingredients, suggestions, limit: limit || 8 });
  res.json({ success: true, grocery });
});

router.get("/plan/healthy/daily", optionalAuth, (req, res) => {
  const diet = req.query.diet || "veg";
  const plan = generateDailyHealthyPlan(diet);
  res.json({
    success: true,
    plan,
    message: "Aaj ka healthy meal plan — sehat ke liye best!",
  });
});

/** Aaj Kya Banaye — personalised daily brief */
router.post("/plan/daily-brief", optionalAuth, (req, res) => {
  const profile = req.body || {};
  const brief = generateDailyBrief(profile);
  res.json({ success: true, brief });
});

router.get("/collections", (_req, res) => {
  res.json({
    success: true,
    collections: COLLECTIONS.map((c) => ({
      id: c.id,
      name: c.name,
      nameHi: c.nameHi,
      description: c.description,
      descriptionHi: c.descriptionHi,
      emoji: c.emoji,
    })),
  });
});

router.get("/collections/:id", (req, res) => {
  const collection = getCollectionById(req.params.id);
  if (!collection) return res.status(404).json({ success: false, message: "Collection not found" });
  const recipes = matchCollectionRecipes(collection, 24).map(attachRating);
  res.json({ success: true, collection, recipes });
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

  const useSmart = req.body.smart !== false;
  const context = {
    taste: req.body.taste,
    family: req.body.family,
    pantry: req.body.pantry,
    expiringKeys: req.body.expiringKeys,
  };

  if (useSmart) {
    const result = generateSmartWeeklyPlan(prefs, context);
    return res.json({
      success: true,
      preferences: prefs,
      plans: result.plans,
      groceryList: result.groceryList,
      smart: true,
      summary: result.summary,
      groceryLocked: false,
    });
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
    totalRecipes: RECIPE_COUNT,
  });
});

export default router;
