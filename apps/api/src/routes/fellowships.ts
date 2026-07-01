import { Router, Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { firebaseAuth, optionalFirebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { Fellowship } from "../models/Fellowship";
import { User } from "../models/User";

const router = Router();

// Client-correctable join failures; the route maps .status to the response.
class JoinError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Generates a short random join code (6 uppercase alphanumeric characters).
function generateJoinCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

// POST /fellowships — minister creates a new fellowship
router.post("/", firebaseAuth, requireRole("minister"), async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { name, campus, description, isPrivate } = req.body as {
    name: string;
    campus: string;
    description?: string;
    isPrivate?: boolean;
  };

  if (!name || !campus) {
    return res.status(400).json({ error: "name and campus are required" });
  }

  const joinCode = generateJoinCode();

  const fellowship = await Fellowship.create({
    name,
    campus,
    leadMinisterId: uid,
    description: description ?? null,
    isPrivate: isPrivate ?? true,
    joinCode,
    memberCount: 1,
  });

  // Assign the creating minister to this fellowship immediately.
  await User.findByIdAndUpdate(uid, { fellowshipId: fellowship._id });

  return res.status(201).json(fellowship);
});

// GET /fellowships — browse fellowships (public). Most-active first, searchable.
router.get("/", optionalFirebaseAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
  const q = (req.query.q as string | undefined)?.trim();

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [{ name: new RegExp(q, "i") }, { campus: new RegExp(q, "i") }];
  }

  const items = await Fellowship.find(filter)
    .select("name campus description memberCount isPrivate leadMinisterId createdAt")
    .sort({ memberCount: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json({ items, page, limit });
});

// GET /fellowships/:id — get fellowship details
router.get("/:id", optionalFirebaseAuth, async (req: Request, res: Response) => {
  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });
  return res.json(fellowship);
});

// GET /fellowships/:id/members — list members of a fellowship
router.get("/:id/members", optionalFirebaseAuth, async (req: Request, res: Response) => {
  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });

  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));

  const members = await User.find({ fellowshipId: fellowship._id })
    .select("fullName username avatarUrl role isVerified")
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json({ members, page, limit });
});

// POST /fellowships/:id/join — join via join code. The membership swap and both
// member counts run in one transaction so counts can't drift (§6 #4).
router.post("/:id/join", firebaseAuth, async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { joinCode } = req.body as { joinCode?: string };

  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });

  if (fellowship.isPrivate) {
    if (!joinCode || joinCode !== fellowship.joinCode) {
      return res.status(403).json({ error: "Invalid join code" });
    }
  }

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const user = await User.findById(uid).select("fellowshipId").session(dbSession);
      if (!user) throw new JoinError(404, "User not found");
      if (user.fellowshipId?.toString() === fellowship._id.toString()) {
        throw new JoinError(409, "Already a member of this fellowship");
      }
      if (user.fellowshipId) {
        await Fellowship.findByIdAndUpdate(
          user.fellowshipId,
          { $inc: { memberCount: -1 } },
          { session: dbSession }
        );
      }
      await User.findByIdAndUpdate(uid, { fellowshipId: fellowship._id }, { session: dbSession });
      await Fellowship.findByIdAndUpdate(
        fellowship._id,
        { $inc: { memberCount: 1 } },
        { session: dbSession }
      );
    });
    return res.json({ message: "Joined fellowship", fellowshipId: fellowship._id });
  } catch (err) {
    if (err instanceof JoinError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  } finally {
    await dbSession.endSession();
  }
});

// PATCH /fellowships/:id — lead minister updates fellowship details
router.patch("/:id", firebaseAuth, requireRole("minister"), async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;

  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });

  if (fellowship.leadMinisterId !== uid) {
    return res.status(403).json({ error: "Only the lead minister can edit this fellowship" });
  }

  const { name, campus, description, isPrivate } = req.body as {
    name?: string;
    campus?: string;
    description?: string;
    isPrivate?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (campus !== undefined) updates.campus = campus;
  if (description !== undefined) updates.description = description;
  if (isPrivate !== undefined) updates.isPrivate = isPrivate;

  const updated = await Fellowship.findByIdAndUpdate(fellowship._id, updates, { new: true });
  return res.json(updated);
});

export default router;
