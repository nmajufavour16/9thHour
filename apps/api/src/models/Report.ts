import { Schema, model, models, Types } from "mongoose";

const reportSchema = new Schema(
  {
    reporterId: { type: String, ref: "User", required: true },
    targetType: {
      type: String,
      enum: ["minister", "testimony", "prayer_request", "feed_post", "live_session"],
      required: true,
    },
    targetId: { type: Types.ObjectId, required: true },
    category: {
      type: String,
      enum: ["fraud", "false_doctrine", "harassment", "inappropriate_content"],
      required: true,
    },
    details: { type: String, default: null },
    status: {
      type: String,
      enum: ["open", "reviewed", "actioned", "dismissed"],
      default: "open",
    },
    reviewedByAdminId: { type: String, ref: "User", default: null },
  },
  { timestamps: true }
);

reportSchema.index({ targetId: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: 1 });

export const Report = models.Report || model("Report", reportSchema);
