import { getDb } from "../db/connection.js";
import { isDatabaseReady } from "../db/migrate.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, "../data/users.json");

function useDb() {
  return isDatabaseReady();
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    authProvider: row.auth_provider,
    picture: row.picture,
    plan: row.plan,
    preferences: JSON.parse(row.preferences || "{}"),
    createdAt: row.created_at,
  };
}

export function findUserByEmail(email) {
  if (useDb()) {
    const row = getDb()
      .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email.trim().toLowerCase());
    return rowToUser(row);
  }
  if (!fs.existsSync(USERS_FILE)) return undefined;
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  if (useDb()) {
    return rowToUser(getDb().prepare("SELECT * FROM users WHERE id = ?").get(id));
  }
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  return users.find((u) => u.id === id);
}

export function findUserByGoogleId(googleId) {
  if (useDb()) {
    return rowToUser(getDb().prepare("SELECT * FROM users WHERE google_id = ?").get(googleId));
  }
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  return users.find((u) => u.googleId === googleId);
}

export function createUser({ name, email, passwordHash, googleId = null, authProvider = "email", picture = null }) {
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email: email.toLowerCase(),
    passwordHash: passwordHash || null,
    googleId,
    authProvider,
    picture,
    plan: "free",
    preferences: { diet: "veg", budget: "medium", familySize: 4, maxCookTime: 45, spice: "medium" },
    createdAt: new Date().toISOString(),
  };
  if (useDb()) {
    getDb().prepare(
      `INSERT INTO users (id, name, email, password_hash, google_id, auth_provider, picture, plan, preferences, created_at)
       VALUES (@id, @name, @email, @password_hash, @google_id, @auth_provider, @picture, @plan, @preferences, @created_at)`
    ).run({
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      google_id: user.googleId,
      auth_provider: user.authProvider,
      picture: user.picture,
      plan: user.plan,
      preferences: JSON.stringify(user.preferences),
      created_at: user.createdAt,
    });
    return user;
  }
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return user;
}

export function linkGoogleAccount(userId, { googleId, picture = null }) {
  const user = findUserById(userId);
  if (!user) return null;
  user.googleId = googleId;
  user.authProvider = user.passwordHash ? "email+google" : "google";
  if (picture) user.picture = picture;
  if (useDb()) {
    getDb().prepare("UPDATE users SET google_id = ?, auth_provider = ?, picture = ? WHERE id = ?")
      .run(user.googleId, user.authProvider, user.picture, userId);
  }
  return user;
}

export function updateUserPreferences(userId, preferences) {
  const user = findUserById(userId);
  if (!user) return null;
  user.preferences = { ...user.preferences, ...preferences };
  if (useDb()) {
    getDb().prepare("UPDATE users SET preferences = ? WHERE id = ?")
      .run(JSON.stringify(user.preferences), userId);
  }
  return user;
}

export function updateUserPlan(userId, plan) {
  const user = findUserById(userId);
  if (!user) return null;
  user.plan = plan;
  if (useDb()) {
    getDb().prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
  }
  return user;
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    preferences: user.preferences,
    createdAt: user.createdAt,
    authProvider: user.authProvider || (user.googleId ? "google" : "email"),
    picture: user.picture || null,
  };
}
