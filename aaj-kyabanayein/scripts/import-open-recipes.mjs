#!/usr/bin/env node
/**
 * Import recipes from Wikipedia (HD photos) + TheMealDB (real ingredients).
 *
 * Usage:
 *   npm run import:open              # import all famous dishes
 *   npm run import:open -- --limit 20
 *   npm run import:open -- status
 *   npm run import:open -- dry-run
 */
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const cmd = process.argv[2] || "run";
const limitIdx = process.argv.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : 0;

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { runOpenSourceImport, getOpenSourceImportStatus } = await import(
  path.join(serverRoot, "src/import/openSourceImporter.js")
);

ensureDatabase();

if (cmd === "status") {
  console.log(JSON.stringify(getOpenSourceImportStatus(), null, 2));
  process.exit(0);
}

const dryRun = cmd === "dry-run" || process.argv.includes("--dry-run");
console.log(`Open-source import (${dryRun ? "dry-run" : "live"})…`);

const report = await runOpenSourceImport({
  limit,
  includeWikiList: !process.argv.includes("--no-wiki-list"),
  dryRun,
  concurrency: 4,
});

if (!dryRun) {
  initRecipeCatalog(true);
}

console.log("\n--- Import Report ---");
console.log(JSON.stringify(report, null, 2));
console.log(`\nImported: ${report.imported} | With HD image: ${report.withImage} | Skipped: ${report.skipped}`);
if (!dryRun) console.log("Restart dev server or refresh /recipes to see recipes.");
