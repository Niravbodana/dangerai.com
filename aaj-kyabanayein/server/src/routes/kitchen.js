import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  listHelpers,
  createHelper,
  deleteHelper,
  createHelperToken,
  getHelperViewPayload,
  buildDailyInstructions,
} from "../services/maidService.js";
import { getUserSync, putUserSync, bulkPutUserSync, SYNC_KEYS } from "../services/cloudSyncService.js";
import {
  importRecipeFromUrl,
  listImportedRecipes,
  deleteImportedRecipe,
} from "../services/recipeImportService.js";
import {
  compareProvidersForItem,
  getRestockSuggestions,
  computePantryMatchPercent,
  getGroceryProviders,
} from "../services/groceryService.js";
import { getUpcomingFestivals } from "../data/festivalCalendar.js";
import { getRecipeById } from "../data/recipes.js";
import { getDb } from "../db/connection.js";

const router = Router();

// ——— Maid / Helper ———
router.get("/maid/helpers", authMiddleware, (req, res) => {
  res.json({ success: true, helpers: listHelpers(req.userId) });
});

router.post("/maid/helpers", authMiddleware, (req, res) => {
  const { name, language, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: "Helper name required" });
  const helper = createHelper(req.userId, { name, language, phone });
  res.status(201).json({ success: true, helper });
});

router.delete("/maid/helpers/:id", authMiddleware, (req, res) => {
  deleteHelper(req.params.id, req.userId);
  res.json({ success: true });
});

router.post("/maid/helpers/:id/token", authMiddleware, (req, res) => {
  const token = createHelperToken(req.userId, req.params.id, { daysValid: req.body.daysValid || 90 });
  if (!token) return res.status(404).json({ success: false, message: "Helper not found" });
  const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
  res.json({
    success: true,
    ...token,
    shareUrl: `${base}/helper/${token.token}`,
  });
});

router.post("/maid/instructions", authMiddleware, (req, res) => {
  const instructions = buildDailyInstructions({
    planMeals: req.body.planMeals || [],
    profile: req.body.profile || {},
    language: req.body.language || "hi",
  });
  res.json({ success: true, instructions });
});

/** Public helper view — no auth, token only */
router.get("/maid/view/:token", (req, res) => {
  const payload = getHelperViewPayload(req.params.token, {
    planMeals: [],
    profile: {},
  });
  if (!payload) return res.status(404).json({ success: false, message: "Invalid or expired link" });
  res.json({ success: true, ...payload });
});

router.post("/maid/view/:token", (req, res) => {
  const payload = getHelperViewPayload(req.params.token, {
    planMeals: req.body.planMeals || [],
    profile: req.body.profile || {},
  });
  if (!payload) return res.status(404).json({ success: false, message: "Invalid or expired link" });
  res.json({ success: true, ...payload });
});

// ——— Cloud sync ———
router.get("/sync", authMiddleware, (req, res) => {
  res.json({ success: true, ...getUserSync(req.userId), keys: SYNC_KEYS });
});

router.put("/sync/:key", authMiddleware, (req, res) => {
  const result = putUserSync(req.userId, req.params.key, req.body.data, {
    clientUpdatedAt: req.body.updatedAt,
  });
  if (!result.ok) return res.status(409).json({ success: false, ...result });
  res.json({ success: true, ...result });
});

router.post("/sync/bulk", authMiddleware, (req, res) => {
  const results = bulkPutUserSync(req.userId, req.body.bundles || {});
  res.json({ success: true, results });
});

// ——— Recipe import ———
router.get("/recipes/imported", authMiddleware, (req, res) => {
  res.json({ success: true, recipes: listImportedRecipes(req.userId) });
});

router.post("/recipes/import", authMiddleware, async (req, res) => {
  try {
    const recipe = await importRecipeFromUrl(req.userId, req.body.url);
    res.status(201).json({ success: true, recipe });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/recipes/imported/:id", authMiddleware, (req, res) => {
  deleteImportedRecipe(req.userId, req.params.id);
  res.json({ success: true });
});

// ——— Smart grocery ———
router.get("/grocery/providers", (_req, res) => {
  res.json({ success: true, providers: getGroceryProviders() });
});

router.post("/grocery/compare", (req, res) => {
  const { itemName } = req.body;
  res.json({ success: true, providers: compareProvidersForItem(itemName || "groceries") });
});

router.post("/grocery/restock", (req, res) => {
  const suggestions = getRestockSuggestions(req.body.pantryItems || []);
  res.json({ success: true, suggestions });
});

router.post("/recipes/pantry-match", (req, res) => {
  const { recipeId, pantryKeys } = req.body;
  const recipe = getRecipeById(recipeId);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  const percent = computePantryMatchPercent(recipe, pantryKeys || []);
  res.json({ success: true, recipeId, pantryMatchPercent: percent });
});

// ——— Festivals ———
router.get("/festivals/upcoming", (_req, res) => {
  res.json({ success: true, festivals: getUpcomingFestivals(30) });
});

// ——— Push subscription (store for multi-device; delivery via client poll + local notify) ———
router.post("/push/subscribe", authMiddleware, (req, res) => {
  const sub = req.body.subscription;
  if (!sub?.endpoint) return res.status(400).json({ success: false, message: "Invalid subscription" });
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription_json, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, endpoint) DO UPDATE SET subscription_json = excluded.subscription_json`
    )
    .run(req.userId, sub.endpoint, JSON.stringify(sub), now);
  res.json({ success: true, subscribed: true });
});

router.delete("/push/subscribe", authMiddleware, (req, res) => {
  const endpoint = req.body.endpoint;
  if (endpoint) {
    getDb().prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").run(req.userId, endpoint);
  }
  res.json({ success: true });
});

export default router;
