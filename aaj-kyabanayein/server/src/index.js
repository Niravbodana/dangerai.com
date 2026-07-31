import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import mealsRouter from "./routes/meals.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api", mealsRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "AajKyaBanayein API",
    version: "1.1.0",
    endpoints: [
      "/api/health",
      "/api/recipes",
      "/api/recipes/categories",
      "/api/pantry/items",
      "POST /api/pantry/suggest",
      "POST /api/plan/healthy",
      "/api/pricing",
      "POST /api/plan",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "PUT /api/auth/preferences",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
