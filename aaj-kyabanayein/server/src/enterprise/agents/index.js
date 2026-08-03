export { BaseAgent } from "./baseAgent.js";
export { RecipeResearchAgent } from "./recipeResearchAgent.js";
export { IngredientKnowledgeAgent } from "./ingredientKnowledgeAgent.js";
export { NutritionAgent } from "./nutritionAgent.js";
export { CuisineExpertAgent } from "./cuisineExpertAgent.js";
export { ImageVerificationAgent } from "./imageVerificationAgent.js";
export { LicenseComplianceAgent } from "./licenseComplianceAgent.js";
export { OriginalWritingAgent } from "./originalWritingAgent.js";
export { RecipeQaAgent } from "./recipeQaAgent.js";
export { SeoAgent } from "./seoAgent.js";
export { DuplicateDetectionAgent } from "./duplicateDetectionAgent.js";

import { RecipeResearchAgent } from "./recipeResearchAgent.js";
import { IngredientKnowledgeAgent } from "./ingredientKnowledgeAgent.js";
import { NutritionAgent } from "./nutritionAgent.js";
import { CuisineExpertAgent } from "./cuisineExpertAgent.js";
import { ImageVerificationAgent } from "./imageVerificationAgent.js";
import { LicenseComplianceAgent } from "./licenseComplianceAgent.js";
import { OriginalWritingAgent } from "./originalWritingAgent.js";
import { RecipeQaAgent } from "./recipeQaAgent.js";
import { SeoAgent } from "./seoAgent.js";
import { DuplicateDetectionAgent } from "./duplicateDetectionAgent.js";

export const AGENT_PIPELINE = [
  RecipeResearchAgent,
  IngredientKnowledgeAgent,
  LicenseComplianceAgent,
  CuisineExpertAgent,
  OriginalWritingAgent,
  NutritionAgent,
  ImageVerificationAgent,
  RecipeQaAgent,
  SeoAgent,
  DuplicateDetectionAgent,
];

export const AGENT_NAMES = AGENT_PIPELINE.map((A) => new A().name);
