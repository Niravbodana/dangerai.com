import { describe, expect, it } from "vitest";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "../recentSearches";

describe("recentSearches", () => {
  it("starts empty", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("adds and dedupes searches case-insensitively", () => {
    addRecentSearch("Biryani");
    addRecentSearch("dosa");
    addRecentSearch("biryani");
    expect(getRecentSearches()).toEqual(["biryani", "dosa"]);
  });

  it("clears all searches", () => {
    addRecentSearch("paneer");
    expect(clearRecentSearches()).toEqual([]);
    expect(getRecentSearches()).toEqual([]);
  });
});
