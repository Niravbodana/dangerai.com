/**
 * Server-side tests — Enterprise AI Research System v2.0
 */
import { describe, it, expect, beforeAll } from "vitest";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import { seedIngredientDatabase, lookupIngredient, searchIngredients, getIngredientStats } from "../enterprise/ingredients/ingredientDatabase.js";
import { calculateQualityScore } from "../enterprise/qualityScore.js";
import { AGENT_NAMES, AGENT_PIPELINE } from "../enterprise/agents/index.js";
import { runAgentPipeline } from "../enterprise/agentOrchestrator.js";
import { generateResearchSeeds } from "../research/recipeCatalog.js";

beforeAll(() => {
  ensureIntelligenceDb();
  seedIngredientDatabase();
});

describe("enterprise agents", () => {
  it("defines 10 specialized agents", () => {
    expect(AGENT_PIPELINE.length).toBe(10);
    expect(AGENT_NAMES).toContain("recipe_research");
    expect(AGENT_NAMES).toContain("duplicate_detection");
  });
});

describe("ingredient database", () => {
  it("seeds master ingredients", () => {
    const stats = getIngredientStats();
    expect(stats.total).toBeGreaterThanOrEqual(25);
  });

  it("looks up ingredients by name", () => {
    const rice = lookupIngredient("basmati rice");
    expect(rice).toBeTruthy();
    expect(rice.englishName).toMatch(/Rice/i);
    expect(rice.hindiName).toBeTruthy();
  });

  it("searches ingredients", () => {
    const { items, total } = searchIngredients({ q: "dal", limit: 5 });
    expect(total).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("quality score", () => {
  it("calculates composite score 0-100", () => {
    const result = calculateQualityScore({
      ingredient_knowledge: { data: { normalizedCount: 4, totalCount: 5 } },
      nutrition: { data: { nutrition: { verified: true, coverage: 80 } } },
      recipe_qa: { data: { checks: { cookingTime: true, logicalSteps: true, servingSize: true, nutritionComplete: true } } },
      seo: { confidence: 0.9 },
      license_compliance: { success: true },
      image_verification: { success: true },
      duplicate_detection: { data: { duplicateScore: 0.1 } },
    });
    expect(result.score).toBeGreaterThan(60);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toMatch(/[A-F]/);
    expect(result.breakdown).toHaveProperty("nutritionConfidence");
  });
});

describe("agent orchestrator", () => {
  it("runs agent pipeline on a seed", async () => {
    const seed = generateResearchSeeds({ cuisines: ["gujarati"], limit: 1 })[0];
    const result = await runAgentPipeline(seed, { runId: "test-run" });
    expect(result.agentRuns.length).toBeGreaterThan(0);
    expect(result.recipe).toBeTruthy();
    expect(result.recipe.title).toBeTruthy();
    expect(result.quality.score).toBeGreaterThanOrEqual(0);
    expect(result.agentResults.recipe_research).toBeTruthy();
    expect(result.agentResults.license_compliance).toBeTruthy();
  }, 15000);
});
