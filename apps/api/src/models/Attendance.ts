import { Schema, model, models, Types } from "mongoose";

// One row per (session, user). joinedAt is set on first join; leftAt and
// durationSeconds are filled on leave/disconnect or when the session ends.
const attendanceSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, ref: "LiveSession", required: true },
    userId: { type: String, ref: "User", required: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
attendanceSchema.index({ userId: 1, createdAt: -1 });

export const Attendance = models.Attendance || model("Attendance", attendanceSchema);
