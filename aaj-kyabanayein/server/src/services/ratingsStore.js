import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeRatings, mergeReviews } from "../data/seedRatings.js";
import { getRecipeById } from "../data/recipes.js";
import { getDb } from "../db/connection.js";
import { isDatabaseReady } from "../db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATINGS_FILE = path.join(__dirname, "../data/ratings.json");

function recipeName(recipeId) {
  return getRecipeById(recipeId)?.name || "";
}

function ensure() {
  const dir = path.dirname(RATINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(RATINGS_FILE)) fs.writeFileSync(RATINGS_FILE, JSON.stringify({}));
}

function readJson() {
  ensure();
  return JSON.parse(fs.readFileSync(RATINGS_FILE, "utf-8"));
}

function writeJson(data) {
  ensure();
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(data, null, 2));
}

function readLiveBlock(recipeId) {
  if (isDatabaseReady()) {
    const rows = getDb()
      .prepare("SELECT user_id, score, comment, created_at FROM recipe_ratings WHERE recipe_id = ?")
      .all(recipeId);
    if (!rows.length) return null;
    const users = {};
    const reviews = [];
    let total = 0;
    for (const row of rows) {
      users[row.user_id] = row.score;
      total += row.score;
      if (row.comment) {
        reviews.push({
          userId: row.user_id,
          score: row.score,
          comment: row.comment,
          createdAt: row.created_at,
        });
      }
    }
    return { total, count: rows.length, users, reviews };
  }
  return readJson()[recipeId] || null;
}

function writeLiveBlock(recipeId, block) {
  if (isDatabaseReady()) {
    const db = getDb();
    db.prepare("DELETE FROM recipe_ratings WHERE recipe_id = ?").run(recipeId);
    const stmt = db.prepare(
      "INSERT INTO recipe_ratings (recipe_id, user_id, score, comment, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    for (const [userId, score] of Object.entries(block.users || {})) {
      const review = (block.reviews || []).find((r) => r.userId === userId);
      stmt.run(recipeId, userId, score, review?.comment || null, review?.createdAt || new Date().toISOString());
    }
    return;
  }
  const data = readJson();
  data[recipeId] = block;
  writeJson(data);
}

export function getRating(recipeId, userId = null) {
  const live = readLiveBlock(recipeId);
  const merged = mergeRatings(recipeId, live, recipeName(recipeId));
  const userScore = userId && live?.users?.[userId] ? live.users[userId] : 0;
  return { ...merged, userScore };
}

export function rateRecipe(recipeId, score, userId = "guest") {
  const live = readLiveBlock(recipeId) || { total: 0, count: 0, users: {}, reviews: [] };
  const prev = live.users[userId];
  if (prev) live.total -= prev;
  else live.count++;
  live.users[userId] = score;
  live.total += score;
  writeLiveBlock(recipeId, live);
  return getRating(recipeId);
}

export function submitReview(recipeId, score, userId, comment = "") {
  const live = readLiveBlock(recipeId) || { total: 0, count: 0, users: {}, reviews: [] };
  if (!live.reviews) live.reviews = [];

  const prev = live.users[userId];
  if (prev) live.total -= prev;
  else live.count++;
  live.users[userId] = score;
  live.total += score;

  const review = {
    userId,
    score,
    comment: String(comment || "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  const idx = live.reviews.findIndex((r) => r.userId === userId);
  if (idx >= 0) live.reviews[idx] = review;
  else live.reviews.push(review);

  writeLiveBlock(recipeId, live);
  return { ...getRating(recipeId), review };
}

export function getReviews(recipeId, limit = 20) {
  const live = readLiveBlock(recipeId)?.reviews || [];
  return mergeReviews(recipeId, live, recipeName(recipeId)).slice(0, limit);
}

export function attachRating(recipe) {
  return { ...recipe, rating: getRating(recipe.id) };
}

export function getTopRated(limit = 10) {
  if (isDatabaseReady()) {
    return getDb()
      .prepare(
        `SELECT recipe_id as recipeId, AVG(score) as average, COUNT(*) as count
         FROM recipe_ratings GROUP BY recipe_id HAVING count >= 1
         ORDER BY average DESC LIMIT ?`
      )
      .all(limit);
  }
  const data = readJson();
  return Object.entries(data)
    .map(([id, r]) => ({ recipeId: id, average: r.total / r.count, count: r.count }))
    .filter((r) => r.count >= 1)
    .sort((a, b) => b.average - a.average)
    .slice(0, limit);
}

export function getAllRatings() {
  if (isDatabaseReady()) {
    const rows = getDb().prepare("SELECT recipe_id, user_id, score, comment, created_at FROM recipe_ratings").all();
    const out = {};
    for (const row of rows) {
      if (!out[row.recipe_id]) out[row.recipe_id] = { total: 0, count: 0, users: {}, reviews: [] };
      out[row.recipe_id].users[row.user_id] = row.score;
      out[row.recipe_id].total += row.score;
      out[row.recipe_id].count++;
      if (row.comment) {
        out[row.recipe_id].reviews.push({
          userId: row.user_id,
          score: row.score,
          comment: row.comment,
          createdAt: row.created_at,
        });
      }
    }
    return out;
  }
  return readJson();
}
