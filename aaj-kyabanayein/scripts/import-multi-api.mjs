#!/usr/bin/env node
/**
 * Multi-API recipe import — TheMealDB (free) + Spoonacular (optional key).
 *
 * Usage:
 *   npm run import:apis              # import all available APIs
 *   npm run import:apis -- status    # show configured APIs + catalog counts
 *   npm run import:apis -- mealdb    # TheMealDB only
 *   npm run import:apis -- dry-run   # count only, no writes
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const cmd = process.argv[2] || "all";

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { ensureIntelligenceDb, seedSourceRegistry } = await import(
  path.join(serverRoot, "src/intelligence/index.js")
);
const { getImportApiStatus, runMultiApiImport } = await import(
  path.join(serverRoot, "src/import/multiApiImportRunner.js")
);

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();

if (cmd === "status") {
  console.log(JSON.stringify(getImportApiStatus(), null, 2));
  process.exit(0);
}

const dryRun = process.argv.includes("--dry-run");
const mealdbLimitIdx = process.argv.indexOf("--limit");
const mealdbLimit = mealdbLimitIdx >= 0 ? parseInt(process.argv[mealdbLimitIdx + 1], 10) : 0;

console.log("Multi-API import starting…");
console.log("Configured APIs:", JSON.stringify(getImportApiStatus().imageApis));

const report = await runMultiApiImport({
  mealdb: cmd === "all" || cmd === "mealdb",
  spoonacular: cmd === "all" || cmd === "spoonacular",
  mealdbLimit,
  dryRun,
});

console.log("\n--- Import Report ---");
console.log(JSON.stringify(report, null, 2));
console.log("\nNext steps:");
console.log("  npm run photos:real-only -- --concurrency 10   # replace studio art with HD photos");
console.log("  npm run premium:upgrade -- --only-below 90     # quality upgrade remaining");
console.log("  npm run dev                                     # test on phone");
