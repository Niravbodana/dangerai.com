/**
 * Premium quality module tests — 90+ gate, verified nutrition, heroes.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { computeVerifiedNutrition } from "../premium/ingredientNutrition.js";
import { resolveDishIngredients, toRecipeIngredientRows } from "../premium/dishIngredientBank.js";
import {
  buildPremiumRecipe,
  scorePremiumRecipe,
  attachGrams,
  toEnterpriseNutrition,
  MIN_SCORE,
} from "../premium/premiumRecipeBuilder.js";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import { seedIngredientDatabase } from "../enterprise/ingredients/ingredientDatabase.js";

beforeAll(() => {
  ensureIntelligenceDb();
  seedIngredientDatabase();
});

describe("premium ingredient nutrition", () => {
  it("verifies dal ingredients with high coverage", () => {
    const { ingredients } = resolveDishIngredients({ name: "Dal Tadka", diet: ["veg"] });
    const rows = attachGrams(toRecipeIngredientRows(ingredients));
    const nut = computeVerifiedNutrition(rows, 4);
    expect(nut.verified).toBe(true);
    expect(nut.coverage).toBeGreaterThanOrEqual(0.85);
    expect(nut.energy_kcal).toBeGreaterThan(50);
    expect(nut.matched_ingredients).toBeGreaterThanOrEqual(5);
  });

  it("maps coverage to 0–100 for quality scorer", () => {
    const computed = { verified: true, coverage: 0.92, energy_kcal: 300, protein_g: 12, carbs_g: 40, fat_g: 10, fiber_g: 5, servings: 4, sources: ["USDA"] };
    const ent = toEnterpriseNutrition(computed);
    expect(ent.coverage).toBe(92);
    expect(ent.verified).toBe(true);
  });
});

describe("premium recipe builder", () => {
  it("builds a recipe with quality score >= 90", async () => {
    const { recipe, quality } = await buildPremiumRecipe(
      {
        id: "vitest-premium-dal",
        name: "Toor Dal Tadka",
        cuisine: "north-indian",
        mealType: "lunch",
        diet: ["veg"],
        category: "north-indian",
      },
      { writeImage: true, forceImage: true }
    );
    expect(quality.score).toBeGreaterThanOrEqual(MIN_SCORE);
    expect(recipe.nutrition.verified).toBe(true);
    expect(recipe.ingredients.length).toBeGreaterThanOrEqual(6);
    expect(recipe.imageSource).toBe("premium-hero");
    expect(recipe.steps.length).toBeGreaterThanOrEqual(5);
  }, 30000);

  it("scores image + verified nutrition toward 90+", () => {
    const recipe = {
      ingredients: Array.from({ length: 8 }, (_, i) => ({ name: `ing${i}`, normalized: true })),
      steps: ["a", "b", "c", "d", "e"],
      servings: 4,
      cookTimeMin: 30,
      calories: 300,
      nutrition: { verified: true, coverage: 100 },
      faq: [{}, {}, {}],
      chefNotes: "notes",
      commercialUseAllowed: true,
      licenseSpdx: "RASOIRA-AI",
      seoConfidence: 1,
      imageUrl: "/api/recipes/image/x",
      duplicateScore: 0,
    };
    const q = scorePremiumRecipe(recipe, { source: "premium-hero" });
    expect(q.score).toBeGreaterThanOrEqual(90);
  });
});
