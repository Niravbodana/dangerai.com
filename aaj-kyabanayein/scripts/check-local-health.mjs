#!/usr/bin/env node
/**
 * Quick health check for local Mac/dev: recipes count, API, static assets.
 * Usage: node scripts/check-local-health.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

const hero = path.join(root, "client/public/home/hero-homemaker.png");
const logo = path.join(root, "client/public/logo-wordmark-light.svg");
const curated = path.join(root, "server/src/data/curated/recipes.json");
const dbPath = path.join(root, "server/data/rasoira.db");

if (!fs.existsSync(hero)) issues.push("Missing home hero image: client/public/home/hero-homemaker.png");
if (!fs.existsSync(logo)) issues.push("Missing logo: client/public/logo-wordmark-light.svg");
if (!fs.existsSync(curated)) issues.push("Missing curated recipes JSON");
else {
  const n = JSON.parse(fs.readFileSync(curated, "utf8")).length;
  console.log(`Curated JSON recipes: ${n}`);
}

if (fs.existsSync(dbPath)) {
  console.log(`SQLite DB present: ${dbPath} (${Math.round(fs.statSync(dbPath).size / 1024 / 1024)} MB)`);
} else {
  console.log("SQLite DB missing — will seed on next server start");
}

try {
  const res = await fetch("http://127.0.0.1:5000/api/recipes?limit=1");
  if (!res.ok) issues.push(`API /api/recipes returned ${res.status}`);
  else {
    const data = await res.json();
    console.log(`API live recipes: ${data.total}`);
    if ((data.total || 0) < 200) {
      issues.push(`Only ${data.total} recipes in API — run: npm run db:init`);
    }
  }
} catch {
  issues.push("API not reachable on http://127.0.0.1:5000 — run: npm run dev");
}

try {
  const res = await fetch("http://127.0.0.1:5000/api/recipes/trending?limit=3");
  const data = await res.json();
  console.log(`Trending recipes: ${(data.recipes || []).length}`);
} catch {
  /* covered by API check */
}

console.log("\nOpen app at: http://localhost:3000  (NOT 5173)");

if (issues.length) {
  console.log("\nISSUES:");
  for (const i of issues) console.log(` - ${i}`);
  process.exit(1);
}

console.log("\nHealth OK");
