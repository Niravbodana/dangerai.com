/**
 * Server-side tests — Master Recipe Research System
 */
import { describe, it, expect } from "vitest";
import { buildResearchBrief, validateBriefSources } from "../research/factualKnowledge.js";
import { generateResearchSeeds, getCatalogStats } from "../research/recipeCatalog.js";
import { generateOriginalRecipeFromResearch } from "../research/originalContentGenerator.js";
import { runResearchQualityGate } from "../research/researchQualityGate.js";
import { ALLOWED_RESEARCH_SOURCES, isUrlForbidden } from "../research/researchSources.js";
import { TARGET_RECIPE_COUNT } from "../research/taxonomy.js";

describe("researchSources", () => {
  it("allows USDA and internal KB", () => {
    expect(ALLOWED_RESEARCH_SOURCES["usda-fdc"]).toBeTruthy();
    expect(ALLOWED_RESEARCH_SOURCES["rasoira-culinary-kb"]).toBeTruthy();
  });

  it("blocks forbidden recipe blog URLs", () => {
    expect(isUrlForbidden("https://www.allrecipes.com/recipe/123")).toBe(true);
    expect(isUrlForbidden("https://fdc.nal.usda.gov/")).toBe(false);
  });
});

describe("recipeCatalog", () => {
  it("targets 50k+ recipes", () => {
    expect(TARGET_RECIPE_COUNT).toBeGreaterThanOrEqual(50000);
  });

  it("generates research seeds with required fields", () => {
    const seeds = generateResearchSeeds({ cuisines: ["gujarati"], limit: 3 });
    expect(seeds.length).toBe(3);
    expect(seeds[0]).toMatchObject({
      cuisine: "gujarati",
      dataSource: "rasoira-research",
      licenseSpdx: "RASOIRA-AI",
    });
  });

  it("reports catalog stats", () => {
    const stats = getCatalogStats();
    expect(stats.target).toBeGreaterThanOrEqual(50000);
    expect(stats.seedsAvailable).toBeGreaterThan(100);
    expect(stats.cuisines).toBeGreaterThan(20);
  });
});

describe("factualKnowledge", () => {
  const seed = {
    id: "research-test-dhokla",
    name: "Dhokla",
    cuisine: "gujarati",
    region: "Gujarat",
    state: "Gujarat",
    mealType: "breakfast",
    diet: ["veg"],
    festival: "Navratri",
  };

  it("builds research brief with allowed sources only", () => {
    const brief = buildResearchBrief(seed);
    expect(brief.briefId).toBe("brief-research-test-dhokla");
    expect(brief.facts.cookingMethod).toBeTruthy();
    expect(brief.facts.temperature).toMatch(/°C/);
    expect(validateBriefSources(brief).valid).toBe(true);
  });

  it("rejects brief with forbidden source", () => {
    const brief = buildResearchBrief(seed);
    brief.sources.push({ id: "random-blog", fields: ["instructions"] });
    const check = validateBriefSources(brief);
    expect(check.valid).toBe(false);
    expect(check.issues.length).toBeGreaterThan(0);
  });
});

describe("originalContentGenerator", () => {
  it("generates original content from brief", async () => {
    const seed = generateResearchSeeds({ cuisines: ["punjabi"], limit: 1 })[0];
    const brief = buildResearchBrief(seed);
    const content = await generateOriginalRecipeFromResearch(brief, seed);

    expect(content.originalityVerified).toBe(true);
    expect(content.introduction.length).toBeGreaterThan(50);
    expect(content.steps.length).toBeGreaterThanOrEqual(3);
    expect(content.ingredients.length).toBeGreaterThan(0);
    expect(content.faq.length).toBeGreaterThanOrEqual(2);
    expect(content.licenseSpdx).toBe("RASOIRA-AI");
  });
});

describe("researchQualityGate", () => {
  const baseRecipe = {
    title: "Test Research Recipe",
    commercialUseAllowed: true,
    licenseSpdx: "RASOIRA-AI",
    dataSource: "rasoira-research",
    verifiedOn: new Date().toISOString(),
    introduction: "Original introduction for research recipe testing purposes.",
    ingredients: [
      { name: "Rice", quantity: 1, unit: "cup" },
      { name: "Onion", quantity: 1, unit: "piece" },
    ],
    steps: ["Prep ingredients.", "Cook gently.", "Serve warm."],
    prepTimeMin: 10,
    cookTimeMin: 25,
    totalTimeMin: 35,
    calories: 320,
    nutrition: { verified: true, status: "verified", calories: 320 },
    nutritionStatus: "verified",
    cookingMethod: "simmering",
    temperature: "90°C",
    recipeHistory: "A researched history of this dish written originally for Rasoira testing.",
    originalityVerified: true,
    duplicateScore: 0,
  };

  it("passes verified research recipe", () => {
    const result = runResearchQualityGate(baseRecipe);
    expect(result.passed).toBe(true);
    expect(result.requiresReview).toBe(true);
    expect(result.autoApprove).toBe(false);
  });

  it("rejects unverified nutrition", () => {
    const result = runResearchQualityGate({
      ...baseRecipe,
      calories: null,
      nutrition: { verified: false, status: "insufficient_data" },
      nutritionStatus: "insufficient_data",
    });
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.includes("Nutrition"))).toBe(true);
  });

  it("rejects impossible cooking steps", () => {
    const result = runResearchQualityGate({
      ...baseRecipe,
      steps: ["Cook for 999 minutes on high heat."],
    });
    expect(result.passed).toBe(false);
  });
});
