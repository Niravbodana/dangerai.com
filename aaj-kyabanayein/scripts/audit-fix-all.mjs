#!/usr/bin/env node
/**
 * End-to-end quality fix: ingredients + premium photos + guardian audit.
 * Usage: npm run audit-fix-all
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, label) {
  console.log(`\n━━━ ${label} ━━━\n`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

run("npm run fix-ingredients", "1/6 Re-sanitize & save all recipe ingredients");
run("node scripts/cache-premium-thumbs.mjs", "2/6 Cache premium MealDB photos locally");
run("node -e \"import('./server/src/services/recipeImageService.js').then(m=>m.syncDirectThumbOverrides().then(n=>console.log('Synced',n,'curated overrides')))\"", "3/6 Sync curated photo overrides");
run("npm run sync-images -- --force-bad", "4/6 Refetch bad/missing photos");
run("npm run guardian", "5/6 Quality guardian (auto-fix remaining issues)");
run("npm run audit-recipes", "6/6 Final ingredient/step audit");

console.log("\n✅ audit-fix-all complete. Run: npm run audit-images to verify photos.\n");
