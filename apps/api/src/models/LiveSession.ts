import { Schema, model, models } from "mongoose";

// Model only — live session endpoints belong to a later phase. Defined now so
// in-session offerings can increment totalOfferingsReceived atomically.
const liveSessionSchema = new Schema(
  {
    ministerId: { type: String, ref: "User", required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["prayer", "worship", "sermon", "counseling"],
      required: true,
    },
    agoraChannelName: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    scheduledAt: { type: Date, required: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    viewerCount: { type: Number, default: 0 },
    totalOfferingsReceived: { type: Number, default: 0 },
    audioArchiveUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export const LiveSession = models.LiveSession || model("LiveSession", liveSessionSchema);
