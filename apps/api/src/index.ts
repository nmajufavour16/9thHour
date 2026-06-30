import "dotenv/config";
import { initSentry, Sentry } from "./lib/sentry";
initSentry();

import http from "http";
import express from "express";
// Must load before any router is defined — patches Express so async handler
// rejections are forwarded to the central error handler instead of hanging.
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./lib/db";
import { internalAuthGuard } from "./middleware/internalAuth";
import { errorHandler } from "./middleware/errorHandler";
import { warnIfPaystackUnconfigured } from "./lib/paystack";
import { seedExchangeRate } from "./config/seedExchangeRate";
import authRoutes from "./routes/auth";
import verificationRoutes from "./routes/verification";
import fellowshipRoutes from "./routes/fellowships";
import reportRoutes from "./routes/reports";
import walletRoutes from "./routes/wallet";
import webhookRoutes from "./routes/webhooks";
import dailyVerseRoutes from "./routes/dailyVerse";
import quizRoutes from "./routes/quiz";
import streakRoutes from "./routes/streak";
import liveSessionRoutes from "./routes/liveSessions";
import agoraRoutes from "./routes/agora";
import prayerRequestRoutes from "./routes/prayerRequests";
import postRoutes from "./routes/posts";
import airtimeRoutes from "./routes/airtime";
import adminRoutes from "./routes/admin";
import { warnIfAgoraUnconfigured } from "./lib/agora";
import { warnIfFlutterwaveUnconfigured } from "./lib/flutterwave";
import { warnIfResendUnconfigured } from "./lib/resend";
import { registerCronJobs } from "./lib/cron";
import { initSocket } from "./lib/socket";

// Dedicated Express API. Only the Next.js BFF proxy calls this directly —
// never the browser. Business logic and the financial engine live here.

const app = express();
const PORT = process.env.PORT || 4000;

// The BFF proxy forwards X-Forwarded-For — tell Express to trust it
// so express-rate-limit doesn't throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
// Keep the raw body around so the Paystack webhook can verify the HMAC-SHA512
// signature against the exact bytes that were signed.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    },
  })
);

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
app.use("/fellowships", fellowshipRoutes);
// Mounted at root: each router spells out its full paths so admin actions live
// under /admin/* while the minister/user-facing routes keep their own prefix.
app.use("/", verificationRoutes);
app.use("/", reportRoutes);
app.use("/", walletRoutes);
app.use("/", webhookRoutes);
app.use("/", dailyVerseRoutes);
app.use("/", quizRoutes);
app.use("/", streakRoutes);
app.use("/", liveSessionRoutes);
app.use("/", agoraRoutes);
app.use("/", prayerRequestRoutes);
app.use("/", postRoutes);
app.use("/", airtimeRoutes);
app.use("/", adminRoutes);

const httpServer = http.createServer(app);
initSocket(httpServer);

async function start() {
  await connectDB();

  // Non-fatal: connectDB is fire-and-forget, so the DB may not be up yet. Don't
  // let a seed failure take down auth and every other route.
  try {
    await seedExchangeRate();
  } catch (err) {
    console.error("[9th Hour API] Exchange rate seed skipped:", err);
  }

  warnIfPaystackUnconfigured();
  warnIfAgoraUnconfigured();
  warnIfFlutterwaveUnconfigured();
  warnIfResendUnconfigured();

  registerCronJobs();

  // Sentry error handler must be registered after routes, before listen.
  Sentry.setupExpressErrorHandler(app);

  // Central error handler — last in the chain. Sentry captures first, then this
  // formats a clean response (503 for infra/DB failures, 500 otherwise).
  app.use(errorHandler);

  httpServer.listen(PORT, () => {
    console.log(`[9th Hour API] Listening on port ${PORT} (HTTP + Socket.io)`);
  });
}

start().catch((err) => {
  console.error("[9th Hour API] Failed to start:", err);
  process.exit(1);
});
