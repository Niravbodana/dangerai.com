import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { signToken } from "../middleware/auth.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updateUserPreferences,
} from "../services/userStore.js";

const router = Router();

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

  res.status(201).json({
    success: true,
    message: "Account ban gaya!",
    token,
    user: toPublicUser(user),
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

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "Galat email ya password",
    });
  }

  const token = signToken(user.id);

  res.json({
    success: true,
    message: "Login successful!",
    token,
    user: toPublicUser(user),
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
