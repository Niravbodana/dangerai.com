/**
 * 8. Recipe QA Agent — verify times, temps, steps, servings, difficulty.
 */
import { BaseAgent } from "./baseAgent.js";
import { runResearchQualityGate } from "../../research/researchQualityGate.js";
import { validateIngredientQuantities, validateTimes } from "../../pipeline/services/quantityValidator.js";

export class RecipeQaAgent extends BaseAgent {
  constructor() {
    super("recipe_qa");
  }

  async execute(context) {
    const recipe = context.recipe || context;
    const gate = runResearchQualityGate(recipe);
    const qty = validateIngredientQuantities(recipe.ingredients || []);
    const times = validateTimes({
      prepTimeMin: recipe.prepTimeMin,
      cookTimeMin: recipe.cookTimeMin,
      totalTimeMin: recipe.totalTimeMin,
    });

    const issues = [...gate.issues];
    if (!qty.valid) issues.push(...qty.issues.map((i) => `Ingredient: ${i}`));
    if (!times.valid) issues.push(...times.issues);

    const checks = {
      cookingTime: times.valid,
      ingredientQuantities: qty.valid,
      cookingTemperature: Boolean(recipe.temperature),
      logicalSteps: (recipe.steps || []).length >= 3,
      servingSize: (recipe.servings || 0) > 0,
      difficulty: Boolean(recipe.difficulty),
      nutritionComplete: recipe.nutrition?.verified === true,
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const confidence = passed / Object.keys(checks).length;

    return {
      success: gate.passed && qty.valid && times.valid,
      confidence,
      data: { checks, qualityGate: gate },
      issues,
    };
  }
}
