#!/usr/bin/env node
/**
 * Start API server (port 5000) + Vite client (port 3000) together.
 * Usage: npm run dev
 *
 * Uses stable API mode (no file-watch restarts) so Vite proxy does not get
 * ECONNRESET while the 10k catalog is serving.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const API_HEALTH = process.env.VITE_API_PROXY || "http://127.0.0.1:5000";

const env = {
  ...process.env,
  // Keep API responsive while browsing recipes
  GUARDIAN_DISABLED: process.env.GUARDIAN_DISABLED ?? "1",
  SKIP_BOOT_WARM: process.env.SKIP_BOOT_WARM ?? "1",
};

function run(name, cwd, script, extraArgs = []) {
  const child = spawn(isWin ? "npm.cmd" : "npm", ["run", script, ...extraArgs], {
    cwd,
    stdio: "inherit",
    env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${name}] exited with code ${code}`);
  });
  return child;
}

async function waitForApi(maxMs = 90000) {
  const start = Date.now();
  let okStreak = 0;
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${API_HEALTH}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if ((data.totalRecipes || 0) > 0) {
          okStreak++;
          if (okStreak >= 2) {
            console.log(`[dev] API ready — ${data.totalRecipes} recipes`);
            return true;
          }
        } else {
          okStreak = 0;
        }
      } else {
        okStreak = 0;
      }
    } catch {
      okStreak = 0;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.warn("[dev] API health check timed out — starting Vite anyway");
  return false;
}

console.log("Starting Rasoira dev environment...");
console.log("  API  → http://localhost:5000");
console.log("  App  → http://localhost:3000");
console.log("  Tip  → Open http://localhost:3000/recipes (not :5000)");
console.log("Press Ctrl+C to stop both.\n");

// Stable API (no --watch) avoids ECONNRESET from mid-request restarts
const server = run("api", path.join(root, "server"), "dev:stable");
let web = null;

waitForApi().then(() => {
  web = run("web", path.join(root, "client"), "dev", ["--", "--host"]);
});

function shutdown() {
  try {
    server.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  try {
    web?.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
