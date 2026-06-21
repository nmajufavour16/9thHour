import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";
import { internalAuthGuard } from "./middleware/internalAuth";
import authRoutes from "./routes/auth";

// Dedicated Express API. Only the Next.js BFF proxy calls this directly —
// never the browser. Business logic and the financial engine live here.

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(internalAuthGuard);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "9th-hour-api" });
});

app.use("/auth", authRoutes);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[9th Hour API] Listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[9th Hour API] Failed to start:", err);
  process.exit(1);
});
