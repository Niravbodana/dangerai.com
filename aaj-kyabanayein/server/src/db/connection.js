import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_DIR = path.join(__dirname, "../../data");
export const DB_PATH = path.join(DB_DIR, "rasoira.db");

let db = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
