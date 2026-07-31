import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aaj-kyabanayein-dev-secret-change-in-prod";
const JWT_EXPIRES = "7d";

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Login required" });
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.userId = payload.userId;
    } catch {
      req.userId = null;
    }
  }
  next();
}
