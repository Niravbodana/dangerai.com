import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, DB_PATH } from "./connection.js";
import { createSchema } from "./schema.js";
import { upsertRecipe, getRecipeCount } from "./recipeRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED_DIR = path.join(__dirname, "../data/curated");
const DATA_DIR = path.join(__dirname, "../data");

export function isDatabaseReady() {
  return fs.existsSync(DB_PATH);
}

export function initDatabase() {
  const db = getDb();
  createSchema(db);
  return db;
}

export function importRecipesFromJson(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const recipes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  for (const r of recipes) upsertRecipe(r);
  return recipes.length;
}

export function importJsonStores() {
  let imported = 0;

  const usersFile = path.join(DATA_DIR, "users.json");
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    const stmt = getDb().prepare(
      `INSERT OR IGNORE INTO users (id, name, email, password_hash, google_id, auth_provider, picture, plan, preferences, created_at)
       VALUES (@id, @name, @email, @password_hash, @google_id, @auth_provider, @picture, @plan, @preferences, @created_at)`
    );
    for (const u of users) {
      stmt.run({
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: u.passwordHash || null,
        google_id: u.googleId || null,
        auth_provider: u.authProvider || "email",
        picture: u.picture || null,
        plan: u.plan || "free",
        preferences: JSON.stringify(u.preferences || {}),
        created_at: u.createdAt || new Date().toISOString(),
      });
      imported++;
    }
  }

  const favFile = path.join(DATA_DIR, "favorites.json");
  if (fs.existsSync(favFile)) {
    const data = JSON.parse(fs.readFileSync(favFile, "utf-8"));
    const stmt = getDb().prepare(
      "INSERT OR IGNORE INTO favorites (user_id, recipe_id, added_at) VALUES (?, ?, ?)"
    );
    for (const [userId, ids] of Object.entries(data)) {
      for (const recipeId of ids || []) stmt.run(userId, recipeId, new Date().toISOString());
    }
  }

  const ratingsFile = path.join(DATA_DIR, "ratings.json");
  if (fs.existsSync(ratingsFile)) {
    const data = JSON.parse(fs.readFileSync(ratingsFile, "utf-8"));
    const stmt = getDb().prepare(
      `INSERT OR REPLACE INTO recipe_ratings (recipe_id, user_id, score, comment, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const [recipeId, block] of Object.entries(data)) {
      for (const [userId, score] of Object.entries(block.users || {})) {
        stmt.run(recipeId, userId, score, null, new Date().toISOString());
      }
      for (const rev of block.reviews || []) {
        stmt.run(recipeId, rev.userId, rev.score, rev.comment || null, rev.createdAt || new Date().toISOString());
      }
    }
  }

  return imported;
}

export function seedFromCurated() {
  initDatabase();
  const count = importRecipesFromJson(path.join(CURATED_DIR, "recipes.json"));
  importJsonStores();
  return { recipes: count, total: getRecipeCount() };
}
