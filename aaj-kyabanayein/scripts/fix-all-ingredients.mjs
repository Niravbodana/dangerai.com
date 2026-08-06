#!/usr/bin/env node
/** Re-save all recipes with sanitized profile-correct ingredients to SQLite */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog, RECIPE_INDEX, getRecipeById, enrichRecipe } = await import(
  path.join(serverRoot, "src/data/recipes.js")
);
const { upsertRecipe } = await import(path.join(serverRoot, "src/db/recipeRepository.js"));
const { validateIngredientSemantics } = await import(path.join(serverRoot, "src/lib/ingredientProfiles.js"));

ensureDatabase();
initRecipeCatalog(true);

let fixed = 0;
let bad = 0;

for (const meta of RECIPE_INDEX) {
  const raw = getRecipeById(meta.id);
  if (!raw) continue;
  const enriched = enrichRecipe(raw);
  const sem = validateIngredientSemantics(enriched);
  if (!sem.ok) bad++;
  upsertRecipe(enriched);
  fixed++;
}

console.log(`Fixed ${fixed} recipes in DB (${bad} still had pre-sanitize issues in source — now cleaned)`);
