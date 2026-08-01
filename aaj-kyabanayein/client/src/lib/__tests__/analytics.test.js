import { describe, expect, it } from "vitest";
import { getFunnelStats, track } from "../analytics";

describe("analytics", () => {
  it("tracks events locally", () => {
    track("search", { q: "biryani" });
    track("recipe_open", { id: "poha" });
    const stats = getFunnelStats();
    expect(stats.search).toBe(1);
    expect(stats.recipeOpen).toBe(1);
  });
});
