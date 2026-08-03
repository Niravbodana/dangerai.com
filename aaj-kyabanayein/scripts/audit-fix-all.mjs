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

run("npm run fix-ingredients", "1/5 Re-sanitize & save all recipe ingredients");
run("node scripts/cache-premium-thumbs.mjs", "2/5 Cache premium MealDB photos locally");
run("npm run sync-images -- --force-bad", "3/5 Refetch bad/missing photos");
run("npm run guardian", "4/5 Quality guardian (auto-fix remaining issues)");
run("npm run audit-recipes", "5/5 Final ingredient/step audit");

console.log("\n✅ audit-fix-all complete. Run: npm run audit-images to verify photos.\n");
