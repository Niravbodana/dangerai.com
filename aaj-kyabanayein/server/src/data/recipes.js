import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ENGLISH_STEPS, buildIngredients, buildStepsEn, buildStepsHi } from "./recipeTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED_DIR = path.join(__dirname, "curated");
const RECIPES_FILE = path.join(CURATED_DIR, "recipes.json");
const INDEX_FILE = path.join(CURATED_DIR, "index.json");

let recipeIndex = [];
let recipeById = new Map();
const customRecipes = new Map();

function expandThinIngredients(recipe) {
  const ings = recipe.ingredients || [];
  if (ings.length >= 3) return ings;
  const isNonVeg = recipe.diet?.includes("non-veg");
  const main = ings[0] || { name: "Vegetable", nameHi: "सब्जी", quantity: "2 cups" };
  const styleMatch = (recipe.name || "").match(
    /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita)/i
  );
  const style = styleMatch ? styleMatch[1].charAt(0).toUpperCase() + styleMatch[1].slice(1).toLowerCase() : "Curry";
  return buildIngredients(main, style, isNonVeg);
}

export function enrichRecipe(recipe) {
  const category =
    recipe.category ||
    (recipe.diet?.includes("non-veg")
      ? `nonveg-${recipe.mealType}`
      : recipe.tags?.includes("healthy")
        ? "healthy"
        : `veg-${recipe.mealType}`);

  const ingredients = expandThinIngredients(recipe);
  let steps = recipe.steps?.length ? recipe.steps : ENGLISH_STEPS[recipe.id];
  let stepsHi = recipe.stepsHi?.length ? recipe.stepsHi : undefined;

  if (!steps?.length && ingredients[0]) {
    const isNonVeg = recipe.diet?.includes("non-veg");
    const styleMatch = (recipe.name || "").match(
      /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita)/i
    );
    const style = styleMatch ? styleMatch[1] : "Curry";
    steps = buildStepsEn(ingredients[0].name, style, isNonVeg);
    stepsHi = buildStepsHi(ingredients[0].nameHi || ingredients[0].name, style);
  }

  return {
    ...recipe,
    category,
    ingredients,
    steps,
    stepsHi,
    pantryKeys: recipe.pantryKeys || ingredients.map((i) => i.name.toLowerCase()),
    healthScore: recipe.healthScore ?? 5,
    cuisine: recipe.cuisine || "indian",
  };
}

function toIndexEntry(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    nameHi: recipe.nameHi,
    mealType: recipe.mealType,
    diet: recipe.diet,
    cuisine: recipe.cuisine || "indian",
    category: recipe.category,
    budget: recipe.budget,
    cookTime: recipe.cookTime,
    calories: recipe.calories,
    spice: recipe.spice,
    tags: recipe.tags,
  };
}

function loadCuratedData() {
  if (!fs.existsSync(INDEX_FILE) || !fs.existsSync(RECIPES_FILE)) {
    console.warn("Curated recipes not found — run: npm run build-recipe-books");
    return;
  }

  recipeIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
  const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf-8"));
  recipeById = new Map(recipes.map((r) => [r.id, enrichRecipe(r)]));
}

console.time("recipes-load");
loadCuratedData();
console.timeEnd("recipes-load");
console.log(`Ready: ${recipeIndex.length} curated real recipes`);

/** Lightweight list for browsing — names & meta only, no images or ingredients */
export const RECIPE_INDEX = recipeIndex;

/** Backward compat — full recipe objects */
export const RECIPES = [...recipeById.values(), ...customRecipes.values()];

export function getRecipeById(id) {
  if (customRecipes.has(id)) return customRecipes.get(id);
  return recipeById.get(id) || null;
}

export function filterRecipeIndex(filters = {}) {
  let list = RECIPE_INDEX;
  const { cuisine, category, mealType, diet, search } = filters;

  if (cuisine && cuisine !== "all") list = list.filter((r) => r.cuisine === cuisine);
  if (category && category !== "all") {
    list = category === "snack" ? list.filter((r) => r.mealType === "snack") : list.filter((r) => r.category === category);
  }
  if (mealType) list = list.filter((r) => r.mealType === mealType);
  if (diet === "veg") list = list.filter((r) => r.diet?.includes("veg") && !r.diet?.includes("non-veg"));
  if (diet === "non-veg") list = list.filter((r) => r.diet?.includes("non-veg"));
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.nameHi?.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  return list;
}

export function registerCustomRecipe(recipe) {
  const enriched = enrichRecipe(recipe);
  customRecipes.set(recipe.id, enriched);
  const entry = toIndexEntry(enriched);
  recipeIndex.push(entry);
  return enriched;
}

export const RECIPE_CATEGORIES = [
  { id: "veg-breakfast", label: "Veg Breakfast", labelHi: "शाकाहारी नाश्ता" },
  { id: "nonveg-breakfast", label: "Non-Veg Breakfast", labelHi: "मांसाहारी नाश्ता" },
  { id: "veg-lunch", label: "Veg Lunch", labelHi: "शाकाहारी दोपहर" },
  { id: "nonveg-lunch", label: "Non-Veg Lunch", labelHi: "मांसाहारी दोपहर" },
  { id: "veg-dinner", label: "Veg Dinner", labelHi: "शाकाहारी रात" },
  { id: "nonveg-dinner", label: "Non-Veg Dinner", labelHi: "मांसाहारी रात" },
  { id: "healthy", label: "Healthy", labelHi: "स्वस्थ भोजन" },
  { id: "snack", label: "Snacks", labelHi: "स्नैक" },
];

export const CUISINES = [
  { id: "all", label: "All", labelHi: "सभी" },
  { id: "indian", label: "Indian", labelHi: "भारतीय" },
  { id: "north-indian", label: "North Indian", labelHi: "उत्तर भारतीय" },
  { id: "south-indian", label: "South Indian", labelHi: "दक्षिण भारतीय" },
  { id: "chinese", label: "Chinese", labelHi: "चाइनीज़" },
  { id: "italian", label: "Italian", labelHi: "इटालियन" },
  { id: "korean", label: "Korean", labelHi: "कोरियन" },
  { id: "thai", label: "Thai", labelHi: "थाई" },
  { id: "mexican", label: "Mexican", labelHi: "मेक्सिकन" },
  { id: "continental", label: "Continental", labelHi: "कॉन्टिनेंटल" },
  { id: "healthy", label: "Healthy", labelHi: "स्वस्थ" },
];

export const FUTURE_CUISINES = CUISINES;

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free for Now",
    nameHi: "अभी के लिए मुफ्त",
    price: 0,
    period: "for now",
    popular: true,
    features: [
      "770+ real recipes",
      "Ratings & Favorites",
      "Step-by-step cooking",
      "Pantry suggestions",
      "Daily healthy meal plan",
      "Hindi / English",
      "Add your own meals",
    ],
  },
];

export function getCategoryCounts() {
  const counts = {};
  for (const cat of RECIPE_CATEGORIES) counts[cat.id] = 0;
  const cuisineCounts = {};
  for (const c of CUISINES) if (c.id !== "all") cuisineCounts[c.id] = 0;

  for (const r of RECIPE_INDEX) {
    if (counts[r.category] !== undefined) counts[r.category]++;
    if (r.mealType === "snack") counts.snack++;
    if (cuisineCounts[r.cuisine] !== undefined) cuisineCounts[r.cuisine]++;
  }
  return { categories: counts, cuisines: cuisineCounts };
}

export function isVegRecipe(r) {
  return r.diet?.includes("veg") && !r.diet?.includes("non-veg");
}

export function isNonVegRecipe(r) {
  return r.diet?.includes("non-veg");
}

/** Strip full recipe to list-safe metadata (no ingredients, no image) */
export function toListItem(meta) {
  return {
    id: meta.id,
    name: meta.name,
    nameHi: meta.nameHi,
    mealType: meta.mealType,
    diet: meta.diet,
    cuisine: meta.cuisine,
    cookTime: meta.cookTime,
    calories: meta.calories,
    spice: meta.spice,
    tags: meta.tags,
  };
}
