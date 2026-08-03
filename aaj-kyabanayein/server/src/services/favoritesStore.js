import { getDb } from "../db/connection.js";
import { isDatabaseReady } from "../db/migrate.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAV_FILE = path.join(__dirname, "../data/favorites.json");

function useDb() {
  return isDatabaseReady();
}

export function getFavorites(userId) {
  if (useDb()) {
    return getDb().prepare("SELECT recipe_id FROM favorites WHERE user_id = ?").all(userId).map((r) => r.recipe_id);
  }
  if (!fs.existsSync(FAV_FILE)) return [];
  const data = JSON.parse(fs.readFileSync(FAV_FILE, "utf-8"));
  return data[userId] || [];
}

export function addFavorite(userId, recipeId) {
  if (useDb()) {
    getDb().prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id, added_at) VALUES (?, ?, ?)")
      .run(userId, recipeId, new Date().toISOString());
    return getFavorites(userId);
  }
  const data = fs.existsSync(FAV_FILE) ? JSON.parse(fs.readFileSync(FAV_FILE, "utf-8")) : {};
  if (!data[userId]) data[userId] = [];
  if (!data[userId].includes(recipeId)) data[userId].push(recipeId);
  fs.writeFileSync(FAV_FILE, JSON.stringify(data, null, 2));
  return data[userId];
}

export function removeFavorite(userId, recipeId) {
  if (useDb()) {
    getDb().prepare("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?").run(userId, recipeId);
    return getFavorites(userId);
  }
  const data = fs.existsSync(FAV_FILE) ? JSON.parse(fs.readFileSync(FAV_FILE, "utf-8")) : {};
  data[userId] = (data[userId] || []).filter((id) => id !== recipeId);
  fs.writeFileSync(FAV_FILE, JSON.stringify(data, null, 2));
  return data[userId] || [];
}
