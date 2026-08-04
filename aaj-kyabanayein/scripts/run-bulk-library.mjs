#!/usr/bin/env node
/**
 * Bulk library builder — generate + approve + sync until target (default 10,000).
 *
 * Usage:
 *   npm run library:status
 *   npm run library:build -- --target 10000
 *   npm run library:build -- --target 500 --dry-run
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const args = process.argv.slice(2);
const command = args[0] || "status";

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { ensureIntelligenceDb, seedSourceRegistry } = await import(path.join(serverRoot, "src/intelligence/index.js"));
const { seedIngredientDatabase } = await import(path.join(serverRoot, "src/enterprise/index.js"));
const {
  runBulkLibraryBuild,
  getBulkLibraryStatus,
  generateUniqueDishLibrary,
  listReviewQueue,
  bulkApprove,
} = await import(path.join(serverRoot, "src/phase3/index.js")).then(async (phase3) => {
  const intel = await import(path.join(serverRoot, "src/intelligence/index.js"));
  return { ...phase3, listReviewQueue: intel.listReviewQueue, bulkApprove: intel.bulkApprove };
}).catch(async () => {
  const phase3 = await import(path.join(serverRoot, "src/phase3/index.js"));
  const intel = await import(path.join(serverRoot, "src/intelligence/index.js"));
  return { ...phase3, listReviewQueue: intel.listReviewQueue, bulkApprove: intel.bulkApprove };
});

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();
seedIngredientDatabase();

function parseFlags(argv) {
  const flags = {
    target: 10000,
    batchSize: 200,
    dryRun: false,
    autoApprove: true,
    syncToLiveCatalog: true,
    minQualityScore: 40,
    offset: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--target" && argv[i + 1]) flags.target = parseInt(argv[++i], 10);
    if (argv[i] === "--batch" && argv[i + 1]) flags.batchSize = parseInt(argv[++i], 10);
    if (argv[i] === "--offset" && argv[i + 1]) flags.offset = parseInt(argv[++i], 10);
    if (argv[i] === "--min-score" && argv[i + 1]) flags.minQualityScore = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--no-approve") flags.autoApprove = false;
    if (argv[i] === "--no-sync") flags.syncToLiveCatalog = false;
  }
  return flags;
}

async function main() {
  if (command === "status") {
    const status = getBulkLibraryStatus();
    const lib = generateUniqueDishLibrary(status.target);
    console.log(JSON.stringify({ ...status, uniqueDishesAvailable: lib.length }, null, 2));
    return;
  }

  if (command === "approve-pending") {
    const pending = listReviewQueue({ status: "pending", limit: 5000 });
    const ids = pending.map((p) => p.recipe_id);
    const results = bulkApprove(ids, "admin-bulk-approve");
    console.log(JSON.stringify({ approved: results.length }, null, 2));
    return;
  }

  if (command === "build" || command === "run") {
    const flags = parseFlags(args.slice(1));
    console.log("Starting bulk library build:", flags);
    const report = await runBulkLibraryBuild(flags);
    console.log("\n--- Bulk Library Report ---");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`
Rasoira Bulk Library Builder

Commands:
  status            Show progress toward 10,000
  approve-pending   Approve all pending review items
  build / run       Generate + verify + sync until target

Flags:
  --target N        Stop at N approved recipes (default 10000)
  --batch N         Checkpoint every N recipes
  --offset N        Skip first N library dishes
  --min-score N     Minimum quality score (default 40)
  --dry-run         No DB writes
  --no-approve      Queue only, don't auto-approve
  --no-sync         Don't sync to live catalog
`);
}

main().catch((err) => {
  console.error("Bulk library failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
