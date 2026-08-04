/**
 * Resumable pipeline state — filesystem checkpoint when PostgreSQL unavailable.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, "../../../data/pipeline");
const STATE_FILE = path.join(STATE_DIR, "state.json");

function ensureDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

export function createRunId() {
  return `run-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export function loadPipelineState() {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function savePipelineState(state) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export function initRunState(runId, config = {}) {
  const state = {
    runId,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    config,
    checkpoint: {
      stage: "verify",
      processedIds: [],
      skipped: [],
      imported: 0,
      failed: 0,
    },
    stats: {
      verified: 0,
      skipped: 0,
      normalized: 0,
      nutritionCalculated: 0,
      textGenerated: 0,
      duplicates: 0,
      persisted: 0,
    },
    error: null,
  };
  savePipelineState(state);
  return state;
}

export function updateCheckpoint(patch) {
  const state = loadPipelineState();
  if (!state) return null;
  Object.assign(state.checkpoint, patch);
  state.checkpoint.updatedAt = new Date().toISOString();
  savePipelineState(state);
  return state;
}

export function incrementStat(key, by = 1) {
  const state = loadPipelineState();
  if (!state) return;
  state.stats[key] = (state.stats[key] || 0) + by;
  savePipelineState(state);
}

export function markRunComplete(status = "completed", error = null) {
  const state = loadPipelineState();
  if (!state) return;
  state.status = status;
  state.finishedAt = new Date().toISOString();
  state.error = error;
  savePipelineState(state);
}

export function isAlreadyProcessed(recipeId) {
  const state = loadPipelineState();
  return state?.checkpoint?.processedIds?.includes(recipeId) ?? false;
}

export function markProcessed(recipeId) {
  const state = loadPipelineState();
  if (!state) return;
  if (!state.checkpoint.processedIds.includes(recipeId)) {
    state.checkpoint.processedIds.push(recipeId);
  }
  savePipelineState(state);
}
