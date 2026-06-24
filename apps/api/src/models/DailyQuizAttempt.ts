import { Schema, model, models, Types } from "mongoose";

// Badges only — there is no points system. The unique compound index enforces
// one attempt per user per verse.
const dailyQuizAttemptSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true },
    dailyVerseId: { type: Types.ObjectId, ref: "DailyVerse", required: true },
    selectedAnswerIndex: { type: Number, required: true },
    wasCorrect: { type: Boolean, required: true },
  },
  { timestamps: true }
);

dailyQuizAttemptSchema.index({ userId: 1, dailyVerseId: 1 }, { unique: true });

export const DailyQuizAttempt =
  models.DailyQuizAttempt || model("DailyQuizAttempt", dailyQuizAttemptSchema);
