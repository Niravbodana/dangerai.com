const API_BASE = "/api";

export async function fetchPricing() {
  const res = await fetch(`${API_BASE}/pricing`);
  if (!res.ok) throw new Error("Pricing fetch failed");
  return res.json();
}

export async function fetchMealPlan(preferences) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("Meal plan fetch failed");
  return res.json();
}

export async function fetchRecipes() {
  const res = await fetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error("Recipes fetch failed");
  return res.json();
}
