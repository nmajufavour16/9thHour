import { Router, Request, Response } from "express";
import crypto from "crypto";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { Fellowship } from "../models/Fellowship";
import { User } from "../models/User";

const router = Router();

router.use(firebaseAuth);

// Generates a short random join code (6 uppercase alphanumeric characters).
function generateJoinCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

// POST /fellowships — minister creates a new fellowship
router.post("/", requireRole("minister"), async (req: Request, res: Response) => {
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

// GET /fellowships/:id — get fellowship details
router.get("/:id", async (req: Request, res: Response) => {
  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });
  return res.json(fellowship);
});

// GET /fellowships/:id/members — list members of a fellowship
router.get("/:id/members", async (req: Request, res: Response) => {
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

// POST /fellowships/:id/join — join an existing fellowship via join code
router.post("/:id/join", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { joinCode } = req.body as { joinCode?: string };

  const fellowship = await Fellowship.findById(req.params.id);
  if (!fellowship) return res.status(404).json({ error: "Fellowship not found" });

  if (fellowship.isPrivate) {
    if (!joinCode || joinCode !== fellowship.joinCode) {
      return res.status(403).json({ error: "Invalid join code" });
    }
  }

  const user = await User.findById(uid).select("fellowshipId");
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.fellowshipId?.toString() === fellowship._id.toString()) {
    return res.status(409).json({ error: "Already a member of this fellowship" });
  }

  // Decrement from the old fellowship if leaving one.
  if (user.fellowshipId) {
    await Fellowship.findByIdAndUpdate(user.fellowshipId, { $inc: { memberCount: -1 } });
  }

  await User.findByIdAndUpdate(uid, { fellowshipId: fellowship._id });
  await Fellowship.findByIdAndUpdate(fellowship._id, { $inc: { memberCount: 1 } });

  return res.json({ message: "Joined fellowship", fellowshipId: fellowship._id });
});

// PATCH /fellowships/:id — lead minister updates fellowship details
router.patch("/:id", requireRole("minister"), async (req: Request, res: Response) => {
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
