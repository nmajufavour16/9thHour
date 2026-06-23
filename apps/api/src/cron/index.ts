import cron from "node-cron";
import { DailyVerse } from "../models/DailyVerse";
import { User } from "../models/User";
import { broadcastToAllUsers } from "../config/fcm";
import { watDateString, watYesterdayString, watDayStartUtc } from "../utils/watDate";

const WAT_TZ = "Africa/Lagos";

// 5:30 AM WAT: push today's verse to every subscribed device.
async function runDailyVerseBroadcast() {
  const today = watDateString();
  const verse = await DailyVerse.findOne({ publishDate: today }).lean<{
    reference: string;
  }>();

  if (!verse) {
    console.warn(`[cron] Daily verse broadcast skipped — no verse for ${today}`);
    return;
  }

  await broadcastToAllUsers("Verse of the Day", verse.reference, {
    type: "daily_verse",
    publishDate: today,
  });
  console.log(`[cron] Daily verse broadcast sent for ${today}`);
}

// Midnight WAT: anyone who didn't check in yesterday loses their streak.
// No penalty of any kind (PRD §16 item 11).
async function runStreakResetSweep() {
  const cutoff = watDayStartUtc(watYesterdayString());
  const result = await User.updateMany(
    {
      prayerStreak: { $gt: 0 },
      $or: [{ lastPrayerDate: null }, { lastPrayerDate: { $lt: cutoff } }],
    },
    { $set: { prayerStreak: 0 } }
  );
  console.log(`[cron] Streak reset sweep — ${result.modifiedCount} streak(s) reset`);
}

export function registerCronJobs() {
  cron.schedule("30 5 * * *", () => {
    runDailyVerseBroadcast().catch((err) =>
      console.error("[cron] Daily verse broadcast failed:", err)
    );
  }, { timezone: WAT_TZ });

  cron.schedule("0 0 * * *", () => {
    runStreakResetSweep().catch((err) =>
      console.error("[cron] Streak reset sweep failed:", err)
    );
  }, { timezone: WAT_TZ });

  console.log("[cron] Scheduled daily verse broadcast (5:30 WAT) and streak reset (midnight WAT)");
}
