/**
 * Server-side tests — Phase 3 Curated Recipe Library
 */
import { describe, it, expect, beforeAll } from "vitest";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import { POPULAR_RECIPES, getPhase1Recipes, getPopularRecipeCount } from "../phase3/popularRecipes.js";
import { PHASE3_TARGETS, TOTAL_PHASE3_TARGET, IMPORT_PHASES } from "../phase3/importTargets.js";
import { buildImportQueue, buildImportPlan, toImportSeed } from "../phase3/importPlanner.js";
import { getPhase3Status } from "../phase3/phase3Runner.js";

beforeAll(() => {
  ensureIntelligenceDb();
});

describe("phase3 targets", () => {
  it("defines cuisine count targets", () => {
    expect(PHASE3_TARGETS.gujarati).toBe(800);
    expect(PHASE3_TARGETS.chicken).toBe(1500);
    expect(TOTAL_PHASE3_TARGET).toBeGreaterThan(10000);
  });

  it("has 3 import phases", () => {
    expect(IMPORT_PHASES[1].minPopularityScore).toBeGreaterThan(IMPORT_PHASES[2].minPopularityScore);
  });
});

describe("popular recipes manifest", () => {
  it("has curated recipes not random", () => {
    expect(getPopularRecipeCount()).toBeGreaterThan(100);
    expect(POPULAR_RECIPES.every((r) => r.name && r.cuisine && r.popularityScore)).toBe(true);
  });

  it("covers all major cuisines", () => {
    const cuisines = new Set(POPULAR_RECIPES.map((r) => r.cuisine));
    expect(cuisines.has("gujarati")).toBe(true);
    expect(cuisines.has("punjabi")).toBe(true);
    expect(cuisines.has("south-indian")).toBe(true);
    expect(cuisines.has("kashmiri")).toBe(true);
  });

  it("phase 1 has high popularity dishes", () => {
    const phase1 = getPhase1Recipes();
    expect(phase1.length).toBeGreaterThan(50);
    expect(phase1[0].popularityScore).toBeGreaterThanOrEqual(85);
    const names = phase1.map((r) => r.name);
    expect(names).toContain("Butter Chicken");
    expect(names).toContain("Hyderabadi Biryani");
    expect(names).toContain("Pani Puri");
  });
});

describe("import planner", () => {
  it("builds priority queue phase 1 first", () => {
    const queue = buildImportQueue({ phase: 1, limit: 10 });
    expect(queue.length).toBe(10);
    expect(queue[0].curated).toBe(true);
    expect(queue[0].phase3).toBe(true);
    expect(queue.every((s) => s.priority === 1)).toBe(true);
  });

  it("sorts by popularity within phase", () => {
    const queue = buildImportQueue({ phase: 1, limit: 5 });
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i - 1].popularityScore).toBeGreaterThanOrEqual(queue[i].popularityScore);
    }
  });

  it("generates import plan with targets", () => {
    const plan = buildImportPlan();
    expect(plan.version).toBe("3.0");
    expect(plan.policy.noRandomRecipes).toBe(true);
    expect(plan.targets.length).toBeGreaterThan(15);
    expect(plan.phase1Top20.length).toBe(20);
  });

  it("converts to import seed", () => {
    const seed = toImportSeed(POPULAR_RECIPES[0]);
    expect(seed.id).toMatch(/^phase3-/);
    expect(seed.dataSource).toBe("rasoira-phase3");
  });
});

describe("phase3 status", () => {
  it("returns status with plan and progress", () => {
    const status = getPhase3Status();
    expect(status.version).toBe("3.0");
    expect(status.plan.totalTarget).toBe(TOTAL_PHASE3_TARGET);
    expect(status.progress.total).toBe(getPopularRecipeCount());
  });
});
