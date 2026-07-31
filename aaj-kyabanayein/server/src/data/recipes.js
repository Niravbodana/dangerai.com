import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MORE_RECIPES } from "./moreRecipes.js";
import { BASE_RECIPES } from "./baseRecipes.js";
import { getRecipeImage, DEFAULT_FOOD_IMAGE } from "./recipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "generated");

function loadGeneratedRecipes() {
  const recipes = [];
  if (!fs.existsSync(GENERATED_DIR)) return recipes;

  const files = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    try {
      const batch = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), "utf-8"));
      recipes.push(...batch);
    } catch (e) {
      console.warn(`Skip ${file}:`, e.message);
    }
  }
  return recipes;
}

function enrichRecipe(recipe) {
  const category =
    recipe.category ||
    (recipe.diet?.includes("non-veg")
      ? `nonveg-${recipe.mealType}`
      : recipe.tags?.includes("healthy")
        ? "healthy"
        : `veg-${recipe.mealType}`);

  return {
    ...recipe,
    category,
    image: getRecipeImage(recipe) || recipe.image || DEFAULT_FOOD_IMAGE,
    pantryKeys: recipe.pantryKeys || recipe.ingredients?.map((i) => i.name.toLowerCase()) || [],
    healthScore: recipe.healthScore ?? 5,
    cuisine: recipe.cuisine || "indian",
  };
}

const merged = new Map();
console.time("recipes-load");
for (const r of [...BASE_RECIPES, ...MORE_RECIPES, ...loadGeneratedRecipes()]) {
  const enriched = enrichRecipe(r);
  if (!merged.has(enriched.id)) merged.set(enriched.id, enriched);
}

export const RECIPES = Array.from(merged.values());
console.timeEnd("recipes-load");
console.log(`Loaded ${RECIPES.length.toLocaleString()} recipes`);

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
    name: "100% Free",
    nameHi: "पूरी तरह मुफ्त",
    price: 0,
    period: "forever",
    popular: true,
    features: [
      "5.7 Lakh+ recipes",
      "Ratings & Favorites",
      "Step-by-step cooking",
      "Pantry suggestions",
      "Weekly healthy plan",
      "Hindi / English",
    ],
  },
];

export function getCategoryCounts() {
  const counts = {};
  for (const cat of RECIPE_CATEGORIES) counts[cat.id] = 0;
  const cuisineCounts = {};
  for (const c of CUISINES) if (c.id !== "all") cuisineCounts[c.id] = 0;

  for (const r of RECIPES) {
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
