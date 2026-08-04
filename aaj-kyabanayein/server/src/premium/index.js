export { INGREDIENT_NUTRITION, parseQuantityToGrams, lookupIngredientNutrition, computeVerifiedNutrition } from "./ingredientNutrition.js";
export { resolveDishIngredients, toRecipeIngredientRows, TEMPLATES } from "./dishIngredientBank.js";
export { generatePremiumHero, isPremiumHero, HERO_VERSION } from "./heroImageGenerator.js";
export { findRealFoodPhoto, fetchAndNormalizePhoto } from "./realPhotoFetcher.js";
export { buildPremiumRecipe, scorePremiumRecipe, MIN_SCORE } from "./premiumRecipeBuilder.js";
export { runPremiumUpgrade, getPremiumStatus, countPremiumHeroes } from "./upgradePipeline.js";
