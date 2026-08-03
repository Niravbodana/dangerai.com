/**
 * 3. Nutrition Agent — verified databases only, never invent values.
 */
import { BaseAgent } from "./baseAgent.js";
import { calculateStrictNutrition } from "../../research/strictNutrition.js";

export class NutritionAgent extends BaseAgent {
  constructor() {
    super("nutrition");
  }

  async execute(context) {
    const ingredients = context.ingredients || [];
    const servings = context.servings || 4;
    const nutrition = await calculateStrictNutrition(ingredients, servings);

    const confidence = nutrition.verified ? nutrition.coverage / 100 : nutrition.coverage / 200;

    return {
      success: nutrition.verified,
      confidence,
      data: { nutrition },
      issues: nutrition.verified ? [] : [nutrition.rejectionReason || "Nutrition not verified"],
    };
  }
}
