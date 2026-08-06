#!/usr/bin/env node
/**
 * Smoke test: API must return recipes for the Recipes page.
 * Usage: npm run smoke:recipes
 */
const API = process.env.API_BASE || "http://127.0.0.1:5000";

async function get(path) {
  const t0 = Date.now();
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(20000) });
  const ms = Date.now() - t0;
  const data = await res.json();
  return { ok: res.ok, status: res.status, ms, data };
}

async function main() {
  const health = await get("/api/health");
  const categories = await get("/api/recipes/categories");
  const recipes = await get("/api/recipes?page=1&limit=24");
  const veg = await get("/api/recipes?page=1&limit=6&diet=veg");

  const report = {
    healthOk: health.ok && health.data?.success,
    totalRecipes: health.data?.totalRecipes ?? categories.data?.totalRecipes ?? 0,
    categoriesOk: categories.ok && (categories.data?.totalRecipes || 0) > 0,
    recipesOk: recipes.ok && (recipes.data?.recipes || []).length > 0,
    recipesTotal: recipes.data?.total ?? 0,
    firstRecipe: recipes.data?.recipes?.[0]?.name || null,
    vegCount: veg.data?.total ?? 0,
    timingsMs: { health: health.ms, categories: categories.ms, recipes: recipes.ms },
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.healthOk || !report.categoriesOk || !report.recipesOk) {
    console.error("\nSMOKE FAILED — Recipes page will show empty.");
    console.error("Fix: npm run dev:kill && npm run dev");
    console.error("Then open http://localhost:3000/recipes (not :5000)");
    process.exit(1);
  }

  if (report.totalRecipes < 100) {
    console.error("\nSMOKE WARNING — catalog looks too small.");
    process.exit(1);
  }

  console.log("\nSMOKE OK — Recipes API is serving data.");
}

main().catch((err) => {
  console.error("SMOKE FAILED:", err.message);
  console.error("Is the API running? npm run dev");
  process.exit(1);
});
