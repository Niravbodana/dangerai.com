import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { signToken } from "../middleware/auth.js";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  linkGoogleAccount,
  toPublicUser,
  updateUserPreferences,
} from "../services/userStore.js";
import { verifyGoogleIdToken } from "../services/googleAuth.js";
import { mergeFavorites, getFavorites } from "../services/favoritesStore.js";

const router = Router();

function applyGuestMerge(userId, { guestId, favoriteIds = [] } = {}) {
  if (!userId) return [];
  if (guestId) mergeFavorites(userId, getFavorites(guestId));
  if (favoriteIds.length) mergeFavorites(userId, favoriteIds);
  return getFavorites(userId);
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Naam, email aur password zaroori hai",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password kam se kam 6 characters ka hona chahiye",
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({
      success: false,
      message: "Yeh email pehle se registered hai",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name: name.trim(), email: email.trim(), passwordHash });
  const token = signToken(user.id);
  const mergedFavorites = applyGuestMerge(user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Account ban gaya!",
    token,
    user: toPublicUser(user),
    mergedFavorites,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Email aur password daalein",
    });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Galat email ya password",
    });
  }

  if (!user.passwordHash) {
    return res.status(401).json({
      success: false,
      message: "Is account ke liye Google se login karein",
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "Galat email ya password",
    });
  }

  const token = signToken(user.id);
  const mergedFavorites = applyGuestMerge(user.id, req.body);

  res.json({
    success: true,
    message: "Login successful!",
    token,
    user: toPublicUser(user),
    mergedFavorites,
  });
});

router.post("/google", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: "Google credential missing hai",
    });
  }

  try {
    const profile = await verifyGoogleIdToken(credential);

    let user = findUserByGoogleId(profile.googleId);
    if (!user) {
      const existing = findUserByEmail(profile.email);
      if (existing) {
        user = linkGoogleAccount(existing.id, {
          googleId: profile.googleId,
          picture: profile.picture,
        });
        if (profile.name && !existing.name) {
          user.name = profile.name;
        }
      } else {
        user = createUser({
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          authProvider: "google",
          picture: profile.picture,
        });
      }
    }

    const token = signToken(user.id);
    const mergedFavorites = applyGuestMerge(user.id, req.body);
    res.json({
      success: true,
      message: "Google se login ho gaya!",
      token,
      user: toPublicUser(user),
      mergedFavorites,
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({
      success: false,
      message: err.message || "Google login fail ho gaya",
    });
  }
});

router.post("/merge-guest", authMiddleware, (req, res) => {
  const { guestId, favoriteIds = [] } = req.body || {};
  const mergedFavorites = applyGuestMerge(req.userId, { guestId, favoriteIds });
  res.json({
    success: true,
    message: "Guest data merge ho gaya",
    favorites: mergedFavorites,
  });
});

router.get("/me", authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User nahi mila" });
  }

  res.json({ success: true, user: toPublicUser(user) });
});

router.put("/preferences", authMiddleware, (req, res) => {
  const user = updateUserPreferences(req.userId, req.body);
  if (!user) {
    return res.status(404).json({ success: false, message: "User nahi mila" });
  }

  res.json({
    success: true,
    message: "Preferences save ho gayi",
    user: toPublicUser(user),
  });
});

export default router;
