#!/usr/bin/env node
/**
 * Audit recipe photo matching. Flags raw ingredients, generic titles, veg/non-veg mismatches.
 * Usage: npm run audit-images [-- --fix]
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "server");

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog, RECIPE_INDEX, getRecipeById } = await import(
  path.join(serverRoot, "src/data/recipes.js")
);
const { auditCachedImage, hasCachedImage } = await import(
  path.join(serverRoot, "src/services/recipeImageService.js")
);

const fix = process.argv.includes("--fix");

ensureDatabase();
initRecipeCatalog(true);

const report = {
  total: RECIPE_INDEX.length,
  cached: 0,
  missing: 0,
  ok: 0,
  bad: [],
};

for (const meta of RECIPE_INDEX) {
  const recipe = getRecipeById(meta.id) || meta;
  if (!hasCachedImage(recipe.id)) {
    report.missing++;
    report.bad.push({ id: recipe.id, name: recipe.name, issue: "missing-cache" });
    continue;
  }
  report.cached++;
  const result = auditCachedImage(recipe);
  if (result.ok) {
    report.ok++;
  } else {
    report.bad.push({
      id: recipe.id,
      name: recipe.name,
      issue: result.issue,
      title: result.meta?.title,
      score: result.titleScore,
    });
  }
}

report.badCount = report.bad.length;
report.matchRate = `${Math.round((report.ok / report.total) * 100)}%`;

console.log(JSON.stringify(report, null, 2));

if (fix && report.bad.length) {
  const { invalidateCachedImage, ensureRecipeImage } = await import(
    path.join(serverRoot, "src/services/recipeImageService.js")
  );
  const { setLocalImage } = await import(path.join(serverRoot, "src/db/recipeRepository.js"));
  let fixed = 0;
  let failed = 0;
  for (const bad of report.bad) {
    try {
      const recipe = getRecipeById(bad.id);
      if (!recipe) continue;
      invalidateCachedImage(bad.id);
      const file = await ensureRecipeImage(recipe, { force: true });
      setLocalImage(bad.id, file, { source: "refetched", fetchedAt: new Date().toISOString() });
      fixed++;
      console.log(`✓ refetched ${bad.name}`);
    } catch (err) {
      failed++;
      console.warn(`✗ ${bad.id}: ${err.message}`);
    }
  }
  console.log(`\nRefetch done: ${fixed} fixed, ${failed} failed`);
}

if (report.badCount > 0 && !fix) {
  console.error(`\n⚠ ${report.badCount} images need attention. Run: npm run audit-images -- --fix`);
  process.exit(1);
}

console.log(`\n✅ Image audit: ${report.ok}/${report.total} matching (${report.matchRate})`);
process.exit(report.badCount > 0 && fix ? 0 : report.badCount > 0 ? 1 : 0);
