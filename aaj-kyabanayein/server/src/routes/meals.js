import { Router } from "express";
import {
  getCuisines,
  getCategoryCounts,
  getRecipeById,
  filterRecipeIndex,
  getRecipeCount,
  toListItem,
  PRICING_PLANS,
  RECIPE_CATEGORIES,
} from "../data/recipes.js";
import { optionalAuth } from "../middleware/auth.js";
import { generateDailyHealthyPlan, generateWeeklyHealthyPlan } from "../services/healthyPlanService.js";
import {
  generateGroceryList,
  buildGroceryList,
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
import { getEnrichedRecipe, getEnrichmentStatus, getCachedRecipeOverlay, enrichRecipeInBackground } from "../services/recipeEnrichmentService.js";
import { findUserById } from "../services/userStore.js";
import { getTrendingRecipes } from "../services/trendingService.js";
import { attachRating } from "../services/ratingsStore.js";
import { getQuerySuggestions, getTrendingSearches } from "../lib/searchUtils.js";
import {
  ensureRecipeImage,
  readCachedImage,
  warmRecipeImage,
  auditCachedImage,
  invalidateCachedImage,
  ensureOverrideImageReady,
  attachRecipeImageFields,
} from "../services/recipeImageService.js";
import { getDirectThumbOverride } from "../data/recipeImageOverrides.js";
import { getFeaturedCookAgainRecipes } from "../services/featuredCookAgainService.js";
import { loadRecipeOnSelect } from "../services/recipeLoadService.js";
import { COLLECTIONS, getCollectionById } from "../data/collections.js";
import { generateDailyBrief, matchCollectionRecipes } from "../services/dailyBriefService.js";
import { getAIServiceStatus, recommendRecipes, semanticSearch } from "../services/ai/index.js";
import { searchRecipes, getSearchIndexStats } from "../intelligence/searchService.js";
import { attachRecipeVideo } from "../data/recipeVideos.js";
import path from "path";
import fs from "fs";

const router = Router();

const DEFAULT_IMAGE_ID = "_default";

router.get("/recipes/image/:id", async (req, res) => {
  const { id } = req.params;
  const wait = req.query.wait !== "0";
  const recipe = id === DEFAULT_IMAGE_ID
    ? { id: DEFAULT_IMAGE_ID, name: "Indian thali platter" }
    : getRecipeById(id);

  const sendCached = (file) => {
    const stat = fs.statSync(file);
    const etag = `"${id}-${stat.mtimeMs}-${stat.size}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }
    res.type("image/jpeg");
    return res.sendFile(path.resolve(file));
  };

  if (recipe && id !== DEFAULT_IMAGE_ID && getDirectThumbOverride(recipe)) {
    try {
      const file = await ensureOverrideImageReady(recipe);
      if (file) return sendCached(file);
    } catch {
      /* fall through to generic pipeline */
    }
  }

  const cached = readCachedImage(id);
  if (cached && recipe && id !== DEFAULT_IMAGE_ID) {
    const override = getDirectThumbOverride(recipe);
    const audit = auditCachedImage(recipe);
    const metaOk = !override || (audit.meta?.source === "curated-thumb" && audit.meta?.originalUrl === override);
    if (audit.ok && metaOk) {
      return sendCached(cached);
    }
    invalidateCachedImage(id);
  } else if (cached && id === DEFAULT_IMAGE_ID) {
    return sendCached(cached);
  }

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
    return sendCached(file);
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
    res.json({
      success: true,
      ...result,
      recipe: attachRecipeImageFields(attachRecipeVideo(result.recipe)),
    });
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
    totalRecipes: getRecipeCount(),
    cuisines: getCuisines(),
  });
});

router.get("/recipes/trending", (req, res) => {
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
  const recipes = getTrendingRecipes(limit).map(toListItem).map(attachRating);
  const trendingDate = recipes[0]?.trendingDate || null;
  res.json({ success: true, recipes, total: recipes.length, trendingDate });
});

router.get("/recipes/featured-strip", (req, res) => {
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 6));
  const recipes = getFeaturedCookAgainRecipes(limit);
  res.json({ success: true, recipes, total: recipes.length });
});

router.get("/recipes/suggest", (req, res) => {
  const q = (req.query.q || "").trim();
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 8));
  const ingredientNames = COMMON_PANTRY_ITEMS.map((i) => i.name || i);

  if (!q) {
    const popular = getTrendingRecipes(limit).map(toListItem).map(attachRating);
    return res.json({
      success: true,
      suggestions: popular,
      trendingSearches: getTrendingSearches(8),
      querySuggestions: getTrendingSearches(6),
      type: "popular",
    });
  }

  const filtered = filterRecipeIndex({ search: q });
  const matches = filtered.slice(0, limit).map(toListItem).map(attachRating);
  const querySuggestions = getQuerySuggestions(q, { ingredients: ingredientNames });
  const ingredientMatch = filtered.some((r) =>
    r.pantryKeys?.some((k) => k.includes(q.toLowerCase())),
  );

  res.json({
    success: true,
    suggestions: matches,
    querySuggestions,
    matchType: ingredientMatch ? "ingredient" : "recipe",
    type: "search",
  });
});

router.get("/ai/status", (_req, res) => {
  res.json({ success: true, ...getAIServiceStatus() });
});

router.post("/ai/recommend", optionalAuth, (req, res) => {
  const { context = {}, options = {} } = req.body || {};
  const result = recommendRecipes(context, options);
  res.json({ success: true, ...result });
});

router.get("/recipes/search", (req, res) => {
  const result = searchRecipes({
    q: req.query.q || "",
    cuisine: req.query.cuisine || null,
    region: req.query.region || null,
    festival: req.query.festival || null,
    mealType: req.query.mealType || null,
    diet: req.query.diet || null,
    difficulty: req.query.difficulty || null,
    maxCookTime: req.query.maxCookTime ? Number(req.query.maxCookTime) : null,
    minCalories: req.query.minCalories ? Number(req.query.minCalories) : null,
    maxCalories: req.query.maxCalories ? Number(req.query.maxCalories) : null,
    minProtein: req.query.minProtein ? Number(req.query.minProtein) : null,
    mode: req.query.mode || "keyword",
    page: parseInt(req.query.page) || 1,
    limit: Math.min(50, parseInt(req.query.limit) || 24),
  });
  res.json({ success: true, ...result, index: getSearchIndexStats() });
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
  const merged = getCachedRecipeOverlay(recipe);
  const full = attachRecipeImageFields(attachRecipeVideo(enrichRecipeWithFlow(merged)));
  enrichRecipeInBackground(recipe);
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

function groceryOptions(body, prefs) {
  return {
    pantryKeys: body.pantry || [],
    familySize: prefs.familySize || 4,
    deductPantry: body.deductPantry !== false,
  };
}

router.post("/plan/healthy", optionalAuth, (req, res) => {
  const diet = req.body.diet || "veg";
  const { plans, weeklyNutrition } = generateWeeklyHealthyPlan(diet);
  const groceryList = buildGroceryList(plans, groceryOptions(req.body, { familySize: 4 }));

  res.json({
    success: true,
    diet,
    plans,
    weeklyNutrition,
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
  const groceryList = buildGroceryList(plans, groceryOptions(req.body, prefs));

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
    totalRecipes: getRecipeCount(),
  });
});

export default router;
