import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import { ThemeProvider } from "../../context/ThemeContext";
import BrandLogo from "../BrandLogo";

describe("BrandLogo", () => {
  it("uses the RasoiSaathi wordmark and accessible name", () => {
    const { container } = renderWithRouter(
      <ThemeProvider>
        <BrandLogo />
      </ThemeProvider>,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toMatch(/logo-wordmark/);
    expect(img.getAttribute("alt")).toBe("RasoiSaathi — Kitchen companion");
  });

  it("uses the dark wordmark on a light surface", () => {
    const { container } = renderWithRouter(
      <ThemeProvider>
        <BrandLogo light={false} />
      </ThemeProvider>,
    );
    expect(container.querySelector("img").getAttribute("src")).toBe("/logo-wordmark.svg");
  });
});
