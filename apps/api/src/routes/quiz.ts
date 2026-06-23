import { Router, Request, Response } from "express";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { DailyVerse } from "../models/DailyVerse";
import { DailyQuizAttempt } from "../models/DailyQuizAttempt";
import { User } from "../models/User";
import { watDateString } from "../utils/watDate";

const router = Router();

router.use(firebaseAuth);

const QUIZ_BADGE = "bible_scholar";

// GET /quiz/today — today's question and options (answer withheld) plus whether
// this user has already attempted it.
router.get("/quiz/today", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const verse = await DailyVerse.findOne({ publishDate: watDateString() }).lean<{
    _id: unknown;
    quizQuestion: string | null;
    quizOptions: string[];
  }>();

  if (!verse || !verse.quizQuestion) {
    return res.status(404).json({ error: "No quiz available today" });
  }

  const attempt = await DailyQuizAttempt.findOne({
    userId: uid,
    dailyVerseId: verse._id,
  }).lean<{ selectedAnswerIndex: number; wasCorrect: boolean }>();

  return res.json({
    question: verse.quizQuestion,
    options: verse.quizOptions,
    attempted: !!attempt,
    yourAnswerIndex: attempt?.selectedAnswerIndex ?? null,
    wasCorrect: attempt?.wasCorrect ?? null,
  });
});

// POST /quiz/attempt — one attempt per user per day, enforced by the unique
// (userId, dailyVerseId) index. A correct answer earns the quiz badge.
router.post("/quiz/attempt", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { selectedAnswerIndex } = req.body as { selectedAnswerIndex?: number };

  if (typeof selectedAnswerIndex !== "number" || selectedAnswerIndex < 0) {
    return res.status(400).json({ error: "selectedAnswerIndex must be a non-negative number" });
  }

  const verse = await DailyVerse.findOne({ publishDate: watDateString() }).lean<{
    _id: unknown;
    quizQuestion: string | null;
    quizOptions: string[];
    quizCorrectAnswerIndex: number | null;
  }>();

  if (!verse || !verse.quizQuestion || verse.quizCorrectAnswerIndex === null) {
    return res.status(404).json({ error: "No quiz available today" });
  }
  if (selectedAnswerIndex >= verse.quizOptions.length) {
    return res.status(400).json({ error: "selectedAnswerIndex out of range" });
  }

  const wasCorrect = selectedAnswerIndex === verse.quizCorrectAnswerIndex;

  try {
    await DailyQuizAttempt.create({
      userId: uid,
      dailyVerseId: verse._id,
      selectedAnswerIndex,
      wasCorrect,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ error: "Already attempted today's quiz" });
    }
    throw err;
  }

  if (wasCorrect) {
    await User.findByIdAndUpdate(uid, { $addToSet: { badges: QUIZ_BADGE } });
  }

  return res.status(201).json({
    wasCorrect,
    correctAnswerIndex: verse.quizCorrectAnswerIndex,
  });
});

export default router;
