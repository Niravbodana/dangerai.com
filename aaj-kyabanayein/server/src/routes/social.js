import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { getRating, getReviews, rateRecipe, submitReview } from "../services/ratingsStore.js";
import { addFavorite, getFavorites, removeFavorite } from "../services/favoritesStore.js";
import { getRecipeById } from "../data/recipes.js";

const router = Router();

router.get("/recipes/:id/rating", (req, res) => {
  res.json({ success: true, ...getRating(req.params.id) });
});

router.get("/recipes/:id/reviews", (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  res.json({ success: true, reviews: getReviews(req.params.id, limit) });
});

router.post("/recipes/:id/rate", optionalAuth, (req, res) => {
  const score = Math.min(5, Math.max(1, parseInt(req.body.score) || 0));
  if (!score) return res.status(400).json({ success: false, message: "Score 1-5 required" });
  const userId = req.userId || req.body.guestId || "anonymous";
  const rating = rateRecipe(req.params.id, score, userId);
  res.json({ success: true, ...rating });
});

router.post("/recipes/:id/review", optionalAuth, (req, res) => {
  const score = Math.min(5, Math.max(1, parseInt(req.body.score) || 0));
  if (!score) return res.status(400).json({ success: false, message: "Score 1-5 required" });
  const userId = req.userId || req.body.guestId || "anonymous";
  const comment = req.body.comment || "";
  const result = submitReview(req.params.id, score, userId, comment);
  res.json({ success: true, ...result });
});

router.get("/favorites", optionalAuth, (req, res) => {
  const userId = req.userId || req.query.guestId;
  if (!userId) return res.json({ success: true, favorites: [] });
  const ids = getFavorites(userId);
  const recipes = ids.map((id) => getRecipeById(id)).filter(Boolean);
  res.json({ success: true, favorites: recipes, ids });
});

router.post("/favorites/:recipeId", optionalAuth, (req, res) => {
  const userId = req.userId || req.body.guestId;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });
  const ids = addFavorite(userId, req.params.recipeId);
  rateRecipe(req.params.recipeId, 5, userId);
  res.json({ success: true, ids, ...getRating(req.params.recipeId) });
});

router.delete("/favorites/:recipeId", optionalAuth, (req, res) => {
  const userId = req.userId || req.body.guestId;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });
  const ids = removeFavorite(userId, req.params.recipeId);
  res.json({ success: true, ids });
});

export default router;
