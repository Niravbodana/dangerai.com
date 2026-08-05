#!/usr/bin/env node
/**
 * Premium quality upgrade — 90+ score, verified nutrition, original heroes.
 *
 * Usage:
 *   npm run premium:status
 *   npm run premium:upgrade -- --limit 50
 *   npm run premium:upgrade -- --only-below 90 --concurrency 8
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const args = process.argv.slice(2);
const command = args[0] || "status";

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { ensureIntelligenceDb, seedSourceRegistry } = await import(
  path.join(serverRoot, "src/intelligence/index.js")
);
const { seedIngredientDatabase } = await import(path.join(serverRoot, "src/enterprise/index.js"));

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();
seedIngredientDatabase();

function parseFlags(argv) {
  const flags = {
    limit: 0,
    offset: 0,
    dryRun: false,
    forceImage: true,
    minScore: 90,
    onlyBelowScore: null,
    onlyStudioArt: false,
    syncToLiveCatalog: true,
    autoApprove: true,
    concurrency: 6,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) flags.limit = parseInt(argv[++i], 10);
    if (argv[i] === "--offset" && argv[i + 1]) flags.offset = parseInt(argv[++i], 10);
    if (argv[i] === "--min-score" && argv[i + 1]) flags.minScore = parseInt(argv[++i], 10);
    if (argv[i] === "--only-below" && argv[i + 1]) flags.onlyBelowScore = parseInt(argv[++i], 10);
    if (argv[i] === "--concurrency" && argv[i + 1]) flags.concurrency = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--no-force-image") flags.forceImage = false;
    if (argv[i] === "--force-image") flags.forceImage = true;
    if (argv[i] === "--only-studio-art") flags.onlyStudioArt = true;
    if (argv[i] === "--no-sync") flags.syncToLiveCatalog = false;
    if (argv[i] === "--no-approve") flags.autoApprove = false;
  }
  return flags;
}

async function main() {
  if (command === "status") {
    const { getPremiumStatus } = await import(path.join(serverRoot, "src/premium/upgradePipeline.js"));
    console.log(JSON.stringify(getPremiumStatus(), null, 2));
    return;
  }

  if (command === "upgrade" || command === "run") {
    const { runPremiumUpgrade } = await import(path.join(serverRoot, "src/premium/upgradePipeline.js"));
    const flags = parseFlags(args.slice(1));
    console.log("Starting premium upgrade:", flags);
    const report = await runPremiumUpgrade(flags);
    console.log("\n--- Premium Upgrade Report ---");
    console.log(JSON.stringify(report, null, 2));
    if (report.failed > 0 && report.upgraded === 0) process.exitCode = 1;
    return;
  }

  console.log(`
Rasoira Premium Quality Upgrade

Commands:
  status     Show 90+ / verified / hero counts
  upgrade    Upgrade recipes to quality score 90+

Flags:
  --limit N          Process N recipes (0 = all)
  --offset N         Skip first N
  --min-score N      Minimum score (default 90)
  --only-below N     Skip recipes already at/above N
  --only-studio-art  Only re-fetch recipes that still have AI/SVG art —
                      skips ones that already have a real photo, saving
                      Google/Wikimedia quota. Use this after setting
                      GOOGLE_API_KEY + GOOGLE_CSE_ID to replace remaining
                      studio-art images with real photos.
  --concurrency N    Parallel workers (default 6)
  --dry-run          Score only, no DB/image writes
  --no-force-image   Keep existing premium heroes
  --no-sync          Don't update live catalog
  --no-approve       Queue only
`);
}

main().catch((err) => {
  console.error("Premium upgrade failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
