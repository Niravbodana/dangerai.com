#!/usr/bin/env node
/**
 * Rasoira Enterprise AI Research System v2.0 CLI
 *
 * Usage:
 *   npm run enterprise:status
 *   npm run enterprise:run -- --limit 3 --dry-run
 *   npm run enterprise:agents -- <recipe-id>
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
  runEnterpriseResearch,
  getCatalogStats,
  getAgentRuns,
  getAgentRunStats,
  getIngredientStats,
  seedIngredientDatabase,
  AGENT_NAMES,
} = await import(path.join(serverRoot, "src/enterprise/index.js"));

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();
seedIngredientDatabase();

function parseFlags(argv) {
  const flags = { limit: 5, offset: 0, dryRun: false, cuisines: null, minQualityScore: 60 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) flags.limit = parseInt(argv[++i], 10);
    if (argv[i] === "--offset" && argv[i + 1]) flags.offset = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--min-score" && argv[i + 1]) flags.minQualityScore = parseInt(argv[++i], 10);
    if (argv[i] === "--cuisine" && argv[i + 1]) {
      flags.cuisines = argv[++i].split(",").map((c) => c.trim());
    }
  }
  return flags;
}

async function main() {
  if (command === "status") {
    console.log(JSON.stringify({
      version: "2.0",
      catalog: getCatalogStats(),
      agents: AGENT_NAMES,
      agentStats: getAgentRunStats(),
      ingredients: getIngredientStats(),
    }, null, 2));
    return;
  }

  if (command === "agents" && args[1]) {
    console.log(JSON.stringify(getAgentRuns({ recipeId: args[1] }), null, 2));
    return;
  }

  if (command === "run") {
    const flags = parseFlags(args.slice(1));
    console.log("Starting Enterprise AI Research v2.0:", flags);
    const report = await runEnterpriseResearch(flags);
    console.log("\n--- Enterprise Report ---");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`
Rasoira Enterprise AI Research System v2.0

Commands:
  status     Show agents, catalog, ingredient stats
  run        Run 10-agent pipeline
  agents ID  Show agent runs for a recipe

Flags:
  --limit N         Process N seeds (default 5)
  --offset N        Skip first N seeds
  --cuisine a,b     Filter cuisines
  --min-score N     Minimum quality score (default 60)
  --dry-run         No save to DB
`);
}

main().catch((err) => {
  console.error("Enterprise research failed:", err.message);
  process.exit(1);
});
