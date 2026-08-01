import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../test/test-utils";
import LoadingSpinner from "../components/LoadingSpinner";
import { PLANS } from "../lib/subscription";

describe("smoke", () => {
  it("loads core modules", async () => {
    const App = (await import("../App.jsx")).default;
    expect(App).toBeTypeOf("function");
    expect(PLANS.free).toBeDefined();
    expect(PLANS.plus.price).toBeGreaterThan(0);
  });

  it("renders a component through test utils", () => {
    renderWithRouter(<LoadingSpinner className="h-6 w-6" />);
    expect(document.querySelector(".h-6")).toBeTruthy();
  });
});
