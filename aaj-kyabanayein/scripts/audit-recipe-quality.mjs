#!/usr/bin/env node
/**
 * Full recipe quality audit — run after enrichRecipe changes.
 * Usage: node scripts/audit-recipe-quality.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "server");

const { enrichRecipe, initRecipeCatalog, RECIPE_INDEX, getRecipeById } = await import(
  path.join(serverRoot, "src/data/recipes.js")
);
const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { isGenericSteps, hasDevanagari, isQualityRecipe } = await import(
  path.join(serverRoot, "src/lib/recipeQuality.js")
);
const { ingredientCoverage } = await import(path.join(serverRoot, "src/lib/recipeStepBuilder.js"));

ensureDatabase();
initRecipeCatalog(true);

const report = {
  total: RECIPE_INDEX.length,
  thinIngredients: 0,
  genericSteps: 0,
  shortSteps: 0,
  missingHindi: 0,
  lowIngredientCoverage: 0,
  qualityPass: 0,
  failures: [],
};

for (const meta of RECIPE_INDEX) {
  const raw = getRecipeById(meta.id);
  const r = raw || enrichRecipe(meta);
  const issues = [];

  if ((r.ingredients?.length || 0) < 6) {
    report.thinIngredients++;
    issues.push("thin-ingredients");
  }
  if (isGenericSteps(r.steps)) {
    report.genericSteps++;
    issues.push("generic-steps");
  }
  if ((r.steps?.length || 0) < 5) {
    report.shortSteps++;
    issues.push("short-steps");
  }
  if (!r.stepsHi?.length || !hasDevanagari(r.stepsHi.join(" "))) {
    report.missingHindi++;
    issues.push("missing-hindi");
  }
  if (ingredientCoverage(r.steps, r.ingredients) < 0.35) {
    report.lowIngredientCoverage++;
    issues.push("low-coverage");
  }
  if (isQualityRecipe(r)) report.qualityPass++;

  if (issues.length) {
    report.failures.push({ id: meta.id, name: meta.name, issues });
  }
}

console.log(JSON.stringify(report, null, 2));

if (report.failures.length > 0) {
  console.error(`\n❌ ${report.failures.length} recipes failed quality checks`);
  process.exit(1);
}

console.log(`\n✅ All ${report.total} recipes pass quality audit`);
process.exit(0);
