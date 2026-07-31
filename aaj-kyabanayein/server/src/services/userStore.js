import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, "../data/users.json");

function ensureFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

function readUsers() {
  ensureFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  const users = readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  const users = readUsers();
  return users.find((u) => u.id === id);
}

export function findUserByGoogleId(googleId) {
  const users = readUsers();
  return users.find((u) => u.googleId === googleId);
}

export function createUser({ name, email, passwordHash, googleId = null, authProvider = "email", picture = null }) {
  const users = readUsers();
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email: email.toLowerCase(),
    passwordHash: passwordHash || null,
    googleId,
    authProvider,
    picture,
    plan: "free",
    preferences: {
      diet: "veg",
      budget: "medium",
      familySize: 4,
      maxCookTime: 45,
      spice: "medium",
    },
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function linkGoogleAccount(userId, { googleId, picture = null }) {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  users[index].googleId = googleId;
  users[index].authProvider = users[index].passwordHash ? "email+google" : "google";
  if (picture) users[index].picture = picture;
  writeUsers(users);
  return users[index];
}

export function updateUserPreferences(userId, preferences) {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  users[index].preferences = { ...users[index].preferences, ...preferences };
  writeUsers(users);
  return users[index];
}

export function updateUserPlan(userId, plan) {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  users[index].plan = plan;
  writeUsers(users);
  return users[index];
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
