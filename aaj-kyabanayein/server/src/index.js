import os from "os";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import mealsRouter from "./routes/meals.js";
import mealsUserRouter, { loadCustomMealsOnStartup } from "./routes/mealsUser.js";
import socialRouter from "./routes/social.js";
import kitchenRouter from "./routes/kitchen.js";
import adminRouter from "./routes/admin.js";
import siteRouter from "./routes/site.js";
import paymentsRouter from "./routes/payments.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/security.js";
import { logger } from "./lib/logger.js";
import { initSentry } from "./lib/sentry.js";
import { ensureDatabase } from "./db/ensureDatabase.js";
import { initRecipeCatalog } from "./data/recipes.js";
import { getFullConfig } from "./services/siteConfigService.js";

initSentry();

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
console.time("recipes-load");
ensureDatabase();
initRecipeCatalog(true);
console.timeEnd("recipes-load");
loadCustomMealsOnStartup();
getFullConfig();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const isProd = process.env.NODE_ENV === "production";

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(",").map((o) => o.trim()) } : undefined));
app.use(securityHeaders);
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));

app.use("/api/auth", authRouter);
app.use("/api/site", siteRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", kitchenRouter);
app.use("/api", socialRouter);
app.use("/api", mealsUserRouter);
app.use("/api", mealsRouter);

const clientDist = path.join(__dirname, "../../client/dist");
const serveClient = isProd && fs.existsSync(clientDist);

if (serveClient) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      name: "Rasoira API",
      version: "2.0.0",
      endpoints: ["/api/health", "/api/recipes", "/api/recipes/trending"],
    });
  });
}

app.use("/api", notFoundHandler);
app.use(errorHandler);

function localIpv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

process.on("uncaughtException", (err) => {
  logger.error(`uncaughtException: ${err?.stack || err}`);
});
process.on("unhandledRejection", (reason) => {
  logger.error(`unhandledRejection: ${reason?.stack || reason}`);
});

app.listen(PORT, HOST, () => {
  const lan = localIpv4();
  logger.info(`Server running on http://localhost:${PORT}`);
  if (lan) logger.info(`Phone (same Wi‑Fi): http://${lan}:${PORT}/api/health`);
  if (isProd && !process.env.JWT_SECRET) {
    logger.warn("JWT_SECRET is not set — set it before production deploy");
  }
});
