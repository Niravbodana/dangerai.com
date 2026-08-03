/**
 * Logs skipped datasets with reason — audit trail for legal compliance.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "../../../data/pipeline/logs");
const SKIP_FILE = path.join(LOG_DIR, "skipped-datasets.jsonl");

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * @param {{ datasetId: string, reason: string, runId?: string, details?: unknown }} entry
 */
export function logSkippedDataset({ datasetId, reason, runId = null, details = null }) {
  ensureLogDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    datasetId,
    reason,
    runId,
    details: details ? sanitizeDetails(details) : null,
  });
  fs.appendFileSync(SKIP_FILE, `${line}\n`, "utf-8");
  console.warn(`[pipeline:SKIP] ${datasetId}: ${reason}`);
}

function sanitizeDetails(details) {
  try {
    const s = JSON.stringify(details);
    return s.length > 2000 ? { truncated: true, preview: s.slice(0, 2000) } : details;
  } catch {
    return { note: "unserializable details" };
  }
}

export function readSkippedLog(limit = 100) {
  if (!fs.existsSync(SKIP_FILE)) return [];
  const lines = fs.readFileSync(SKIP_FILE, "utf-8").trim().split("\n").filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l));
}

export function getSkipLogPath() {
  return SKIP_FILE;
}
