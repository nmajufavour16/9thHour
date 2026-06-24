import { Router, Request, Response } from "express";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { User } from "../models/User";
import { watDateString, watYesterdayString, watDayStartUtc } from "../utils/watDate";

const router = Router();

router.use(firebaseAuth);

// A 7-day run earns the "Fire Prayer" badge.
const STREAK_BADGE = "fire_prayer";
const STREAK_BADGE_THRESHOLD = 7;

// GET /streak/me — current streak and whether today's check-in is done.
router.get("/streak/me", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const user = await User.findById(uid)
    .select("prayerStreak lastPrayerDate")
    .lean<{ prayerStreak: number; lastPrayerDate: Date | null }>();

  if (!user) return res.status(404).json({ error: "User not found" });

  const checkedInToday = user.lastPrayerDate
    ? watDateString(user.lastPrayerDate) === watDateString()
    : false;

  return res.json({
    prayerStreak: user.prayerStreak,
    lastPrayerDate: user.lastPrayerDate,
    checkedInToday,
  });
});

// POST /streak/checkin — once per WAT day. Increments if yesterday's check-in
// is intact, otherwise starts a fresh streak at 1. A missed day has no penalty.
router.post("/streak/checkin", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;

  const user = await User.findById(uid)
    .select("prayerStreak lastPrayerDate")
    .lean<{ prayerStreak: number; lastPrayerDate: Date | null }>();

  if (!user) return res.status(404).json({ error: "User not found" });

  const today = watDateString();
  const lastDate = user.lastPrayerDate ? watDateString(user.lastPrayerDate) : null;

  // Already done today — report current streak instead of double-counting.
  if (lastDate === today) {
    return res.status(409).json({ error: "Already checked in today", prayerStreak: user.prayerStreak });
  }

  // Continue the run only if the last check-in was yesterday; else restart at 1.
  const newStreak = lastDate === watYesterdayString() ? user.prayerStreak + 1 : 1;
  const now = new Date();

  const update: Record<string, unknown> = {
    $set: { prayerStreak: newStreak, lastPrayerDate: now },
  };
  if (newStreak >= STREAK_BADGE_THRESHOLD) {
    update.$addToSet = { badges: STREAK_BADGE };
  }

  // Guard against a double-tap race: only one request can flip lastPrayerDate
  // past the start of today.
  const updated = await User.findOneAndUpdate(
    {
      _id: uid,
      $or: [{ lastPrayerDate: null }, { lastPrayerDate: { $lt: watDayStartUtc(today) } }],
    },
    update,
    { new: true }
  ).select("prayerStreak lastPrayerDate badges");

  if (!updated) {
    return res.status(409).json({ error: "Already checked in today" });
  }

  return res.json({
    prayerStreak: updated.prayerStreak,
    lastPrayerDate: updated.lastPrayerDate,
    badges: updated.badges,
  });
});

export default router;
