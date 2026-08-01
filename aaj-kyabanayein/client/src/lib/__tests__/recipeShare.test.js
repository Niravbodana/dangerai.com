import { describe, expect, it } from "vitest";
import { parseYoutubeId, getRecipeVideoId } from "../recipeVideo";
import { formatIngredientsList } from "../recipeShare";

describe("recipeVideo", () => {
  it("parses youtube watch URLs", () => {
    expect(parseYoutubeId("https://www.youtube.com/watch?v=arswWCLGrj4")).toBe("arswWCLGrj4");
    expect(parseYoutubeId("https://youtube.com/shorts/iEl9hZ97bCw")).toBe("iEl9hZ97bCw");
  });

  it("reads video from recipe", () => {
    expect(getRecipeVideoId({ videoUrl: "https://youtu.be/abc12345678" })).toBe("abc12345678");
  });
});

describe("recipeShare", () => {
  it("formats ingredient list for whatsapp", () => {
    const text = formatIngredientsList({
      name: "Poha",
      ingredients: [{ name: "Poha", quantity: "2 cups" }],
    });
    expect(text).toContain("Poha");
    expect(text).toContain("2 cups");
  });
});
