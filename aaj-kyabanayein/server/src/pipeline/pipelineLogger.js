/**
 * Structured pipeline logging.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "../../../data/pipeline/logs");

function ensureDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logFile(runId) {
  ensureDir();
  return path.join(LOG_DIR, `${runId || "pipeline"}.jsonl`);
}

export function pipelineLog(level, message, meta = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
  const state = meta.runId ? meta.runId : "pipeline";
  fs.appendFileSync(logFile(state), `${line}\n`, "utf-8");

  const prefix = `[pipeline:${level}]`;
  if (level === "error") console.error(prefix, message, meta.recipeId || "");
  else if (level === "warn") console.warn(prefix, message);
  else console.log(prefix, message);
}

export const log = {
  info: (msg, meta) => pipelineLog("info", msg, meta),
  warn: (msg, meta) => pipelineLog("warn", msg, meta),
  error: (msg, meta) => pipelineLog("error", msg, meta),
  skip: (msg, meta) => pipelineLog("skip", msg, meta),
};
