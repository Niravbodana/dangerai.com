import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "aaj-kyabanayein-dev-secret-change-in-prod";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Nirav@123";
const ADMIN_TOKEN_EXPIRES = "12h";

let passwordHash = null;

async function getPasswordHash() {
  if (passwordHash) return passwordHash;
  passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return passwordHash;
}

export function getAdminUsername() {
  return ADMIN_USERNAME;
}

export async function validateAdminLogin(username, password) {
  if (!username || !password) return false;
  if (username.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase()) return false;
  const hash = await getPasswordHash();
  return bcrypt.compare(password, hash);
}

export function signAdminToken(username = ADMIN_USERNAME) {
  return jwt.sign({ admin: true, username }, JWT_SECRET, { expiresIn: ADMIN_TOKEN_EXPIRES });
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (!payload?.admin) throw new Error("Not an admin token");
  return payload;
}
