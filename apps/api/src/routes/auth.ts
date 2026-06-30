import { Router, Request, Response } from "express";
import { adminAuth } from "../lib/firebase";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { User } from "../models/User";
import { MinisterProfile } from "../models/MinisterProfile";
import { Wallet } from "../models/Wallet";
import mongoose from "mongoose";

const router = Router();

// Derives a URL-safe slug from ministry name, appending a short uid suffix
// to guarantee uniqueness without a DB round-trip on every registration.
function buildSlug(ministryName: string, uid: string): string {
  const base = ministryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${uid.slice(-6)}`;
}

router.post("/sync", async (req: Request, res: Response) => {
  const { idToken, fullName, username, role, ministryName, churchName } = req.body as {
    idToken: string;
    fullName: string;
    username: string;
    role?: "believer" | "minister";
    ministryName?: string;
    churchName?: string;
  };

  if (!idToken || !fullName || !username) {
    return res.status(400).json({ error: "idToken, fullName, and username are required" });
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    // Most common cause: FIREBASE_ADMIN_PRIVATE_KEY has literal \n instead of real newlines.
    // The replace(/\\n/g, "\n") in config/firebase.ts handles this — if you see
    // "invalid_grant" or "PEM_read_bio" errors here, the key in .env is malformed.
    console.error("[/auth/sync] verifyIdToken failed:", err);
    return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
  }

  const { uid, email } = decoded;

  if (!email) {
    return res.status(400).json({ error: "Firebase account has no email address" });
  }

  const isMinister = role === "minister";

  if (isMinister && (!ministryName || !churchName)) {
    return res
      .status(400)
      .json({ error: "ministryName and churchName are required for minister registration" });
  }

  const session = await mongoose.startSession();

  try {
    let isNewUser = false;

    await session.withTransaction(async () => {
      // Idempotent — bail early if the user already synced.
      const existing = await User.findById(uid).session(session);
      if (existing) {
        return;
      }

      isNewUser = true;

      await User.create(
        [
          {
            _id: uid,
            fullName,
            username,
            email,
            role: isMinister ? "minister" : "believer",
          },
        ],
        { session }
      );

      await Wallet.create(
        [
          {
            userId: uid,
            balance: 0,
            pendingWithdrawalBalance: 0,
          },
        ],
        { session }
      );

      if (isMinister) {
        // Tier 1 (Community Leader) is self-declared and requires no documents.
        await MinisterProfile.create(
          [
            {
              userId: uid,
              ministryName: ministryName!,
              slug: buildSlug(ministryName!, uid),
              churchName: churchName!,
              tier: 1,
              badge: "gray",
            },
          ],
          { session }
        );
      }
    });

    return res.status(200).json({
      uid,
      role: isMinister ? "minister" : "believer",
      isNewUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("duplicate key") || message.includes("E11000")) {
      return res.status(409).json({ error: "Username or email is already taken" });
    }
    // Log the full object so the stack trace appears in the terminal.
    console.error("[/auth/sync] Unhandled error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.endSession();
  }
});

// GET /auth/me — caller's profile + role (for admin gating on the client)
router.get("/me", firebaseAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.firebaseUid)
    .select("fullName username email role fellowshipId avatarUrl")
    .lean();

  if (!user) {
    return res.status(404).json({ error: "User not found — call /auth/sync first" });
  }

  return res.json(user);
});

export default router;
