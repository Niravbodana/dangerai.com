import { describe, expect, it } from "vitest";
import { getSubscription, isPlusOrAbove, setSubscriptionPlan } from "../subscription";

describe("subscription", () => {
  it("defaults to free plan", () => {
    expect(getSubscription().plan).toBe("free");
    expect(isPlusOrAbove()).toBe(false);
  });

  it("activates plus trial", () => {
    setSubscriptionPlan("plus");
    expect(getSubscription().plan).toBe("plus");
    expect(isPlusOrAbove()).toBe(true);
    expect(getSubscription().trialEnds).toBeTruthy();
  });
});
