import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/connection.js";
import { isDatabaseReady } from "../db/migrate.js";

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

function useDb() {
  return isDatabaseReady();
}

// --- Saved meals (add to planner) ---
export function getSavedMeals(userId) {
  if (useDb()) {
    return getDb()
      .prepare(
        `SELECT id, recipe_id as recipeId, recipe_name as recipeName,
                meal_date as date, meal_type as mealType, added_at as addedAt
         FROM saved_meals WHERE user_id = ? ORDER BY added_at DESC`
      )
      .all(userId);
  }
  const data = read(MEALS_FILE);
  return data[userId] || [];
}

export function addSavedMeal(userId, entry) {
  const meal = {
    id: `sm-${Date.now()}`,
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    date: entry.date || new Date().toISOString().split("T")[0],
    mealType: entry.mealType || "lunch",
    addedAt: new Date().toISOString(),
  };

  if (useDb()) {
    getDb()
      .prepare(
        `INSERT INTO saved_meals (id, user_id, recipe_id, recipe_name, meal_date, meal_type, added_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(meal.id, userId, meal.recipeId, meal.recipeName, meal.date, meal.mealType, meal.addedAt);
    return meal;
  }

  const data = read(MEALS_FILE);
  if (!data[userId]) data[userId] = [];
  data[userId].unshift(meal);
  write(MEALS_FILE, data);
  return meal;
}

export function removeSavedMeal(userId, mealId) {
  if (useDb()) {
    getDb().prepare("DELETE FROM saved_meals WHERE id = ? AND user_id = ?").run(mealId, userId);
    return getSavedMeals(userId);
  }
  const data = read(MEALS_FILE);
  if (!data[userId]) return [];
  data[userId] = data[userId].filter((m) => m.id !== mealId);
  write(MEALS_FILE, data);
  return data[userId];
}

// --- Custom meals (user-created recipes) ---
export function getCustomMeals(userId) {
  if (useDb()) {
    return getDb()
      .prepare("SELECT recipe_json FROM custom_meals WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId)
      .map((r) => JSON.parse(r.recipe_json));
  }
  const data = read(CUSTOM_FILE);
  return data[userId] || [];
}

export function addCustomMeal(userId, recipe) {
  const meal = {
    ...recipe,
    id: recipe.id || `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  if (useDb()) {
    getDb()
      .prepare(
        `INSERT INTO custom_meals (id, user_id, recipe_json, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET recipe_json = excluded.recipe_json`
      )
      .run(meal.id, userId, JSON.stringify(meal), meal.createdAt);
    return meal;
  }

  const data = read(CUSTOM_FILE);
  if (!data[userId]) data[userId] = [];
  data[userId].unshift(meal);
  write(CUSTOM_FILE, data);
  return meal;
}

export function deleteCustomMeal(userId, recipeId) {
  if (useDb()) {
    getDb().prepare("DELETE FROM custom_meals WHERE id = ? AND user_id = ?").run(recipeId, userId);
    return getCustomMeals(userId);
  }
  const data = read(CUSTOM_FILE);
  if (!data[userId]) return [];
  data[userId] = data[userId].filter((m) => m.id !== recipeId);
  write(CUSTOM_FILE, data);
  return data[userId];
}

export function loadAllCustomMeals() {
  if (useDb()) {
    return getDb()
      .prepare("SELECT recipe_json FROM custom_meals")
      .all()
      .map((r) => JSON.parse(r.recipe_json));
  }
  const data = read(CUSTOM_FILE);
  const all = [];
  for (const meals of Object.values(data)) all.push(...meals);
  return all;
}
