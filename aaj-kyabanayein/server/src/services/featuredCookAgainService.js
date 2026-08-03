/**
 * Curated recipes for homepage "Cook again" strip — verified Indian photos only.
 */
import { getRecipeById, toListItem } from "../data/recipes.js";
import { hasCachedImage, auditCachedImage } from "./recipeImageService.js";
import { attachRating } from "./ratingsStore.js";

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
];

function hasVerifiedPhoto(recipe) {
  if (!recipe?.id) return false;
  if (recipe.id.startsWith("tmdb-")) return false;
  if (!hasCachedImage(recipe.id)) return false;
  return auditCachedImage(recipe).ok;
}

export function getFeaturedCookAgainRecipes(limit = 6) {
  const eligible = [];

  for (const id of FEATURED_COOK_AGAIN_IDS) {
    const raw = getRecipeById(id);
    if (!raw) continue;
    if (!hasVerifiedPhoto(raw)) continue;
    eligible.push(raw);
  }

  // Daily shuffle so strip feels fresh but stays high-quality
  const day = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < day.length; i++) seed += day.charCodeAt(i);

  const shuffled = [...eligible].sort((a, b) => {
    const ha = (seed + a.id.length * 7) % 100;
    const hb = (seed + b.id.length * 13) % 100;
    return ha - hb;
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
