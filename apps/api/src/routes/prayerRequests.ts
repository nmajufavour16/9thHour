import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { PrayerRequest } from "../models/PrayerRequest";
import { Comment } from "../models/Comment";
import { User } from "../models/User";
import {
  broadcastNewPrayerRequest,
  claimPrayerRequest,
  maskPrayerRequest,
  type PrayerRequestDoc,
} from "../services/prayerDispatch";

const router = Router();

router.use(firebaseAuth);

const REQUEST_TYPES = ["general", "urgent", "vulnerability"] as const;

function viewerContext(req: Request) {
  return { uid: req.firebaseUid!, role: req.userRole! };
}

async function loadUserFellowship(req: Request, res: Response) {
  const user = await User.findById(req.firebaseUid)
    .select("fellowshipId")
    .lean<{ fellowshipId: Types.ObjectId | null }>();

  if (!user?.fellowshipId) {
    res.status(400).json({ error: "Join a fellowship before using prayer requests" });
    return null;
  }

  return user.fellowshipId;
}

async function loadPrayerRequest(req: Request, res: Response) {
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid request id" });
    return null;
  }

  const request = await PrayerRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ error: "Prayer request not found" });
    return null;
  }

  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return null;

  if (!request.fellowshipId.equals(fellowshipId)) {
    res.status(403).json({ error: "This request is not in your fellowship" });
    return null;
  }

  return request;
}

// POST /prayer-requests
router.post("/prayer-requests", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return;

  const { body, type, isAnonymousToPeers } = req.body as {
    body?: string;
    type?: string;
    isAnonymousToPeers?: boolean;
  };

  if (!body?.trim()) {
    return res.status(400).json({ error: "body is required" });
  }
  if (!type || !REQUEST_TYPES.includes(type as (typeof REQUEST_TYPES)[number])) {
    return res.status(400).json({ error: `type must be one of: ${REQUEST_TYPES.join(", ")}` });
  }

  const requester = await User.findById(uid).select("fullName").lean<{ fullName: string }>();
  if (!requester) {
    return res.status(404).json({ error: "User not found" });
  }

  const request = await PrayerRequest.create({
    requesterId: uid,
    fellowshipId,
    body: body.trim(),
    type,
    isAnonymousToPeers: Boolean(isAnonymousToPeers),
  });

  await broadcastNewPrayerRequest(request, requester.fullName);

  return res.status(201).json(maskPrayerRequest(request, viewerContext(req), requester));
});

// GET /prayer-requests — fellowship feed, newest first
router.get("/prayer-requests", async (req: Request, res: Response) => {
  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return;

  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
  const requests = await PrayerRequest.find({ fellowshipId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<PrayerRequestDoc[]>();

  const requesterIds = [...new Set(requests.map((r) => r.requesterId))];
  const requesters = await User.find({ _id: { $in: requesterIds } })
    .select("fullName")
    .lean();
  const nameById = new Map(requesters.map((u) => [u._id, u.fullName]));

  const viewer = viewerContext(req);
  return res.json(
    requests.map((r) =>
      maskPrayerRequest(r, viewer, { fullName: nameById.get(r.requesterId) ?? "Member" })
    )
  );
});

// GET /prayer-requests/:id
router.get("/prayer-requests/:id", async (req: Request, res: Response) => {
  const request = await loadPrayerRequest(req, res);
  if (!request) return;

  const requester = await User.findById(request.requesterId)
    .select("fullName")
    .lean<{ fullName: string }>();

  return res.json(maskPrayerRequest(request, viewerContext(req), requester));
});

// POST /prayer-requests/:id/accept — atomic minister claim
router.post(
  "/prayer-requests/:id/accept",
  requireRole("minister"),
  async (req: Request, res: Response) => {
    const request = await loadPrayerRequest(req, res);
    if (!request) return;

    const result = await claimPrayerRequest(req.params.id, req.firebaseUid!);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    const requester = await User.findById(result.request.requesterId)
      .select("fullName")
      .lean<{ fullName: string }>();

    return res.json(maskPrayerRequest(result.request, viewerContext(req), requester));
  }
);

// POST /prayer-requests/:id/complete — accepting minister marks done
router.post(
  "/prayer-requests/:id/complete",
  requireRole("minister"),
  async (req: Request, res: Response) => {
    const request = await loadPrayerRequest(req, res);
    if (!request) return;

    if (request.status !== "accepted") {
      return res.status(409).json({ error: "Request must be accepted before completing" });
    }
    if (request.acceptedByMinisterId !== req.firebaseUid) {
      return res.status(403).json({ error: "Only the accepting minister can complete this request" });
    }

    request.status = "completed";
    await request.save();

    const requester = await User.findById(request.requesterId)
      .select("fullName")
      .lean<{ fullName: string }>();

    return res.json(maskPrayerRequest(request, viewerContext(req), requester));
  }
);

// GET /prayer-requests/:id/comments
router.get("/prayer-requests/:id/comments", async (req: Request, res: Response) => {
  const request = await loadPrayerRequest(req, res);
  if (!request) return;

  const comments = await Comment.find({ prayerRequestId: request._id })
    .sort({ createdAt: 1 })
    .lean<Array<{ _id: Types.ObjectId; prayerRequestId: Types.ObjectId; authorId: string; body: string; createdAt: Date }>>();

  const authorIds = [...new Set(comments.map((c) => c.authorId))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("fullName username avatarUrl")
    .lean();
  const authorById = new Map(authors.map((a) => [a._id, a]));

  return res.json(
    comments.map((c) => ({
      _id: c._id.toString(),
      prayerRequestId: c.prayerRequestId.toString(),
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: authorById.get(c.authorId) ?? { fullName: "Member", username: "member", avatarUrl: null },
    }))
  );
});

// POST /prayer-requests/:id/comments
router.post("/prayer-requests/:id/comments", async (req: Request, res: Response) => {
  const request = await loadPrayerRequest(req, res);
  if (!request) return;

  const { body } = req.body as { body?: string };
  if (!body?.trim()) {
    return res.status(400).json({ error: "body is required" });
  }
  if (body.trim().length > 500) {
    return res.status(400).json({ error: "Comment must be at most 500 characters" });
  }

  const comment = await Comment.create({
    prayerRequestId: request._id,
    authorId: req.firebaseUid!,
    body: body.trim(),
  });

  const author = await User.findById(req.firebaseUid)
    .select("fullName username avatarUrl")
    .lean();

  return res.status(201).json({
    _id: comment._id.toString(),
    prayerRequestId: comment.prayerRequestId.toString(),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: author ?? { fullName: "Member", username: "member", avatarUrl: null },
  });
});

export default router;
