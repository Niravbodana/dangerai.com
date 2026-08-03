#!/usr/bin/env node
/**
 * Start API server (port 5000) + Vite client (port 3000) together.
 * Usage: npm run dev
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function run(name, cwd, script, extraArgs = []) {
  const child = spawn(isWin ? "npm.cmd" : "npm", ["run", script, ...extraArgs], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${name}] exited with code ${code}`);
  });
  return child;
}

console.log("Starting Rasoira dev environment...");
console.log("  API  → http://localhost:5000");
console.log("  App  → http://localhost:3000");
console.log("Press Ctrl+C to stop both.\n");

const server = run("api", path.join(root, "server"), "dev");
// Give API a moment to bind before Vite proxies /api
setTimeout(() => {
  run("web", path.join(root, "client"), "dev", ["--", "--host"]);
}, 1500);

function shutdown() {
  server.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
