import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import { isDatabaseReady } from "./config/db.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  if (!isDatabaseReady()) {
    return res.status(503).json({
      message: "Database is not connected yet. Please try again shortly.",
    });
  }

  return next();
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: isDatabaseReady() ? "connected" : "disconnected" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    message: "Internal server error",
  });
});

export default app;
