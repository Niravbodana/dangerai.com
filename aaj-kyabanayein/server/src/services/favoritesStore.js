import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAV_FILE = path.join(__dirname, "../data/favorites.json");

function ensure() {
  const dir = path.dirname(FAV_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FAV_FILE)) fs.writeFileSync(FAV_FILE, JSON.stringify({}));
}

function read() {
  ensure();
  return JSON.parse(fs.readFileSync(FAV_FILE, "utf-8"));
}

function write(data) {
  ensure();
  fs.writeFileSync(FAV_FILE, JSON.stringify(data, null, 2));
}

export function getFavorites(userId) {
  const data = read();
  return data[userId] || [];
}

export function addFavorite(userId, recipeId) {
  const data = read();
  if (!data[userId]) data[userId] = [];
  if (!data[userId].includes(recipeId)) data[userId].push(recipeId);
  write(data);
  return data[userId];
}

export function removeFavorite(userId, recipeId) {
  const data = read();
  if (!data[userId]) return [];
  data[userId] = data[userId].filter((id) => id !== recipeId);
  write(data);
  return data[userId];
}

export function isFavorite(userId, recipeId) {
  return getFavorites(userId).includes(recipeId);
}
