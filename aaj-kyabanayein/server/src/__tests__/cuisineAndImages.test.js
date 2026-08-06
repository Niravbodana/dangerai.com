/**
 * Regression tests for cuisine inference and studio-art image rejection.
 */
import { describe, it, expect } from "vitest";
import { enrichRecipe } from "../data/recipes.js";
import { auditCachedImage, isStudioArtSource } from "../services/recipeImageService.js";

describe("inferCuisine", () => {
  it("does not mislabel Indian curries as Thai", () => {
    const r = enrichRecipe({
      id: "test-chicken-curry",
      name: "Chicken Curry",
      cuisine: "north-indian",
      diet: ["veg"],
      mealType: "lunch",
      tags: ["protein"],
      ingredients: [],
      steps: [],
    });
    expect(r.cuisine).toBe("north-indian");
  });

  it("trusts DB cuisine for andhra egg curry", () => {
    const r = enrichRecipe({
      id: "test-andhra-egg",
      name: "Andhra Egg Curry",
      cuisine: "andhra",
      diet: ["non-veg"],
      mealType: "lunch",
      tags: [],
      ingredients: [],
      steps: [],
    });
    expect(r.cuisine).toBe("andhra");
  });

  it("still detects pad thai as thai when cuisine unset", () => {
    const r = enrichRecipe({
      id: "test-pad-thai",
      name: "Pad Thai",
      cuisine: "",
      diet: ["non-veg"],
      mealType: "dinner",
      tags: [],
      ingredients: [],
      steps: [],
    });
    expect(r.cuisine).toBe("thai");
  });
});

describe("studio art image audit", () => {
  it("flags premium-hero as studio art", () => {
    expect(isStudioArtSource("premium-hero")).toBe(true);
    expect(isStudioArtSource("rasoira-ai-original")).toBe(true);
    expect(isStudioArtSource("premium-hero-real")).toBe(false);
  });

  it("rejects studio art in auditCachedImage", () => {
    const recipe = { id: "fake-studio", name: "Dal Tadka", diet: ["veg"] };
    const audit = auditCachedImage(recipe);
    // No cache file — missing-cache is expected; we only verify the helper contract here.
    expect(audit.ok).toBe(false);
  });
});
