#!/usr/bin/env node
/**
 * Post–10k recipe pipeline — run AFTER `npm run library:build -- --target 10000`
 *
 * Steps:
 *   1. Premium upgrade (90+ scores, real heroes, verified nutrition)
 *   2. Catalog repair (diet tags, duplicate hide, image URLs)
 *   3. Smoke test (API + recipe cards)
 *
 * Usage:
 *   npm run post10k                          # full pipeline (upgrade all below 90)
 *   npm run post10k -- --limit 100           # upgrade first 100 only
 *   npm run post10k -- --skip-upgrade          # repair + smoke only
 *   npm run post10k -- --upgrade-only          # premium upgrade only
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = path.join(root, "server");

function run(label, cmd, args) {
  console.log(`\n=== ${label} ===\n`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: false });
  if (r.status !== 0) {
    console.error(`\n[post10k] Failed: ${label}`);
    process.exit(r.status || 1);
  }
}

const argv = process.argv.slice(2);
const skipUpgrade = argv.includes("--skip-upgrade");
const upgradeOnly = argv.includes("--upgrade-only");
const limitIdx = argv.indexOf("--limit");
const limit = limitIdx >= 0 && argv[limitIdx + 1] ? argv[limitIdx + 1] : null;
const concurrencyIdx = argv.indexOf("--concurrency");
const concurrency = concurrencyIdx >= 0 && argv[concurrencyIdx + 1] ? argv[concurrencyIdx + 1] : "6";

// Bootstrap DB + show status
const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { getBulkLibraryStatus } = await import(path.join(serverRoot, "src/phase3/index.js"));
const { getPremiumStatus } = await import(path.join(serverRoot, "src/premium/upgradePipeline.js"));

ensureDatabase();
initRecipeCatalog(true);

const bulk = getBulkLibraryStatus();
const premium = getPremiumStatus();

console.log("Post-10k pipeline starting…");
console.log(JSON.stringify({ liveCatalog: bulk.liveCatalog, target: bulk.target, premium90Plus: premium.quality90Plus }, null, 2));

if (!skipUpgrade) {
  const upgradeArgs = ["run", "premium:upgrade", "--", "--only-below", "90", "--concurrency", concurrency];
  if (limit) upgradeArgs.push("--limit", limit);
  run("Premium upgrade (90+ scores + heroes)", "npm", upgradeArgs);
  run("Premium status", "npm", ["run", "premium:status"]);

  if (!argv.includes("--skip-real-photos")) {
    run("Real HD photos (replace studio art)", "npm", [
      "run", "photos:real-only", "--", "--concurrency", concurrency,
    ]);
  }
}

if (!upgradeOnly) {
  run("Catalog repair", "node", ["-e", `
    import { repairCatalogOnBoot } from './server/src/services/catalogRepair.js';
    const r = repairCatalogOnBoot();
    console.log(JSON.stringify(r, null, 2));
  `]);

  if (!argv.includes("--skip-smoke")) {
    console.log(`\n=== Smoke test (recipes API) ===\n`);
    const smoke = spawnSync("npm", ["run", "smoke:recipes"], { cwd: root, stdio: "inherit", shell: false });
    if (smoke.status !== 0) {
      console.warn("\n[post10k] Smoke test skipped — start API with: npm run dev");
    }
  }
}

console.log("\n✓ Post-10k pipeline complete.");
console.log("Next: npm run dev  →  open http://localhost:3000/recipes");
