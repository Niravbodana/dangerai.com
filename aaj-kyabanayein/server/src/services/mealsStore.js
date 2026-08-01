import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEALS_FILE = path.join(__dirname, "../data/saved-meals.json");
const CUSTOM_FILE = path.join(__dirname, "../data/custom-meals.json");

function ensure(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));
}

function read(file) {
  ensure(file);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function write(file, data) {
  ensure(file);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Saved meals (add to planner) ---
export function getSavedMeals(userId) {
  const data = read(MEALS_FILE);
  return data[userId] || [];
}

export function addSavedMeal(userId, entry) {
  const data = read(MEALS_FILE);
  if (!data[userId]) data[userId] = [];
  const meal = {
    id: `sm-${Date.now()}`,
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    date: entry.date || new Date().toISOString().split("T")[0],
    mealType: entry.mealType || "lunch",
    addedAt: new Date().toISOString(),
  };
  data[userId].unshift(meal);
  write(MEALS_FILE, data);
  return meal;
}

export function removeSavedMeal(userId, mealId) {
  const data = read(MEALS_FILE);
  if (!data[userId]) return [];
  data[userId] = data[userId].filter((m) => m.id !== mealId);
  write(MEALS_FILE, data);
  return data[userId];
}

// --- Custom meals (user-created recipes) ---
export function getCustomMeals(userId) {
  const data = read(CUSTOM_FILE);
  return data[userId] || [];
}

export function addCustomMeal(userId, recipe) {
  const data = read(CUSTOM_FILE);
  if (!data[userId]) data[userId] = [];
  const meal = {
    ...recipe,
    id: recipe.id || `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  data[userId].unshift(meal);
  write(CUSTOM_FILE, data);
  return meal;
}

export function deleteCustomMeal(userId, recipeId) {
  const data = read(CUSTOM_FILE);
  if (!data[userId]) return [];
  data[userId] = data[userId].filter((m) => m.id !== recipeId);
  write(CUSTOM_FILE, data);
  return data[userId];
}

export function loadAllCustomMeals() {
  const data = read(CUSTOM_FILE);
  const all = [];
  for (const meals of Object.values(data)) all.push(...meals);
  return all;
}
