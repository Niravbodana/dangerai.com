/**
 * Tests — bulk library builder for 10k scale
 */
import { describe, it, expect, beforeAll } from "vitest";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import { generateUniqueDishLibrary, getLibraryStats } from "../phase3/expandedDishLibrary.js";
import { seedIngredientDatabase } from "../enterprise/ingredients/ingredientDatabase.js";

beforeAll(() => {
  ensureIntelligenceDb();
  seedIngredientDatabase();
});

describe("expanded dish library", () => {
  it("generates 10000+ unique dishes", () => {
    const dishes = generateUniqueDishLibrary(10000);
    expect(dishes.length).toBeGreaterThanOrEqual(10000);
    const ids = new Set(dishes.map((d) => d.id));
    expect(ids.size).toBe(dishes.length);
  });

  it("covers major cuisines", () => {
    const stats = getLibraryStats(5000);
    expect(stats.byCuisine.gujarati).toBeGreaterThan(50);
    expect(stats.byCuisine.punjabi).toBeGreaterThan(50);
    expect(stats.byCuisine["north-indian"]).toBeGreaterThan(100);
  });

  it("has no empty names", () => {
    const dishes = generateUniqueDishLibrary(100);
    expect(dishes.every((d) => d.name && d.cuisine && d.id)).toBe(true);
  });
});
