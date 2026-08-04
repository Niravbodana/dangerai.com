#!/usr/bin/env node
/**
 * Free dev ports 3000 (Vite) and 5000 (API) before npm run dev.
 * Mac/Linux: uses lsof. Windows: uses netstat + taskkill.
 */
import { execSync } from "node:child_process";

const PORTS = [3000, 5000];

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = [...new Set(out.match(/\s(\d+)\s*$/gm)?.map((l) => l.trim()) || [])];
      for (const pid of pids) {
        if (pid && pid !== "0") execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      }
      return pids.length;
    }
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
    if (!out) return 0;
    const pids = out.split("\n").filter(Boolean);
    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return pids.length;
  } catch {
    return 0;
  }
}

let total = 0;
for (const port of PORTS) {
  const n = killPort(port);
  if (n) {
    console.log(`Freed port ${port} (${n} process${n > 1 ? "es" : ""})`);
    total += n;
  }
}

if (!total) console.log("Ports 3000 and 5000 are already free.");
else console.log("Done. Run: npm run dev");
