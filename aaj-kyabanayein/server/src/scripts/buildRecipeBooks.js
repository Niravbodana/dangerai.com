/**
 * Build curated recipe books — real names + ingredients only, no photos.
 * Fetches from TheMealDB API + merges hand-crafted Indian recipes.
 * Run: npm run build-recipe-books
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BASE_RECIPES } from "../data/baseRecipes.js";
import { MORE_RECIPES } from "../data/moreRecipes.js";
import { INDIAN_BOOK_RECIPES } from "../data/recipeBookIndian.js";
import { MORE_INDIAN_RECIPES } from "../data/recipeBookMoreIndian.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../data/curated");
const RECIPES_FILE = path.join(OUT_DIR, "recipes.json");
const INDEX_FILE = path.join(OUT_DIR, "index.json");

const THEMEALDB = "https://www.themealdb.com/api/json/v1/1";
const USER_AGENT = "RasoiraRecipeBooks/1.0";

const AREA_TO_CUISINE = {
  Indian: "indian",
  Chinese: "chinese",
  Italian: "italian",
  Japanese: "japanese",
  Thai: "thai",
  Mexican: "mexican",
  French: "continental",
  British: "continental",
  American: "continental",
  Spanish: "continental",
  Greek: "continental",
  Turkish: "continental",
  Vietnamese: "thai",
  Malaysian: "thai",
  Moroccan: "continental",
  Egyptian: "continental",
  Jamaican: "continental",
  Kenyan: "continental",
  Polish: "continental",
  Portuguese: "continental",
  Russian: "continental",
  Tunisian: "continental",
  Uruguayan: "continental",
  Croatian: "continental",
};

const NONVEG_KEYWORDS = /\b(chicken|beef|pork|lamb|mutton|fish|prawn|shrimp|crab|duck|bacon|sausage|ham|turkey|salmon|tuna|anchovy|meat|liver|kidney|oxtail|venison|goat)\b/i;

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand|lite|authentic|street|festive|comfort)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilar(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 4 && nb.length > 4 && (na.includes(nb) || nb.includes(na))) return true;
  const wa = new Set(na.split(" "));
  const wb = new Set(nb.split(" "));
  const overlap = [...wa].filter((w) => wb.has(w) && w.length > 2).length;
  const minLen = Math.min(wa.size, wb.size);
  return minLen > 0 && overlap / minLen >= 0.8;
}

function guessMealType(name, category) {
  const n = name.toLowerCase();
  if (category === "Dessert" || /cake|cookie|pie|pudding|ice cream|sweet|kheer|jalebi|halwa|ladoo/i.test(n)) return "snack";
  if (/breakfast|pancake|waffle|toast|oat|cereal|poha|upma|idli|dosa|paratha|thepla|chilla/i.test(n)) return "breakfast";
  if (/snack|samosa|pakora|chaat|chips|dip|bruschetta|spring roll|nacho/i.test(n)) return "snack";
  if (/soup|salad|smoothie|juice|lassi/i.test(n)) return "snack";
  if (/dinner|curry|roast|steak|biryani|pasta|pizza/i.test(n)) return "dinner";
  return "lunch";
}

function guessDiet(ingredients, name) {
  const text = `${name} ${ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
  if (NONVEG_KEYWORDS.test(text)) return ["non-veg"];
  return ["veg"];
}

function mealToIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const qty = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, nameHi: name, quantity: qty || "as needed" });
  }
  return ingredients;
}

function mealToSteps(meal) {
  return (meal.strInstructions || "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^\d+[\).\s]+/, "").trim())
    .filter((s) => s.length > 10);
}

function inferCategory(recipe) {
  if (recipe.tags?.includes("healthy") || recipe.cuisine === "healthy") return "healthy";
  const isVeg = recipe.diet?.includes("veg") && !recipe.diet?.includes("non-veg");
  const mt = recipe.mealType || "lunch";
  if (mt === "snack") return "snack";
  return `${isVeg ? "veg" : "nonveg"}-${mt}`;
}

function finalizeRecipe(raw) {
  const ingredients = raw.ingredients?.filter((i) => i.name?.trim()) || [];
  if (ingredients.length < 2) return null;

  const diet = raw.diet || guessDiet(ingredients, raw.name);
  const mealType = raw.mealType || guessMealType(raw.name);
  const cuisine = raw.cuisine || "continental";

  const recipe = {
    id: raw.id || slug(raw.name),
    name: raw.name.trim(),
    nameHi: raw.nameHi || raw.name,
    mealType,
    diet,
    cuisine,
    category: raw.category || inferCategory({ ...raw, diet, mealType, cuisine }),
    budget: raw.budget || "medium",
    cookTime: raw.cookTime || 30,
    calories: raw.calories || 300,
    spice: raw.spice || "medium",
    ingredients,
    steps: raw.steps?.length ? raw.steps : undefined,
    stepsHi: raw.stepsHi?.length ? raw.stepsHi : undefined,
    tags: raw.tags || [],
    healthScore: raw.healthScore ?? (cuisine === "healthy" || raw.tags?.includes("healthy") ? 8 : 5),
    pantryKeys: ingredients.map((i) => i.name.toLowerCase()),
    source: raw.source || "curated",
  };

  if (!recipe.steps?.length) {
    recipe.steps = [`Prepare all ingredients for ${recipe.name}.`, `Cook following traditional method until done.`, `Season to taste and serve hot.`];
    recipe.stepsHi = recipe.steps;
  }

  return recipe;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return res.json();
}

async function fetchTheMealDbRecipes() {
  const meals = new Map();

  // Fetch all Indian-area recipes first (priority)
  const indianData = await fetchJson(`${THEMEALDB}/filter.php?a=Indian`);
  for (const meal of indianData?.meals || []) {
    if (meal?.idMeal) meals.set(meal.idMeal, meal);
  }
  await new Promise((r) => setTimeout(r, 120));

  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const letter of letters) {
    const data = await fetchJson(`${THEMEALDB}/search.php?f=${letter}`);
    for (const meal of data?.meals || []) {
      if (!meal?.strMeal || meals.has(meal.idMeal)) continue;
      meals.set(meal.idMeal, meal);
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  // Fetch full details for filter results (only id + name from filter)
  const list = [];
  for (const meal of meals.values()) {
    let full = meal;
    if (!meal.strInstructions) {
      const detail = await fetchJson(`${THEMEALDB}/lookup.php?i=${meal.idMeal}`);
      full = detail?.meals?.[0] || meal;
      await new Promise((r) => setTimeout(r, 80));
    }
    const ingredients = mealToIngredients(full);
    if (ingredients.length < 3) continue;

    const steps = mealToSteps(full);
    const cuisine = AREA_TO_CUISINE[full.strArea] || "continental";
    const diet = guessDiet(ingredients, full.strMeal);

    list.push(finalizeRecipe({
      id: `tmdb-${full.idMeal}`,
      name: full.strMeal,
      nameHi: full.strMeal,
      mealType: guessMealType(full.strMeal, full.strCategory),
      diet,
      cuisine,
      category: full.strCategory === "Dessert" ? "snack" : undefined,
      ingredients,
      steps: steps.length ? steps : undefined,
      stepsHi: steps.length ? steps : undefined,
      tags: [full.strCategory, full.strArea].filter(Boolean).map((t) => t.toLowerCase()),
      source: "themealdb",
    }));
  }
  return list.filter(Boolean);
}

function deduplicateRecipes(recipes) {
  const result = [];
  const seenNames = [];

  for (const recipe of recipes) {
    const finalized = finalizeRecipe(recipe);
    if (!finalized) continue;

    const dup = seenNames.some((n) => isSimilar(n, finalized.name));
    if (dup) continue;

    const idDup = result.some((r) => r.id === finalized.id);
    if (idDup) finalized.id = `${finalized.id}-${result.length}`;

    seenNames.push(finalized.name);
    result.push(finalized);
  }
  return result;
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
  };
}

async function main() {
  console.log("Building curated recipe books...");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const handCrafted = [...BASE_RECIPES, ...MORE_RECIPES, ...INDIAN_BOOK_RECIPES, ...MORE_INDIAN_RECIPES];
  console.log(`Hand-crafted: ${handCrafted.length}`);

  let external = [];
  try {
    console.log("Fetching TheMealDB (real recipes)...");
    external = await fetchTheMealDbRecipes();
    console.log(`TheMealDB: ${external.length} recipes`);
  } catch (e) {
    console.warn("TheMealDB fetch failed, using hand-crafted only:", e.message);
  }

  const merged = deduplicateRecipes([...handCrafted, ...external]);
  const index = merged.map(toIndexEntry);

  fs.writeFileSync(RECIPES_FILE, JSON.stringify(merged));
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index));

  console.log(`Done: ${merged.length} unique real recipes`);
  console.log(`  Index: ${INDEX_FILE}`);
  console.log(`  Full:  ${RECIPES_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
