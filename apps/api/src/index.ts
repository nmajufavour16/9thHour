import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";
import { internalAuthGuard } from "./middleware/internalAuth";

/**
 * 9TH HOUR — API ENTRY POINT
 *
 * This is the dedicated Node.js/Express server. It is NEVER called directly
 * by the browser — the Next.js BFF proxy is the only client. Real business
 * logic, the financial integrity engine (TRD.md §4), and Socket.io all
 * live here, not in Next.js serverless functions.
 */

const app = express();
const PORT = process.env.PORT || 4000;

// ── Global middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting — blunts brute-force and webhook replay attempts (TRD.md §11)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Internal auth guard — rejects anything not proxied through Next.js,
// except /webhooks/* which authenticate via provider signature instead.
app.use(internalAuthGuard);

// ── Health check (useful for Railway / uptime monitoring) ─────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "9th-hour-api" });
});

// ── Route mounts ────────────────────────────────────────────────────────────
// Phase 2 onward: mount /auth, /wallet, /webhooks, /agora, /fellowships,
// /prayer-requests, /admin, etc. here as they're built.
//
// Example for when Phase 2 begins:
// import authRoutes from "./routes/auth";
// app.use("/auth", authRoutes);

// ── Boot ─────────────────────────────────────────────────────────────────
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
