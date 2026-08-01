#!/usr/bin/env node
/**
 * Verify all required project files exist after ZIP clone/download.
 * Run: npm run verify
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "package.json",
  "client/package.json",
  "server/package.json",
  "client/vite.config.js",
  "server/src/index.js",
  "server/src/data/curated/recipes.json",
  "server/src/data/curated/index.json",
  "client/public/home/hero-homemaker.png",
  "client/src/pages/Home.jsx",
  "client/src/App.jsx",
];

let ok = 0;
let fail = 0;

console.log("Rasoira project verify\n");

for (const rel of required) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full);
    const size = stat.isFile() ? ` (${(stat.size / 1024).toFixed(1)} KB)` : "";
    console.log(`  ✓ ${rel}${size}`);
    ok++;
  } else {
    console.log(`  ✗ MISSING: ${rel}`);
    fail++;
  }
}

if (fs.existsSync(path.join(root, "server/src/data/curated/recipes.json"))) {
  try {
    const recipes = JSON.parse(fs.readFileSync(path.join(root, "server/src/data/curated/recipes.json"), "utf8"));
    console.log(`\n  Recipes loaded: ${recipes.length}`);
  } catch {
    console.log("\n  ✗ recipes.json corrupt — re-download ZIP");
    fail++;
  }
}

console.log(`\n${ok} ok, ${fail} missing`);
if (fail > 0) {
  console.log("\nFix: download full ZIP from");
  console.log("https://github.com/Niravbodana/dangerai.com/archive/refs/heads/main.zip");
  process.exit(1);
}
console.log("\nAll files present. Run: npm run install:all");
