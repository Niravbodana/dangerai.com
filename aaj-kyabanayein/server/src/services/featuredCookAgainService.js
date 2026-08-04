/**
 * Curated recipes for homepage "Cook again" strip — 90+ quality, verified HD photos.
 */
import { getRecipeById, toListItem, filterRecipeIndex } from "../data/recipes.js";
import { hasCachedImage, auditCachedImage } from "./recipeImageService.js";
import { attachRating } from "./ratingsStore.js";
import { getPopularityScore } from "./qualityCatalog.js";
import { POPULAR_RECIPES } from "../phase3/popularRecipes.js";

/** Hand-picked IDs with verified overrides or consistently good photos */
export const FEATURED_COOK_AGAIN_IDS = [
  "shahi-paneer",
  "paneer-butter-masala",
  "palak-paneer",
  "dal-tadka",
  "masala-dosa",
  "idli-sambar",
  "avial",
  "aamras-puri",
  "aloo-tikki",
  "chole-bhature",
  "samosa",
  "gajar-halwa",
  "poha",
  "hyderabadi-biryani",
  "butter-chicken",
  "dal-makhani",
  "biryani",
  "paneer-tikka",
  "rajma-chawal",
  "aloo-paratha",
];

function hasVerifiedPhoto(recipe) {
  if (!recipe?.id) return false;
  if (recipe.id.startsWith("tmdb-")) return false;
  if (!hasCachedImage(recipe.id)) return false;
  return auditCachedImage(recipe).ok;
}

function normalizeName(name = "") {
  return String(name).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findQualityRecipeByName(name) {
  const target = normalizeName(name);
  const pool = filterRecipeIndex({});
  let best = null;
  let bestScore = 0;
  for (const entry of pool) {
    const n = normalizeName(entry.name);
    if (n !== target && !n.includes(target) && !target.includes(n)) continue;
    const pop = getPopularityScore(entry);
    if (pop > bestScore) {
      best = entry;
      bestScore = pop;
    }
  }
  if (!best) return null;
  const raw = getRecipeById(best.id);
  return raw && hasVerifiedPhoto(raw) ? raw : null;
}

export function getFeaturedCookAgainRecipes(limit = 6) {
  const seen = new Set();
  const eligible = [];

  const tryAdd = (raw) => {
    if (!raw?.id || seen.has(raw.id)) return;
    if (!hasVerifiedPhoto(raw)) return;
    seen.add(raw.id);
    eligible.push(raw);
  };

  for (const id of FEATURED_COOK_AGAIN_IDS) {
    tryAdd(getRecipeById(id));
  }

  for (const entry of POPULAR_RECIPES) {
    if (entry.priority !== 1) continue;
    if (eligible.length >= limit * 3) break;
    tryAdd(findQualityRecipeByName(entry.name));
  }

  eligible.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));

  const day = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < day.length; i++) seed += day.charCodeAt(i);

  const shuffled = [...eligible].sort((a, b) => {
    const ha = (seed + a.id.length * 7 + getPopularityScore(a)) % 100;
    const hb = (seed + b.id.length * 13 + getPopularityScore(b)) % 100;
    return hb - ha;
  });

  return shuffled.slice(0, limit).map((r, i) => ({
    ...attachRating(toListItem(r)),
    featuredRank: i + 1,
  }));
}

/** Pre-warm verified photos for homepage strip */
export function warmFeaturedCookAgainImages() {
  import("./recipeImageService.js").then(({ syncDirectThumbOverrides }) => {
    syncDirectThumbOverrides().catch(() => {});
  });
}
