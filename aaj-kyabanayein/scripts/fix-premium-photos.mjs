#!/usr/bin/env node
/**
 * Restore premium recipe photos — clears bad cache, rebuilds DB thumbs, syncs overrides.
 * Usage: npm run fix-photos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(root, "server");
const cacheDirs = [
  path.join(server, "data/image-cache"),
  path.join(server, "data/image-cache-meta"),
];
const dbPath = path.join(server, "data/rasoira.db");

console.log("Fixing premium photos...\n");

for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✓ Cleared ${path.basename(dir)}`);
  }
}

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("✓ Reset SQLite (will rebuild with MealDB thumbs)");
}

console.log("\nRebuilding recipe database...");
execSync(`node --input-type=module -e "
import { ensureDatabase } from './src/db/ensureDatabase.js';
import { initRecipeCatalog } from './src/data/recipes.js';
ensureDatabase();
initRecipeCatalog(true);
"`, { cwd: server, stdio: "inherit" });

console.log("\nSyncing curated override images...");
execSync("node src/scripts/syncLocalImages.js --overrides-only", {
  cwd: server,
  stdio: "inherit",
});

console.log("\nDone. Run: npm run dev");
console.log("Browser: hard refresh (Cmd+Shift+R) or clear site data\n");
