import cors from "cors";
import express from "express";
import mealsRouter from "./routes/meals.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", mealsRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "AajKyaBanayein API",
    version: "1.0.0",
    endpoints: ["/api/health", "/api/recipes", "/api/pricing", "POST /api/plan"],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
