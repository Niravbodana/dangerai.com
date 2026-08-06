/**
 * Merge hand-crafted recipe modules into curated JSON without network fetch.
 * Run: node src/scripts/mergeNewRecipes.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { NEW_2026_RECIPES } from "../data/recipeBookNew2026.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../data/curated");
const RECIPES_FILE = path.join(OUT_DIR, "recipes.json");
const INDEX_FILE = path.join(OUT_DIR, "index.json");

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function guessDiet(ings, name) {
  const text = `${name} ${ings.map((i) => i.name).join(" ")}`.toLowerCase();
  if (/\b(chicken|mutton|fish|prawn|egg|meat)\b/.test(text)) return ["non-veg"];
  return ["veg"];
}

function inferCategory({ diet, mealType, cuisine }) {
  const isNonVeg = diet?.includes("non-veg");
  if (cuisine === "healthy" || mealType === "healthy") return "healthy";
  if (mealType === "snack") return isNonVeg ? "nonveg-snack" : "veg-snack";
  return `${isNonVeg ? "nonveg" : "veg"}-${mealType || "lunch"}`;
}

function finalizeRecipe(raw) {
  const ingredients = raw.ingredients?.filter((i) => i.name?.trim()) || [];
  if (ingredients.length < 2) return null;
  const diet = raw.diet || guessDiet(ingredients, raw.name);
  const mealType = raw.mealType || "lunch";
  return {
    id: raw.id || slug(raw.name),
    name: raw.name.trim(),
    nameHi: raw.nameHi || raw.name,
    mealType,
    diet,
    cuisine: raw.cuisine || "indian",
    category: raw.category || inferCategory({ diet, mealType, cuisine: raw.cuisine }),
    budget: raw.budget || "medium",
    cookTime: raw.cookTime || 30,
    calories: raw.calories || 300,
    spice: raw.spice || "medium",
    ingredients,
    steps: raw.steps || [],
    stepsHi: raw.stepsHi || [],
    tags: raw.tags || [],
    healthScore: raw.healthScore ?? 5,
    pantryKeys: ingredients.map((i) => i.name.toLowerCase()),
    source: "curated",
  };
}

function toIndexEntry(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    nameHi: recipe.nameHi,
    mealType: recipe.mealType,
    diet: recipe.diet,
    cuisine: recipe.cuisine,
    category: recipe.category,
    budget: recipe.budget,
    cookTime: recipe.cookTime,
    calories: recipe.calories,
    spice: recipe.spice,
    tags: recipe.tags,
    thumbUrl: recipe.thumbUrl || undefined,
  };
}

const existing = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf-8"));
const byId = new Map(existing.map((r) => [r.id, r]));
let added = 0;

for (const raw of NEW_2026_RECIPES) {
  const recipe = finalizeRecipe(raw);
  if (!recipe || byId.has(recipe.id)) continue;
  byId.set(recipe.id, recipe);
  added++;
}

const merged = [...byId.values()];
const index = merged.map(toIndexEntry);
fs.writeFileSync(RECIPES_FILE, JSON.stringify(merged, null, 2));
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
console.log(`Merged ${added} new recipes. Total: ${merged.length}`);
