import { Schema, model, models } from "mongoose";

const ministerProfileSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true, unique: true }, // Firebase UID

    ministryName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    churchName: { type: String, required: true },
    churchAddress: { type: String, default: null },
    hideAddress: { type: Boolean, default: false },
    denomination: { type: String, default: "Independent" },
    bio: { type: String, default: null },
    serviceSchedule: { type: String, default: null },

    tier: { type: Number, enum: [1, 2, 3], default: 1 },
    badge: { type: String, enum: ["gray", "blue", "gold"], default: "gray" },
    verifiedAt: { type: Date, default: null },
    verificationExpiresAt: { type: Date, default: null },
    isOnProbation: { type: Boolean, default: false },
    probationEndsAt: { type: Date, default: null },
    maxOfferingPerSession: { type: Number, default: null },
    maxWithdrawableDuringProbation: { type: Number, default: null },

    complaintCount30Days: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },

    // select: false — never returned in public API responses
    phoneNumber: { type: String, default: null, select: false },
    governmentIdType: { type: String, default: null, select: false },
    governmentIdNumber: { type: String, default: null, select: false },

    verificationPath: {
      type: String,
      enum: ["standard", "community"],
      default: "standard",
    },
    vouchCount: { type: Number, default: 0 },
    voucherUserIds: [{ type: String, ref: "User" }],

    canAcceptOfferings: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: null },
  },
  { timestamps: true }
);

ministerProfileSchema.index({ tier: 1, badge: 1 });
// slug unique index is declared inline on the field above — no duplicate needed

export const MinisterProfile =
  models.MinisterProfile || model("MinisterProfile", ministerProfileSchema);
