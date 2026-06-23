import { Schema, model, models } from "mongoose";

// Curated manually by the content team — no external Bible API anywhere.
// One document per calendar day, keyed by the WAT date string.
const dailyVerseSchema = new Schema(
  {
    publishDate: { type: String, required: true, unique: true }, // YYYY-MM-DD (WAT)
    reference: { type: String, required: true },
    text: { type: String, required: true },
    devotionalContext: { type: String, required: true },
    quizQuestion: { type: String, default: null },
    quizOptions: [{ type: String }],
    quizCorrectAnswerIndex: { type: Number, default: null },
  },
  { timestamps: true }
);

export const DailyVerse = models.DailyVerse || model("DailyVerse", dailyVerseSchema);
