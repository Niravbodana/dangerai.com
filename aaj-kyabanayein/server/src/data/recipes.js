import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recipeMatchesSearch, scoreRecipeSearch } from "../lib/searchUtils.js";
import { ENGLISH_STEPS, HINDI_STEPS } from "./recipeTemplates.js";
import { logger } from "../lib/logger.js";
import { hasDevanagari, isGenericSteps } from "../lib/recipeQuality.js";
import { buildIngredientAwareSteps, expandIngredients } from "../lib/recipeStepBuilder.js";
import { getImageCacheVersion, recipeImageUrl } from "../services/recipeImageService.js";
import { isDatabaseReady } from "../db/migrate.js";
import * as recipeRepo from "../db/recipeRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED_DIR = path.join(__dirname, "curated");
const RECIPES_FILE = path.join(CURATED_DIR, "recipes.json");
const INDEX_FILE = path.join(CURATED_DIR, "index.json");

let recipeIndex = [];
let recipeById = new Map();
const customRecipes = new Map();
const enrichedCache = new Map();

export function invalidateRecipeCache(id) {
  if (id) enrichedCache.delete(id);
  else enrichedCache.clear();
}

export function refreshRecipeInCache(id) {
  invalidateRecipeCache(id);
  return getRecipeById(id);
}

function inferCuisine(recipe) {
  const name = (recipe.name || "").toLowerCase();
  const tags = (recipe.tags || []).map((t) => t.toLowerCase());
  const tagStr = tags.join(" ");

  if (tags.includes("south-indian") || /dosa|idli|sambar|rasam|uttapam|pongal|vada|appam|puttu/i.test(name)) {
    return "south-indian";
  }
  if (tags.includes("punjabi") || tags.includes("north-indian") || /paratha|rajma|chole|bhature|makhani|tandoori|butter chicken/i.test(name)) {
    return "north-indian";
  }
  if (tags.includes("gujarati") || /dhokla|thepla|khandvi|fafda/i.test(name)) {
    return "indian";
  }
  if (tags.includes("maharashtrian") || /vada pav|pav bhaji|misal|puran/i.test(name)) {
    return "indian";
  }
  if (tags.includes("bengali") || /fish curry|rosogolla|mishti/i.test(name)) {
    return "indian";
  }
  if (/poha|upma|khichdi|dal|paneer|biryani|roti|sabzi|kheer|samosa|lassi|aloo|gobi|masala/i.test(name)) {
    return "indian";
  }
  if (tagStr.includes("chinese") || /noodle|manchurian|fried rice|dim sum|wonton/i.test(name)) {
    return "chinese";
  }
  if (tagStr.includes("italian") || /pasta|pizza|risotto|lasagna|carbonara/i.test(name)) {
    return "italian";
  }
  if (tagStr.includes("thai") || /pad thai|curry|tom yum/i.test(name)) {
    return "thai";
  }
  if (tagStr.includes("mexican") || /taco|burrito|quesadilla|nacho/i.test(name)) {
    return "mexican";
  }
  if (recipe.cuisine === "continental" && recipe.source === "curated") return "indian";
  return recipe.cuisine || "indian";
}

function inferHealthy(recipe) {
  if (recipe.tags?.includes("healthy")) return true;
  if (recipe.category === "healthy") return true;
  if ((recipe.calories || 999) <= 280) return true;
  if (/salad|sprout|steamed|soup|oats|fruit|smoothie|khichdi|rasam|idli/i.test(recipe.name || "")) return true;
  return false;
}

export function enrichRecipe(recipe) {
  const cuisine = inferCuisine(recipe);
  const isHealthy = inferHealthy(recipe);
  const category =
    recipe.category && recipe.category !== "healthy" && !isHealthy
      ? recipe.category
      : isHealthy
        ? "healthy"
        : recipe.diet?.includes("non-veg")
          ? `nonveg-${recipe.mealType}`
          : `veg-${recipe.mealType}`;

  const ingredients = expandIngredients(recipe, recipe.ingredients || []);

  let baseSteps = !isGenericSteps(recipe.steps) ? recipe.steps : ENGLISH_STEPS[recipe.id];
  let baseStepsHi =
    recipe.stepsHi?.length && hasDevanagari(recipe.stepsHi.join(" "))
      ? recipe.stepsHi
      : HINDI_STEPS[recipe.id];

  if (isGenericSteps(baseSteps)) baseSteps = ENGLISH_STEPS[recipe.id] || [];
  if (!baseStepsHi?.length || !hasDevanagari(baseStepsHi.join(" "))) {
    baseStepsHi = HINDI_STEPS[recipe.id] || [];
  }

  const { steps, stepsHi } = buildIngredientAwareSteps(recipe, ingredients, baseSteps, baseStepsHi);

  return {
    ...recipe,
    category,
    cuisine,
    ingredients,
    steps,
    stepsHi,
    pantryKeys: recipe.pantryKeys || ingredients.map((i) => i.name.toLowerCase()),
    healthScore: isHealthy ? 8 : (recipe.healthScore ?? 5),
    tags: isHealthy && !recipe.tags?.includes("healthy") ? [...(recipe.tags || []), "healthy"] : (recipe.tags || []),
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
    thumbUrl: recipe.thumbUrl || undefined,
  };
}

function mergeThumbUrlsFromIndex(entries) {
  if (!fs.existsSync(INDEX_FILE)) return entries;
  try {
    const fileIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
    const thumbById = new Map(
      fileIndex.filter((e) => e.thumbUrl).map((e) => [e.id, e.thumbUrl])
    );
    return entries.map((entry) => {
      if (entry.thumbUrl) return entry;
      const thumb = thumbById.get(entry.id);
      return thumb ? { ...entry, thumbUrl: thumb } : entry;
    });
  } catch {
    return entries;
  }
}

function loadCuratedData() {
  enrichedCache.clear();
  if (isDatabaseReady()) {
    try {
      recipeIndex = mergeThumbUrlsFromIndex(recipeRepo.getRecipeIndex());
      getRecipeByIdImpl = (id) => {
        if (customRecipes.has(id)) return customRecipes.get(id);
        const raw = recipeRepo.getRecipeById(id);
        if (!raw) return null;
        const indexThumb = recipeIndex.find((r) => r.id === id)?.thumbUrl;
        const merged = indexThumb && !raw.thumbUrl ? { ...raw, thumbUrl: indexThumb } : raw;
        if (!enrichedCache.has(id)) enrichedCache.set(id, enrichRecipe(merged));
        return enrichedCache.get(id);
      };
      logger.info(`SQLite: ${recipeIndex.length} recipes loaded`);
      return;
    } catch (err) {
      logger.warn(`SQLite load failed, falling back to JSON: ${err.message}`);
    }
  }

  if (!fs.existsSync(INDEX_FILE) || !fs.existsSync(RECIPES_FILE)) {
    logger.warn("Curated recipes not found — run: npm run build-recipe-books");
    return;
  }

  // Fast path: lightweight index for lists/search (includes thumbUrl)
  recipeIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));

  // Full recipes loaded without per-recipe enrichment at startup
  const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf-8"));
  recipeById = new Map(recipes.map((r) => [r.id, r]));

  recipeIndex = recipeIndex.map((entry) => {
    const full = recipeById.get(entry.id);
    const pantryKeys = full?.pantryKeys
      || full?.ingredients?.map((i) => (i.name || "").toLowerCase()).filter(Boolean)
      || [];
    return pantryKeys.length ? { ...entry, pantryKeys } : entry;
  });

  // Patch getRecipeById to enrich lazily on first access
  getRecipeByIdImpl = (id) => {
    if (customRecipes.has(id)) return customRecipes.get(id);
    const raw = recipeById.get(id);
    if (!raw) return null;
    if (!enrichedCache.has(id)) {
      enrichedCache.set(id, enrichRecipe(raw));
    }
    return enrichedCache.get(id);
  };
}

let getRecipeByIdImpl = (id) => {
  if (customRecipes.has(id)) return customRecipes.get(id);
  return recipeById.get(id) || null;
};

let catalogLoaded = false;

export function initRecipeCatalog(force = false) {
  if (catalogLoaded && !force) return;
  loadCuratedData();
  catalogLoaded = true;
}

if (process.env.NODE_ENV !== "production") {
  console.time("recipes-load");
  initRecipeCatalog();
  console.timeEnd("recipes-load");
} else {
  initRecipeCatalog();
}

export const RECIPE_COUNT = recipeIndex.length;
logger.info(`Ready: ${RECIPE_COUNT} curated real recipes`);

export const RECIPE_INDEX = recipeIndex;
export const RECIPES = [...recipeById.values(), ...customRecipes.values()];

export function getRecipeById(id) {
  return getRecipeByIdImpl(id);
}

export function filterRecipeIndex(filters = {}) {
  let list = RECIPE_INDEX;
  const { cuisine, category, mealType, diet, search, maxCookTime } = filters;

  if (cuisine && cuisine !== "all") list = list.filter((r) => r.cuisine === cuisine);
  if (category && category !== "all") {
    list = category === "snack" ? list.filter((r) => r.mealType === "snack") : list.filter((r) => r.category === category);
  }
  if (mealType) list = list.filter((r) => r.mealType === mealType);
  if (diet === "veg") list = list.filter((r) => r.diet?.includes("veg") && !r.diet?.includes("non-veg"));
  if (diet === "non-veg") list = list.filter((r) => r.diet?.includes("non-veg"));
  if (maxCookTime) {
    const max = parseInt(maxCookTime, 10);
    if (!Number.isNaN(max)) list = list.filter((r) => (r.cookTime || 99) <= max);
  }
  if (search) {
    list = list.filter((r) => recipeMatchesSearch(r, search));
    list = [...list].sort((a, b) => scoreRecipeSearch(b, search) - scoreRecipeSearch(a, search));
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

function buildCuisinesList() {
  const counts = {};
  for (const r of RECIPE_INDEX) {
    counts[r.cuisine] = (counts[r.cuisine] || 0) + 1;
  }

  const labels = {
    indian: { en: "Indian", hi: "भारतीय" },
    "north-indian": { en: "North Indian", hi: "उत्तर भारतीय" },
    "south-indian": { en: "South Indian", hi: "दक्षिण भारतीय" },
    gujarati: { en: "Gujarati", hi: "गुजराती" },
    maharashtrian: { en: "Maharashtrian", hi: "महाराष्ट्रियन" },
    punjabi: { en: "Punjabi", hi: "पंजाबी" },
    bengali: { en: "Bengali", hi: "बंगाली" },
    kerala: { en: "Kerala", hi: "केरल" },
    hyderabadi: { en: "Hyderabadi", hi: "हैदराबादी" },
    mughlai: { en: "Mughlai", hi: "मुग़लई" },
    chinese: { en: "Chinese", hi: "चाइनीज़" },
    italian: { en: "Italian", hi: "इटालियन" },
    thai: { en: "Thai", hi: "थाई" },
    mexican: { en: "Mexican", hi: "मेक्सिकन" },
    afghani: { en: "Afghani", hi: "अफ़गानी" },
    indonesian: { en: "Indonesian", hi: "इंडोनेशियाई" },
    turkish: { en: "Turkish", hi: "तुर्की" },
    continental: { en: "Continental", hi: "कॉन्टिनेंटल" },
    healthy: { en: "Healthy", hi: "स्वस्थ" },
    japanese: { en: "Japanese", hi: "जापानी" },
  };

  const list = [{ id: "all", label: "All", labelHi: "सभी" }];
  for (const [id, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    if (count > 0 && labels[id]) {
      list.push({ id, label: labels[id].en, labelHi: labels[id].hi, count });
    }
  }
  return list;
}

export const CUISINES = buildCuisinesList();
export const FUTURE_CUISINES = CUISINES;

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    nameHi: "मुफ़्त",
    price: 0,
    period: "forever core",
    popular: false,
    features: [
      `${RECIPE_COUNT}+ real recipes`,
      "Cooking mode + voice",
      "Basic pantry & meal plan",
      "1× Aaj Kya Banaye / day",
      "Ratings & favorites",
    ],
  },
  {
    id: "plus",
    name: "Rasoira Plus",
    nameHi: "रसोइरा प्लस",
    price: 99,
    period: "month",
    popular: true,
    features: [
      "Unlimited daily meal briefs",
      "Offline cook packs",
      "Hands-free voice chef",
      "Grocery WhatsApp + Instamart links",
      "Taste profile + priority photos",
      "No ads",
    ],
  },
  {
    id: "family",
    name: "Family",
    nameHi: "फ़ैमिली",
    price: 199,
    period: "month",
    popular: false,
    features: [
      "Everything in Plus",
      "Up to 5 family profiles",
      "Shared pantry & plans",
      "Kids / Jain / diabetic filters",
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

export function toListItem(meta) {
  const full = typeof meta.ingredients !== "undefined" ? meta : null;
  const thumb = meta.thumbUrl || full?.thumbUrl;
  const imageVersion = getImageCacheVersion(meta.id);
  const apiImageUrl = recipeImageUrl(meta.id, imageVersion);
  const displayUrl = thumb && /^https?:\/\//i.test(thumb) ? thumb : apiImageUrl;
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
    thumbUrl: thumb || null,
    imageUrl: apiImageUrl,
    imageVersion,
    cdnImageUrl: displayUrl,
  };
}
