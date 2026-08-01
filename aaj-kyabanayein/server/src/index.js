import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import mealsRouter from "./routes/meals.js";
import mealsUserRouter, { loadCustomMealsOnStartup } from "./routes/mealsUser.js";
import socialRouter from "./routes/social.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envFile = path.join(__dirname, "../.env");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();
loadCustomMealsOnStartup();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api", socialRouter);
app.use("/api", mealsUserRouter);
app.use("/api", mealsRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "Rasoira API",
    version: "2.0.0",
    endpoints: [
      "/api/health",
      "/api/recipes",
      "/api/recipes/trending",
      "/api/recipes/enrichment-status",
      "POST /api/recipes/:id/enrich",
      "/api/pantry/items",
      "POST /api/pantry/suggest",
      "POST /api/plan/healthy",
      "/api/pricing",
      "POST /api/plan",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/auth/google",
      "GET /api/auth/me",
      "PUT /api/auth/preferences",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
