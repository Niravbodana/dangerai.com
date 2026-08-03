/**
 * Server-side tests — Recipe Intelligence System
 */
import { describe, it, expect } from "vitest";
import { verifyDatasetLicense, verifyImageLicense } from "../pipeline/license/licenseVerifier.js";
import { runQualityGate } from "../intelligence/qualityGate.js";
import { convertToMetric } from "../intelligence/unitConverter.js";
import { buildSeoBundle } from "../intelligence/seoBundle.js";
import { buildContentHash } from "../pipeline/services/duplicateDetector.js";

describe("licenseVerifier", () => {
  it("blocks themealdb without commercial license", () => {
    const result = verifyDatasetLicense({ id: "themealdb" }, { log: false });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("allows rasoira-curated-modules", () => {
    const result = verifyDatasetLicense({ id: "rasoira-curated-modules" }, { log: false });
    expect(result.allowed).toBe(true);
  });

  it("skips unknown license", () => {
    const result = verifyDatasetLicense(
      { id: "random-source", licenseExplicit: false },
      { log: false }
    );
    expect(result.allowed).toBe(false);
  });

  it("rejects image without verifiable license", () => {
    const result = verifyImageLicense({ license: "CC-BY-NC-4.0" }, { log: false });
    expect(result.allowed).toBe(false);
  });

  it("accepts CC0 image", () => {
    const result = verifyImageLicense({ license: "CC0-1.0" }, { log: false });
    expect(result.allowed).toBe(true);
  });
});

describe("qualityGate", () => {
  const baseRecipe = {
    title: "Test Paneer Curry",
    commercialUseAllowed: true,
    licenseSpdx: "RASOIRA-CURATED",
    dataSource: "rasoira-curated-modules",
    verifiedOn: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    introduction: "A delicious test recipe for quality gate validation.",
    ingredients: [
      { name: "Paneer", quantity: 200, unit: "g" },
      { name: "Tomato", quantity: 2, unit: "piece" },
    ],
    steps: ["Heat oil.", "Add paneer and cook.", "Serve hot."],
    prepTimeMin: 10,
    cookTimeMin: 20,
    totalTimeMin: 30,
    nutrition: { calories: 350 },
    duplicateScore: 0,
  };

  it("passes valid recipe", () => {
    const result = runQualityGate(baseRecipe);
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects missing license", () => {
    const result = runQualityGate({ ...baseRecipe, licenseSpdx: null, sourceLicense: null });
    expect(result.passed).toBe(false);
  });

  it("rejects too few steps", () => {
    const result = runQualityGate({ ...baseRecipe, steps: ["Only one step here."] });
    expect(result.passed).toBe(false);
  });
});

describe("unitConverter", () => {
  it("converts grams", () => {
    const r = convertToMetric({ quantity: 250, unit: "g", name: "flour" });
    expect(r.grams).toBe(250);
  });

  it("converts tablespoons", () => {
    const r = convertToMetric({ quantity: 2, unit: "tbsp", name: "oil" });
    expect(r.grams).toBe(30);
  });
});

describe("seoBundle", () => {
  it("generates structured data and OG tags", () => {
    const bundle = buildSeoBundle({
      id: "test-recipe",
      slug: "test-recipe",
      title: "Test Recipe",
      cuisine: "gujarati",
      mealType: "lunch",
      diet: ["veg"],
      steps: ["Step one", "Step two"],
      ingredients: [{ name: "Rice", quantity: "1 cup" }],
      calories: 300,
    });
    expect(bundle.seoTitle).toContain("Test Recipe");
    expect(bundle.openGraph["og:title"]).toBeTruthy();
    expect(bundle.twitterCards["twitter:card"]).toBe("summary_large_image");
    expect(bundle.breadcrumbSchema.itemListElement.length).toBeGreaterThan(2);
    expect(bundle.structuredData.length).toBeGreaterThan(0);
  });
});

describe("duplicateDetector", () => {
  it("produces stable content hash", () => {
    const recipe = {
      title: "Dal Tadka",
      cuisine: "north-indian",
      mealType: "lunch",
      ingredients: [{ name: "Dal" }, { name: "Ghee" }],
    };
    const h1 = buildContentHash(recipe);
    const h2 = buildContentHash(recipe);
    expect(h1).toBe(h2);
  });
});
