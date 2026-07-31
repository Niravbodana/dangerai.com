import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MORE_RECIPES } from "./moreRecipes.js";
import { BASE_RECIPES } from "./baseRecipes.js";
import { getRecipeImage } from "./recipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedPath = path.join(__dirname, "generatedRecipes.json");

let generatedRecipes = [];
try {
  generatedRecipes = JSON.parse(fs.readFileSync(generatedPath, "utf-8"));
} catch {
  generatedRecipes = [];
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
    image: recipe.image || getRecipeImage(recipe),
    pantryKeys: recipe.pantryKeys || recipe.ingredients?.map((i) => i.name.toLowerCase()) || [],
    healthScore: recipe.healthScore ?? 5,
  };
}

const merged = new Map();
for (const r of [...BASE_RECIPES, ...MORE_RECIPES, ...generatedRecipes]) {
  const enriched = enrichRecipe(r);
  if (!merged.has(enriched.id)) merged.set(enriched.id, enriched);
}

export const RECIPES = Array.from(merged.values());

export const RECIPE_CATEGORIES = [
  { id: "veg-breakfast", label: "Veg Nashta", labelHi: "शाकाहारी नाश्ता", cuisine: "indian" },
  { id: "nonveg-breakfast", label: "Non-Veg Nashta", labelHi: "मांसाहारी नाश्ता", cuisine: "indian" },
  { id: "veg-lunch", label: "Veg Lunch", labelHi: "शाकाहारी दोपहर", cuisine: "indian" },
  { id: "nonveg-lunch", label: "Non-Veg Lunch", labelHi: "मांसाहारी दोपहर", cuisine: "indian" },
  { id: "veg-dinner", label: "Veg Dinner", labelHi: "शाकाहारी रात", cuisine: "indian" },
  { id: "nonveg-dinner", label: "Non-Veg Dinner", labelHi: "मांसाहारी रात", cuisine: "indian" },
  { id: "healthy", label: "Healthy Food", labelHi: "स्वस्थ भोजन", cuisine: "indian" },
  { id: "snack", label: "Snacks", labelHi: "नाश्ता/स्नैक", cuisine: "indian" },
];

export const FUTURE_CUISINES = [
  { id: "indian", label: "Indian", labelHi: "भारतीय", active: true },
  { id: "south-indian", label: "South Indian", labelHi: "दक्षिण भारतीय", active: true },
  { id: "italian", label: "Italian", labelHi: "इटालियन", active: false, comingSoon: true },
  { id: "korean", label: "Korean", labelHi: "कोरियन", active: false, comingSoon: true },
];

export const PLAN_LIMITS = {
  free: { weeklyPlans: 7, groceryList: true },
  pro: { weeklyPlans: 7, groceryList: true },
  family: { weeklyPlans: 7, groceryList: true },
};

export const PRICING_PLANS = [
  {
    id: "free",
    name: "100% Free",
    nameHi: "पूरी तरह मुफ्त",
    price: 0,
    period: "forever",
    popular: true,
    features: [
      "Pura hafta meal plan",
      "22,000+ recipes with photos",
      "Step-by-step cooking mode",
      "Ghar me kya pada — pantry suggest",
      "Weekly healthy plan",
      "Bazaar grocery list",
      "Veg / Non-veg filters",
    ],
  },
];

export function getCategoryCounts() {
  const counts = {};
  for (const cat of RECIPE_CATEGORIES) counts[cat.id] = 0;
  for (const r of RECIPES) {
    if (counts[r.category] !== undefined) counts[r.category]++;
    if (r.mealType === "snack") counts.snack++;
  }
  return counts;
}
