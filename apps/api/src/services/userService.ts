import { User } from "../models/User";

// Thrown for client-correctable problems (validation, conflicts). Routes map
// .status to the response; anything else bubbles to the global error handler.
export class UserError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "UserError";
    this.status = status;
  }
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const VISIBILITY = ["public", "fellowship", "private"] as const;
const NOTIFY_KEYS = ["prayerResponses", "liveSessions", "fellowshipActivity"] as const;

export interface ProfilePatch {
  fullName?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string;
  notificationPrefs?: Partial<Record<(typeof NOTIFY_KEYS)[number], boolean>>;
  privacy?: Partial<{
    anonymousPrayerDefault: boolean;
    profileVisibility: (typeof VISIBILITY)[number];
  }>;
}

const PROFILE_FIELDS =
  "fullName username email role fellowshipId avatarUrl bio notificationPrefs privacy";

// Validates and applies an allow-listed set of profile/preference changes. Only
// the fields present in the patch are touched (partial update).
export async function updateProfile(uid: string, patch: ProfilePatch) {
  const update: Record<string, unknown> = {};

  if (patch.fullName !== undefined) {
    const v = patch.fullName.trim();
    if (v.length < 2 || v.length > 80) {
      throw new UserError(400, "Full name must be 2–80 characters.");
    }
    update.fullName = v;
  }

  if (patch.username !== undefined) {
    const v = patch.username.trim();
    if (!USERNAME_RE.test(v)) {
      throw new UserError(400, "Username must be 3–20 letters, numbers, or underscores.");
    }
    update.username = v;
  }

  if (patch.avatarUrl !== undefined) {
    update.avatarUrl = patch.avatarUrl ? String(patch.avatarUrl).trim() : null;
  }

  if (patch.bio !== undefined) {
    const v = String(patch.bio);
    if (v.length > 300) {
      throw new UserError(400, "Bio must be 300 characters or fewer.");
    }
    update.bio = v;
  }

  if (patch.notificationPrefs) {
    for (const key of NOTIFY_KEYS) {
      const value = patch.notificationPrefs[key];
      if (typeof value === "boolean") {
        update[`notificationPrefs.${key}`] = value;
      }
    }
  }

  if (patch.privacy) {
    if (typeof patch.privacy.anonymousPrayerDefault === "boolean") {
      update["privacy.anonymousPrayerDefault"] = patch.privacy.anonymousPrayerDefault;
    }
    if (patch.privacy.profileVisibility !== undefined) {
      if (!VISIBILITY.includes(patch.privacy.profileVisibility)) {
        throw new UserError(400, "Invalid profile visibility.");
      }
      update["privacy.profileVisibility"] = patch.privacy.profileVisibility;
    }
  }

  if (Object.keys(update).length === 0) {
    throw new UserError(400, "No valid fields to update.");
  }

  try {
    const user = await User.findByIdAndUpdate(
      uid,
      { $set: update },
      { new: true, runValidators: true }
    )
      .select(PROFILE_FIELDS)
      .lean();

    if (!user) {
      throw new UserError(404, "User not found.");
    }
    return user;
  } catch (err) {
    if (err instanceof UserError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("E11000") || message.includes("duplicate key")) {
      throw new UserError(409, "That username is already taken.");
    }
    throw err;
  }
}

// Flags the account for deletion (pastoral/ops review handles the actual removal).
export async function requestAccountDeletion(uid: string) {
  const user = await User.findByIdAndUpdate(
    uid,
    { $set: { deletionRequestedAt: new Date() } },
    { new: true }
  )
    .select("deletionRequestedAt")
    .lean<{ deletionRequestedAt: Date } | null>();

  if (!user) {
    throw new UserError(404, "User not found.");
  }
  return { deletionRequestedAt: user.deletionRequestedAt };
}
