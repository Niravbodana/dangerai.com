/** Recipe image CDN URL helpers */

const CDN_BASE = (process.env.IMAGE_CDN_BASE || "").replace(/\/$/, "");

const BAD_THUMB_PATTERNS = [
  /dummyjson\.com/i,
  /placeholder/i,
  /via\.placeholder/i,
  /lorempixel/i,
  /picsum\.photos/i,
];

/** MealDB / Wikimedia / curated overrides — not placeholder CDN junk */
export function isPremiumThumbUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (BAD_THUMB_PATTERNS.some((re) => re.test(url))) return false;
  return true;
}

export function getImageCdnBase() {
  return CDN_BASE;
}

export function cdnImageUrl(recipeId) {
  if (!CDN_BASE || !recipeId) return null;
  return `${CDN_BASE}/${recipeId}.jpg`;
}

export function resolveRecipeImageUrl(recipe) {
  if (!recipe?.id) return null;
  const cdn = cdnImageUrl(recipe.id);
  if (cdn) return cdn;
  if (isPremiumThumbUrl(recipe.thumbUrl)) return recipe.thumbUrl;
  return `/api/recipes/image/${recipe.id}`;
}

export function pickDisplayImageUrl(recipe) {
  if (!recipe) return null;
  if (isPremiumThumbUrl(recipe.thumbUrl)) return recipe.thumbUrl;
  const cdn = cdnImageUrl(recipe.id);
  if (cdn) return cdn;
  return recipe.imageUrl || `/api/recipes/image/${recipe.id}`;
}
