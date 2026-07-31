import { imageUrlForRecipe } from "../services/recipeImageService.js";

export const DEFAULT_FOOD_IMAGE = "/api/recipes/image/_default";

export function getRecipeImage(recipe) {
  if (!recipe?.id) return DEFAULT_FOOD_IMAGE;
  return imageUrlForRecipe(recipe.id);
}
