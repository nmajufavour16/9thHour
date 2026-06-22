import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";
import { internalAuthGuard } from "./middleware/internalAuth";
import authRoutes from "./routes/auth";
import verificationRoutes from "./routes/verification";
import fellowshipRoutes from "./routes/fellowships";
import reportRoutes from "./routes/reports";

// Dedicated Express API. Only the Next.js BFF proxy calls this directly —
// never the browser. Business logic and the financial engine live here.

const app = express();
const PORT = process.env.PORT || 4000;

// The BFF proxy forwards X-Forwarded-For — tell Express to trust it
// so express-rate-limit doesn't throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

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
app.use("/fellowships", fellowshipRoutes);
// Mounted at root: each router spells out its full paths so admin actions live
// under /admin/* while the minister/user-facing routes keep their own prefix.
app.use("/", verificationRoutes);
app.use("/", reportRoutes);

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
