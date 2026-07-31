import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATINGS_FILE = path.join(__dirname, "../data/ratings.json");

function ensure() {
  const dir = path.dirname(RATINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(RATINGS_FILE)) fs.writeFileSync(RATINGS_FILE, JSON.stringify({}));
}

function read() {
  ensure();
  return JSON.parse(fs.readFileSync(RATINGS_FILE, "utf-8"));
}

function write(data) {
  ensure();
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(data, null, 2));
}

export function getRating(recipeId) {
  const data = read();
  const r = data[recipeId];
  if (!r) return { recipeId, average: 0, count: 0 };
  return { recipeId, average: Math.round((r.total / r.count) * 10) / 10, count: r.count };
}

export function rateRecipe(recipeId, score, userId = "guest") {
  const data = read();
  if (!data[recipeId]) data[recipeId] = { total: 0, count: 0, users: {}, reviews: [] };

  const prev = data[recipeId].users[userId];
  if (prev) {
    data[recipeId].total -= prev;
  } else {
    data[recipeId].count++;
  }

  data[recipeId].users[userId] = score;
  data[recipeId].total += score;
  write(data);
  return getRating(recipeId);
}

export function submitReview(recipeId, score, userId, comment = "") {
  const data = read();
  if (!data[recipeId]) data[recipeId] = { total: 0, count: 0, users: {}, reviews: [] };
  if (!data[recipeId].reviews) data[recipeId].reviews = [];

  const prev = data[recipeId].users[userId];
  if (prev) {
    data[recipeId].total -= prev;
  } else {
    data[recipeId].count++;
  }
  data[recipeId].users[userId] = score;
  data[recipeId].total += score;

  const review = {
    userId,
    score,
    comment: String(comment || "").trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  const idx = data[recipeId].reviews.findIndex((r) => r.userId === userId);
  if (idx >= 0) data[recipeId].reviews[idx] = review;
  else data[recipeId].reviews.push(review);

  write(data);
  return { ...getRating(recipeId), review };
}

export function getReviews(recipeId, limit = 20) {
  const data = read();
  const r = data[recipeId];
  if (!r?.reviews?.length) return [];
  return [...r.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}

export function attachRating(recipe) {
  return { ...recipe, rating: getRating(recipe.id) };
}

export function getTopRated(limit = 10) {
  const data = read();
  return Object.entries(data)
    .map(([id, r]) => ({ recipeId: id, average: r.total / r.count, count: r.count }))
    .filter((r) => r.count >= 1)
    .sort((a, b) => b.average - a.average)
    .slice(0, limit);
}

export function getAllRatings() {
  return read();
}
