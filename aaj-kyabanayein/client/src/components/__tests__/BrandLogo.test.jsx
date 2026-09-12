import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import BrandLogo from "../BrandLogo";

describe("BrandLogo", () => {
  it("uses the RasoiSaathi wordmark and accessible name", () => {
    const { container } = renderWithRouter(<BrandLogo />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/logo-wordmark-light.svg");
    expect(img.getAttribute("alt")).toBe("RasoiSaathi — Kitchen companion");
  });
});
