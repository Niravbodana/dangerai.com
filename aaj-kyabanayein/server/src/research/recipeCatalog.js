/**
 * Recipe catalog — research seeds (NOT copied recipes).
 * Each seed defines what to research and generate as original content.
 */
import crypto from "crypto";
import {
  CUISINES,
  MEAL_TYPES,
  DISH_PATTERNS,
  DIET_TYPES,
  FESTIVALS,
  TARGET_RECIPE_COUNT,
} from "./taxonomy.js";
import { containsMeatWord } from "../lib/dietNormalize.js";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Generate research seeds from taxonomy (expandable to 50k+).
 * @param {{ cuisines?: string[], limit?: number, offset?: number }} opts
 */
export function generateResearchSeeds(opts = {}) {
  const cuisines = opts.cuisines || Object.keys(CUISINES);
  const limit = opts.limit ?? 500;
  const offset = opts.offset ?? 0;
  const seeds = [];

  for (const cuisine of cuisines) {
    const meta = CUISINES[cuisine];
    const dishes = DISH_PATTERNS[cuisine] || [`${cuisine} Special`];

    for (const dishName of dishes) {
      for (const mealType of MEAL_TYPES) {
        for (const [dietKey, dietMeta] of Object.entries(DIET_TYPES)) {
          if (dietKey === "non-veg" && !needsNonVeg(dishName)) continue;
          if (dietKey === "jain" && isNonJain(dishName)) continue;
          if (dietKey === "vegan" && hasDairy(dishName)) continue;

          const id = `research-${slugify(`${cuisine}-${dishName}-${dietKey}-${mealType}`)}`;
          const festival = pickFestival(cuisine, dishName);

          seeds.push({
            id,
            slug: slugify(`${dishName}-${cuisine}`),
            name: `${dishName}`,
            cuisine,
            region: meta.region,
            state: meta.state,
            mealType,
            diet: dietMeta.tags,
            category: inferCategory(mealType, dietKey),
            festival,
            researchStatus: "pending",
            dataSource: "rasoira-research",
            licenseSpdx: "RASOIRA-AI",
            commercialUseAllowed: true,
          });
        }
      }
    }
  }

  return seeds.slice(offset, offset + limit);
}

export function getCatalogStats() {
  const totalPossible = Object.keys(CUISINES).reduce((sum, c) => {
    const dishes = DISH_PATTERNS[c]?.length || 1;
    return sum + dishes * MEAL_TYPES.length * Object.keys(DIET_TYPES).length;
  }, 0);

  return {
    target: TARGET_RECIPE_COUNT,
    seedsAvailable: totalPossible,
    cuisines: Object.keys(CUISINES).length,
    dishPatterns: Object.values(DISH_PATTERNS).flat().length,
  };
}

function needsNonVeg(name) {
  return containsMeatWord(name) || /\bseafood\b/i.test(name);
}

function isNonJain(name) {
  return /\b(onion|garlic)\b/i.test(name) || containsMeatWord(name);
}

function hasDairy(name) {
  return /paneer|curd|lassi|kheer|ghee|butter|cheese|milk|do i|shrikhand/i.test(name);
}

function pickFestival(cuisine, dish) {
  const d = dish.toLowerCase();
  if (/modak|ganesh/i.test(d)) return "Ganesh Chaturthi";
  if (/puran poli|holi/i.test(d)) return "Holi";
  if (/kheer|ladoo|diwali/i.test(d)) return "Diwali";
  if (/pongal/i.test(d)) return "Pongal";
  if (/onam|sadya/i.test(d)) return "Onam";
  if (/eid|haleem|biryani/i.test(d) && cuisine === "hyderabadi") return "Eid";
  return null;
}

function inferCategory(mealType, dietKey) {
  if (mealType === "snack") return "snack";
  if (dietKey === "jain") return "jain";
  if (dietKey === "vegan") return "vegan";
  if (dietKey.includes("non")) return `nonveg-${mealType === "breakfast" ? "snack" : mealType}`;
  return `veg-${mealType === "breakfast" ? "breakfast" : mealType}`;
}

export function createResearchBriefId(seedId) {
  return `brief-${crypto.createHash("md5").update(seedId).digest("hex").slice(0, 12)}`;
}
