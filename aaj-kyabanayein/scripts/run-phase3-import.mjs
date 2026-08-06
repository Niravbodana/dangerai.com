#!/usr/bin/env node
/**
 * Rasoira Phase 3 — Curated Popular Recipe Import CLI
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const args = process.argv.slice(2);
const command = args[0] || "plan";

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { ensureIntelligenceDb, seedSourceRegistry } = await import(path.join(serverRoot, "src/intelligence/index.js"));
const { seedIngredientDatabase } = await import(path.join(serverRoot, "src/enterprise/index.js"));
const {
  runPhase3Import,
  getPhase3Status,
  buildImportPlan,
  getPopularRecipeCount,
} = await import(path.join(serverRoot, "src/phase3/index.js"));

ensureDatabase();
initRecipeCatalog(true);
ensureIntelligenceDb();
seedSourceRegistry();
seedIngredientDatabase();

function parseFlags(argv) {
  const flags = { limit: 5, offset: 0, dryRun: false, phase: 1, cuisines: null, minQualityScore: 70 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) flags.limit = parseInt(argv[++i], 10);
    if (argv[i] === "--offset" && argv[i + 1]) flags.offset = parseInt(argv[++i], 10);
    if (argv[i] === "--phase" && argv[i + 1]) flags.phase = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--min-score" && argv[i + 1]) flags.minQualityScore = parseInt(argv[++i], 10);
    if (argv[i] === "--cuisine" && argv[i + 1]) flags.cuisines = argv[++i].split(",").map((c) => c.trim());
  }
  return flags;
}

async function main() {
  if (command === "plan" || command === "status") {
    console.log(JSON.stringify(getPhase3Status(), null, 2));
    return;
  }

  if (command === "count") {
    console.log(`Curated popular recipes: ${getPopularRecipeCount()}`);
    console.log(`Total library target: ${buildImportPlan().totalTarget}`);
    return;
  }

  if (command === "import" || command === "run") {
    const flags = parseFlags(args.slice(1));
    console.log("Phase 3 Import (popular recipes only):", flags);
    const report = await runPhase3Import(flags);
    console.log("\n--- Phase 3 Report ---");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`
Rasoira Phase 3 — Curated Popular Recipe Library

Commands:
  plan / status   Show import plan and progress
  count           Curated recipe count vs targets
  import / run    Import popular recipes (Phase 1 first)

Flags:
  --phase N       Import phase 1|2|3 (default 1 = most popular)
  --limit N       Process N recipes (default 5)
  --cuisine a,b   Filter cuisines
  --min-score N   Minimum quality score (default 70)
  --dry-run       No save
`);
}

main().catch((err) => {
  console.error("Phase 3 failed:", err.message);
  process.exit(1);
});
