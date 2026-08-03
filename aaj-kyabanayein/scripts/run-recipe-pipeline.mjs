#!/usr/bin/env node
/**
 * Rasoira Recipe Data Pipeline CLI
 *
 * Usage:
 *   npm run pipeline:status
 *   npm run pipeline:verify -- themealdb          # shows SKIP (blocked)
 *   npm run pipeline:run -- --limit 10 --dry-run
 *   npm run pipeline:run -- --resume
 *   DATABASE_URL=... npm run pipeline:init-db
 *   DATABASE_URL=... npm run pipeline:run
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");

const args = process.argv.slice(2);
const command = args[0] || "run";

const {
  runRecipePipeline,
  getPipelineStatus,
  verifyDatasetLicense,
  initPostgresSchema,
  isPostgresConfigured,
  readSkippedLog,
} = await import(path.join(serverRoot, "src/pipeline/index.js"));

function parseFlags(argv) {
  const flags = {
    limit: Infinity,
    dryRun: false,
    resume: false,
    skipAi: true,
    skipNutrition: argv.includes("--skip-nutrition"),
    datasets: ["rasoira-curated-modules"],
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) flags.limit = parseInt(argv[++i], 10);
    if (argv[i] === "--dry-run") flags.dryRun = true;
    if (argv[i] === "--resume") flags.resume = true;
    if (argv[i] === "--with-ai") flags.skipAi = false;
    if (argv[i] === "--dataset" && argv[i + 1]) flags.datasets = [argv[++i]];
  }

  return flags;
}

async function main() {
  if (command === "status") {
    console.log(JSON.stringify(getPipelineStatus(), null, 2));
    return;
  }

  if (command === "verify") {
    const datasetId = args[1] || "themealdb";
    const result = verifyDatasetLicense({ id: datasetId });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.allowed ? 0 : 1);
  }

  if (command === "skipped") {
    console.log(JSON.stringify(readSkippedLog(50), null, 2));
    return;
  }

  if (command === "init-db") {
    if (!isPostgresConfigured()) {
      console.error("DATABASE_URL is required for pipeline:init-db");
      process.exit(1);
    }
    await initPostgresSchema();
    console.log("PostgreSQL pipeline schema initialized.");
    return;
  }

  if (command === "run") {
    const flags = parseFlags(args.slice(1));
    console.log("Starting Rasoira Recipe Pipeline with config:", flags);

    const report = await runRecipePipeline(flags);
    console.log("\n--- Pipeline Report ---");
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`
Rasoira Recipe Data Pipeline

Commands:
  run        Run the pipeline (default)
  status     Show pipeline status and registered sources
  verify     Verify a dataset license (e.g. npm run pipeline:verify -- themealdb)
  skipped    Show recently skipped datasets
  init-db    Initialize PostgreSQL schema (requires DATABASE_URL)

Flags:
  --limit N       Process at most N recipes
  --dry-run       Transform without persisting to PostgreSQL
  --resume        Resume from last checkpoint
  --with-ai       Generate original recipe text via AI
  --skip-nutrition  Skip USDA nutrition API calls
  --dataset ID    Import from specific registered dataset
`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
