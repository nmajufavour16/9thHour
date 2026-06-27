import { Schema, model, models } from "mongoose";

const prayerRequestSchema = new Schema(
  {
    requesterId: { type: String, ref: "User", required: true },
    fellowshipId: { type: Schema.Types.ObjectId, ref: "Fellowship", required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "urgent", "vulnerability"],
      required: true,
    },
    isAnonymousToPeers: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "accepted", "completed"],
      default: "open",
    },
    acceptedByMinisterId: { type: String, ref: "User", default: null },
    prayedForCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

prayerRequestSchema.index({ status: 1, fellowshipId: 1, createdAt: 1 });

export const PrayerRequest =
  models.PrayerRequest || model("PrayerRequest", prayerRequestSchema);
