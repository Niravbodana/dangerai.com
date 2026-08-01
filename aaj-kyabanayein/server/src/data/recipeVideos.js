/** Optional YouTube links for popular recipes (recipe id → watch URL) */
export const RECIPE_VIDEO_URLS = {
  poha: "https://www.youtube.com/watch?v=arswWCLGrj4",
  "dal-chawal": "https://www.youtube.com/watch?v=n5vzu4R-DpU",
  "paneer-butter-masala": "https://www.youtube.com/watch?v=iEl9hZ97bCw",
  "biryani-veg": "https://www.youtube.com/watch?v=HVInA84kPUY",
  "dosa-plain": "https://www.youtube.com/watch?v=ibxTIvAo7fU",
};

export function attachRecipeVideo(recipe) {
  if (!recipe) return recipe;
  const videoUrl = recipe.videoUrl || RECIPE_VIDEO_URLS[recipe.id];
  return videoUrl ? { ...recipe, videoUrl } : recipe;
}
