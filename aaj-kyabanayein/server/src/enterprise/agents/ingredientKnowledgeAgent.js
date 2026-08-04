/**
 * 2. Ingredient Knowledge Agent — normalize names, allergens, substitutes.
 */
import { BaseAgent } from "./baseAgent.js";
import { enrichIngredients, lookupIngredient } from "../ingredients/ingredientDatabase.js";

export class IngredientKnowledgeAgent extends BaseAgent {
  constructor() {
    super("ingredient_knowledge");
  }

  async execute(context) {
    const ingredients = context.ingredients || context.brief?.facts?.typicalIngredients?.map((name) => ({ name })) || [];
    const enriched = enrichIngredients(ingredients);

    const normalized = enriched.filter((i) => i.normalized).length;
    const ratio = ingredients.length > 0 ? normalized / ingredients.length : 0;
    const allAllergens = [...new Set(enriched.flatMap((i) => i.allergens || []))];

    return {
      success: enriched.length >= 2,
      confidence: ratio,
      data: {
        ingredients: enriched,
        allergens: allAllergens,
        normalizedCount: normalized,
        totalCount: enriched.length,
      },
      issues: ratio < 0.3 ? ["Low ingredient database match — consider expanding master DB"] : [],
    };
  }
}

export { lookupIngredient };
