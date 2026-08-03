import { findUserById } from "../services/userStore.js";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "rasoira-admin-dev-key";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function adminMiddleware(req, res, next) {
  const key = req.headers["x-admin-key"] || req.query.adminKey;
  if (key && key === ADMIN_SECRET) {
    req.isAdmin = true;
    return next();
  }

  if (req.userId) {
    const user = findUserById(req.userId);
    if (user && ADMIN_EMAILS.length && ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
      req.isAdmin = true;
      return next();
    }
  }

  return res.status(403).json({ success: false, message: "Admin access required" });
}
