import { Router, Request, Response } from "express";
import crypto from "crypto";
import { Types } from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { LiveSession } from "../models/LiveSession";
import { Attendance } from "../models/Attendance";
import { Fellowship } from "../models/Fellowship";
import { User } from "../models/User";

const router = Router();

router.use(firebaseAuth);

const CATEGORIES = ["prayer", "worship", "sermon", "counseling"] as const;

function isValidId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

// Loads a session by :id, 404s if missing. Returns null after responding.
async function loadSession(req: Request, res: Response) {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ error: "Invalid session id" });
    return null;
  }
  const session = await LiveSession.findById(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return null;
  }
  return session;
}

// POST /sessions — minister schedules (or immediately opens) a session.
router.post("/sessions", requireRole("minister"), async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { title, category, scheduledAt } = req.body as {
    title?: string;
    category?: string;
    scheduledAt?: string;
  };

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!category || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(", ")}` });
  }

  const when = scheduledAt ? new Date(scheduledAt) : new Date();
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ error: "scheduledAt is not a valid date" });
  }

  const session = await LiveSession.create({
    ministerId: uid,
    title: title.trim(),
    category,
    agoraChannelName: `sess_${crypto.randomBytes(8).toString("hex")}`,
    scheduledAt: when,
    status: "scheduled",
  });

  return res.status(201).json(session);
});

// GET /sessions — browse live and upcoming sessions, soonest first.
router.get("/sessions", async (req: Request, res: Response) => {
  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
  const sessions = await LiveSession.find({ status: { $in: ["live", "scheduled"] } })
    .sort({ status: 1, scheduledAt: 1 })
    .limit(limit)
    .lean();
  return res.json(sessions);
});

// GET /sessions/:id
router.get("/sessions/:id", async (req: Request, res: Response) => {
  const session = await loadSession(req, res);
  if (!session) return;
  return res.json(session);
});

// POST /sessions/:id/start — owner takes the session live.
router.post("/sessions/:id/start", requireRole("minister"), async (req: Request, res: Response) => {
  const session = await loadSession(req, res);
  if (!session) return;
  if (session.ministerId !== req.firebaseUid) {
    return res.status(403).json({ error: "Only the host can start this session" });
  }
  if (session.status === "ended" || session.status === "cancelled") {
    return res.status(409).json({ error: `Session is ${session.status}` });
  }

  session.status = "live";
  session.startedAt = session.startedAt ?? new Date();
  await session.save();
  return res.json(session);
});

// POST /sessions/:id/end — owner ends the session; close any open attendance.
router.post("/sessions/:id/end", requireRole("minister"), async (req: Request, res: Response) => {
  const session = await loadSession(req, res);
  if (!session) return;
  if (session.ministerId !== req.firebaseUid) {
    return res.status(403).json({ error: "Only the host can end this session" });
  }
  if (session.status === "ended") {
    return res.status(409).json({ error: "Session already ended" });
  }

  const now = new Date();

  // Anyone still "present" never sent a leave (tab closed, disconnect, etc.),
  // so close their record here using a pipeline update that computes each
  // viewer's duration from their own joinedAt.
  await Attendance.updateMany({ sessionId: session._id, leftAt: null }, [
    {
      $set: {
        leftAt: now,
        durationSeconds: {
          $max: [0, { $round: [{ $divide: [{ $subtract: [now, "$joinedAt"] }, 1000] }, 0] }],
        },
      },
    },
  ]);

  session.status = "ended";
  session.endedAt = now;
  session.viewerCount = 0;
  await session.save();
  return res.json(session);
});

// POST /sessions/:id/attendance/join — record arrival, bump viewer count once.
router.post("/sessions/:id/attendance/join", async (req: Request, res: Response) => {
  const session = await loadSession(req, res);
  if (!session) return;
  const uid = req.firebaseUid!;

  // First join inserts the record; rejoining is a no-op thanks to the unique
  // index, so the viewer count only moves on the genuine first arrival.
  const result = await Attendance.updateOne(
    { sessionId: session._id, userId: uid },
    { $setOnInsert: { sessionId: session._id, userId: uid, joinedAt: new Date() } },
    { upsert: true }
  );

  if (result.upsertedCount && result.upsertedCount > 0) {
    await LiveSession.findByIdAndUpdate(session._id, { $inc: { viewerCount: 1 } });
  }

  return res.json({ joined: true });
});

// POST /sessions/:id/attendance/leave — stamp departure and duration.
router.post("/sessions/:id/attendance/leave", async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Invalid session id" });
  }
  const uid = req.firebaseUid!;
  const sessionId = new Types.ObjectId(req.params.id);

  // Idempotent: no record or an already-closed one just returns success.
  const attendance = await Attendance.findOne({ sessionId, userId: uid });
  if (!attendance || attendance.leftAt) {
    return res.json({ left: true });
  }

  const now = new Date();
  attendance.leftAt = now;
  attendance.durationSeconds = Math.max(
    0,
    Math.round((now.getTime() - attendance.joinedAt.getTime()) / 1000)
  );
  await attendance.save();

  // Guarded decrement so a double-leave can't push the count negative.
  await LiveSession.findOneAndUpdate(
    { _id: sessionId, viewerCount: { $gt: 0 } },
    { $inc: { viewerCount: -1 } }
  );

  return res.json({ left: true, durationSeconds: attendance.durationSeconds });
});

// GET /sessions/:id/missed — fellowship members who never joined this session.
router.get("/sessions/:id/missed", requireRole("minister"), async (req: Request, res: Response) => {
  const session = await loadSession(req, res);
  if (!session) return;
  if (session.ministerId !== req.firebaseUid) {
    return res.status(403).json({ error: "Only the host can view attendance" });
  }

  const fellowship = await Fellowship.findOne({ leadMinisterId: req.firebaseUid }).select("_id");
  if (!fellowship) {
    return res.status(404).json({ error: "You do not lead a fellowship" });
  }

  // "Missed" = fellowship members with no attendance row for this session.
  const attendeeIds = await Attendance.find({ sessionId: session._id }).distinct("userId");
  const missed = await User.find({
    fellowshipId: fellowship._id,
    _id: { $nin: attendeeIds },
  })
    .select("fullName username avatarUrl")
    .lean();

  return res.json({ missedCount: missed.length, members: missed });
});

export default router;
