import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    _id: { type: String, required: true }, // Firebase UID
    fullName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    avatarUrl: { type: String, default: null },

    // Account type only — minister verification tier lives in MinisterProfile
    role: {
      type: String,
      enum: ["believer", "minister", "admin"],
      default: "believer",
    },

    fellowshipId: { type: Schema.Types.ObjectId, ref: "Fellowship", default: null },
    prayerStreak: { type: Number, default: 0 },
    lastPrayerDate: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },

    // Earned titles (e.g. "fire_prayer", "bible_scholar"). No points system.
    badges: { type: [String], default: [] },

    // Profile + preferences, managed from Settings.
    bio: { type: String, default: "", maxlength: 300 },
    notificationPrefs: {
      prayerResponses: { type: Boolean, default: true },
      liveSessions: { type: Boolean, default: true },
      fellowshipActivity: { type: Boolean, default: true },
    },
    privacy: {
      anonymousPrayerDefault: { type: Boolean, default: false },
      profileVisibility: {
        type: String,
        enum: ["public", "fellowship", "private"],
        default: "fellowship",
      },
    },
    // Set when the user requests account deletion — a request flag, never a hard delete.
    deletionRequestedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
