/** Recipe image CDN URL helpers */

const CDN_BASE = (process.env.IMAGE_CDN_BASE || "").replace(/\/$/, "");

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
  if (recipe.thumbUrl) return recipe.thumbUrl;
  return `/api/recipes/image/${recipe.id}`;
}
