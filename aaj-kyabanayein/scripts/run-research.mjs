#!/usr/bin/env node
/**
 * Rasoira Master Recipe Research System CLI
 *
 * Usage:
 *   npm run research:status
 *   npm run research:run -- --limit 5 --dry-run
 *   npm run research:run -- --cuisine gujarati,punjabi --limit 20
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");

const args = process.argv.slice(2);
const command = args[0] || "run";

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { ensureIntelligenceDb, seedSourceRegistry } = await import(path.join(serverRoot, "src/intelligence/index.js"));
const {
  runResearchPipeline,
  getCatalogStats,
  getRecipeAuditTrail,
} = await import(path.join(serverRoot, "src/research/index.js"));

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();

function parseFlags(argv) {
  const flags = { limit: 10, offset: 0, dryRun: false, cuisines: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) flags.limit = parseInt(argv[++i], 10);
    if (argv[i] === "--offset" && argv[i + 1]) flags.offset = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--cuisine" && argv[i + 1]) {
      flags.cuisines = argv[++i].split(",").map((c) => c.trim());
    }
  }
  return flags;
}

async function main() {
  if (command === "status") {
    console.log(JSON.stringify(getCatalogStats(), null, 2));
    return;
  }

  if (command === "audit" && args[1]) {
    console.log(JSON.stringify(getRecipeAuditTrail(args[1]), null, 2));
    return;
  }

  if (command === "run") {
    const flags = parseFlags(args.slice(1));
    console.log("Starting Rasoira Research Pipeline:", flags);
    const report = await runResearchPipeline(flags);
    console.log("\n--- Research Report ---");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`
Rasoira Master Recipe Research System

Commands:
  status     Show catalog stats (target 50,000+)
  run        Research + generate original recipes
  audit ID   Show audit trail for a recipe

Flags:
  --limit N       Process N seeds (default 10)
  --offset N      Skip first N seeds
  --cuisine a,b   Filter cuisines
  --dry-run       Research only, no save
`);
}

main().catch((err) => {
  console.error("Research failed:", err.message);
  process.exit(1);
});
