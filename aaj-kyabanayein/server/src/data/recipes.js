import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BASE_RECIPES } from "./baseRecipes.js";
import { MORE_RECIPES } from "./moreRecipes.js";
import { getRecipeImage, DEFAULT_FOOD_IMAGE } from "./recipeImages.js";
import { ENGLISH_STEPS, buildIngredients, buildStepsEn, buildStepsHi } from "./recipeTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "generated");
const INDEX_FILE = path.join(GENERATED_DIR, "index.json");

const shardCache = new Map();
let recipeIndex = [];
let indexById = new Map();

function expandThinIngredients(recipe) {
  const ings = recipe.ingredients || [];
  if (ings.length >= 5) return ings;
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
  const steps = recipe.steps?.length ? recipe.steps : ENGLISH_STEPS[recipe.id];
  const stepsHi = recipe.stepsHi?.length ? recipe.stepsHi : undefined;

  let finalSteps = steps;
  let finalStepsHi = stepsHi;
  if (!finalSteps?.length && ingredients[0]) {
    const isNonVeg = recipe.diet?.includes("non-veg");
    const styleMatch = (recipe.name || "").match(
      /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita)/i
    );
    const style = styleMatch ? styleMatch[1] : "Curry";
    finalSteps = buildStepsEn(ingredients[0].name, style, isNonVeg);
    finalStepsHi = buildStepsHi(ingredients[0].nameHi || ingredients[0].name, style);
  }

  return {
    ...recipe,
    category,
    ingredients,
    steps: finalSteps,
    stepsHi: finalStepsHi,
    image: getRecipeImage(recipe) || recipe.image || DEFAULT_FOOD_IMAGE,
    pantryKeys: recipe.pantryKeys || ingredients.map((i) => i.name.toLowerCase()),
    healthScore: recipe.healthScore ?? 5,
    cuisine: recipe.cuisine || "indian",
  };
}

function toIndexEntry(recipe, shard) {
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
    image: getRecipeImage(recipe),
    shard,
  };
}

function buildIndexFromShards() {
  if (!fs.existsSync(GENERATED_DIR)) return [];
  const index = [];
  const files = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".json") && f !== "index.json");
  for (const file of files) {
    try {
      const batch = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), "utf-8"));
      for (const r of batch) index.push(toIndexEntry(r, file));
    } catch (e) {
      console.warn(`Skip index ${file}:`, e.message);
    }
  }
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index));
  return index;
}

function loadShard(shard) {
  if (!shardCache.has(shard)) {
    const data = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, shard), "utf-8"));
    shardCache.set(shard, data);
  }
  return shardCache.get(shard);
}

// Hand-crafted recipes — fully loaded (fast, high quality)
const HANDCRAFTED = new Map();
console.time("recipes-load");
for (const r of [...BASE_RECIPES, ...MORE_RECIPES]) {
  HANDCRAFTED.set(r.id, enrichRecipe(r));
}

// Lightweight index for generated recipes (metadata only — instant load)
if (fs.existsSync(INDEX_FILE)) {
  recipeIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
} else if (fs.existsSync(GENERATED_DIR)) {
  console.log("Building recipe index (one-time)...");
  recipeIndex = buildIndexFromShards();
}

for (const entry of recipeIndex) indexById.set(entry.id, entry);
for (const [id, r] of HANDCRAFTED) {
  indexById.set(id, { ...toIndexEntry(r, null), _full: r });
}

console.timeEnd("recipes-load");
console.log(`Ready: ${HANDCRAFTED.size} hand-crafted + ${recipeIndex.length.toLocaleString()} indexed recipes`);

/** Lightweight list for browsing — no full recipe load */
export const RECIPE_INDEX = [...indexById.values()].map(({ _full, shard, ...meta }) => meta);

/** Backward compat — only hand-crafted + custom (not 570k) */
export const RECIPES = [...HANDCRAFTED.values()];

export function getRecipeById(id) {
  if (HANDCRAFTED.has(id)) return HANDCRAFTED.get(id);
  const meta = indexById.get(id);
  if (!meta?.shard) return meta?._full || null;
  const shard = loadShard(meta.shard);
  const raw = shard.find((r) => r.id === id);
  return raw ? enrichRecipe(raw) : null;
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
  HANDCRAFTED.set(recipe.id, enriched);
  indexById.set(recipe.id, { ...toIndexEntry(enriched, null), _full: enriched });
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
      "5.7 Lakh+ recipes",
      "Ratings & Favorites",
      "Step-by-step cooking",
      "Pantry suggestions",
      "Weekly healthy plan",
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
