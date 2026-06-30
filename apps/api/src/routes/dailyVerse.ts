import { Router, Request, Response } from "express";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { DailyVerse } from "../models/DailyVerse";
import { watDateString } from "../lib/watDate";

const router = Router();

router.use(firebaseAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// POST /admin/daily-verse — content team curates a verse for a given date.
// Upserts so an admin can correct a day's entry before it publishes.
router.post("/admin/daily-verse", requireRole("admin"), async (req: Request, res: Response) => {
  const {
    publishDate,
    reference,
    text,
    devotionalContext,
    quizQuestion,
    quizOptions,
    quizCorrectAnswerIndex,
  } = req.body as {
    publishDate: string;
    reference: string;
    text: string;
    devotionalContext: string;
    quizQuestion?: string;
    quizOptions?: string[];
    quizCorrectAnswerIndex?: number;
  };

  if (!publishDate || !DATE_RE.test(publishDate)) {
    return res.status(400).json({ error: "publishDate must be YYYY-MM-DD" });
  }
  if (!reference || !text || !devotionalContext) {
    return res.status(400).json({ error: "reference, text, and devotionalContext are required" });
  }

  const hasQuiz =
    quizQuestion !== undefined ||
    quizOptions !== undefined ||
    quizCorrectAnswerIndex !== undefined;

  if (hasQuiz) {
    if (
      !quizQuestion ||
      !Array.isArray(quizOptions) ||
      quizOptions.length < 2 ||
      typeof quizCorrectAnswerIndex !== "number" ||
      quizCorrectAnswerIndex < 0 ||
      quizCorrectAnswerIndex >= quizOptions.length
    ) {
      return res.status(400).json({
        error: "A quiz needs a question, 2+ options, and a valid quizCorrectAnswerIndex",
      });
    }
  }

  const verse = await DailyVerse.findOneAndUpdate(
    { publishDate },
    {
      publishDate,
      reference,
      text,
      devotionalContext,
      quizQuestion: hasQuiz ? quizQuestion : null,
      quizOptions: hasQuiz ? quizOptions : [],
      quizCorrectAnswerIndex: hasQuiz ? quizCorrectAnswerIndex : null,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(201).json(verse);
});

// GET /admin/daily-verse — admin lists recent entries (includes quiz answers).
router.get("/admin/daily-verse", requireRole("admin"), async (req: Request, res: Response) => {
  const limit = Math.min(60, parseInt((req.query.limit as string) ?? "30", 10));
  const verses = await DailyVerse.find().sort({ publishDate: -1 }).limit(limit).lean();
  return res.json(verses);
});

// GET /daily-verse/today — today's verse for any signed-in user.
// The quiz correct answer is never sent to the client here.
router.get("/daily-verse/today", async (_req: Request, res: Response) => {
  const today = watDateString();
  const verse = await DailyVerse.findOne({ publishDate: today })
    .select("-quizCorrectAnswerIndex")
    .lean();

  if (!verse) return res.status(404).json({ error: "No verse published for today yet" });
  return res.json(verse);
});

export default router;
