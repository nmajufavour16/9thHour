import { Schema, model, models } from "mongoose";

const verificationRequestSchema = new Schema(
  {
    ministerId: { type: String, ref: "User", required: true },
    requestedTier: { type: Number, enum: [2, 3], required: true },

    fullName: { type: String, required: true },
    churchName: { type: String, required: true },
    churchAddress: { type: String, required: true },
    denomination: { type: String, default: "Independent" },
    phoneNumber: { type: String, required: true, select: false },

    idType: {
      type: String,
      enum: ["national_id", "drivers_license", "voters_card", "passport"],
      required: true,
    },
    idImageUrl: { type: String, required: true, select: false },
    selfieImageUrl: { type: String, required: true, select: false },

    // Tier 3 additional checks
    bankAccountName: { type: String, default: null },
    bankAccountNumber: { type: String, default: null, select: false },
    testDepositVerified: { type: Boolean, default: false },
    socialMediaProofUrl: { type: String, default: null },
    videoInterviewUrl: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected"],
      default: "pending",
    },
    reviewedByAdminId: { type: String, ref: "User", default: null },
    rejectionReason: { type: String, default: null },
    reviewNotes: { type: String, default: null },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ status: 1, createdAt: 1 });

export const VerificationRequest =
  models.VerificationRequest || model("VerificationRequest", verificationRequestSchema);
