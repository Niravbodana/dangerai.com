/**
 * Intelligence data layer — SQLite (dev/single-node) with optional PostgreSQL sync.
 */
import { getDb } from "../db/connection.js";
import { createIntelligenceSchema } from "./schema.js";

let ready = false;

export function ensureIntelligenceDb() {
  if (ready) return getDb();
  const db = getDb();
  createIntelligenceSchema(db);
  ready = true;
  return db;
}

export function getIntelligenceDb() {
  return ensureIntelligenceDb();
}
