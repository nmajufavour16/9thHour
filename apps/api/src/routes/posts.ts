import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { Post } from "../models/Post";
import { User } from "../models/User";

const router = Router();

router.use(firebaseAuth);

const POST_TYPES = ["announcement", "testimony", "prayer_point"] as const;

interface PostDoc {
  _id: Types.ObjectId;
  authorId: string;
  fellowshipId: Types.ObjectId;
  type: string;
  body: string;
  mediaUrl: string | null;
  seedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthorSummary {
  _id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

async function loadUserFellowship(req: Request, res: Response) {
  const user = await User.findById(req.firebaseUid)
    .select("fellowshipId")
    .lean<{ fellowshipId: Types.ObjectId | null }>();

  if (!user?.fellowshipId) {
    res.status(400).json({ error: "Join a fellowship before using the feed" });
    return null;
  }

  return user.fellowshipId;
}

async function loadPost(req: Request, res: Response) {
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid post id" });
    return null;
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return null;
  }

  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return null;

  if (!post.fellowshipId.equals(fellowshipId)) {
    res.status(403).json({ error: "This post is not in your fellowship" });
    return null;
  }

  return post;
}

function serializePost(post: PostDoc, author?: AuthorSummary | null) {
  return {
    _id: post._id.toString(),
    authorId: post.authorId,
    fellowshipId: post.fellowshipId.toString(),
    type: post.type,
    body: post.body,
    mediaUrl: post.mediaUrl,
    seedCount: post.seedCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: author ?? null,
  };
}

// POST /posts
router.post("/posts", async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return;

  const { body, type, mediaUrl } = req.body as {
    body?: string;
    type?: string;
    mediaUrl?: string;
  };

  if (!body?.trim()) {
    return res.status(400).json({ error: "body is required" });
  }
  if (!type || !POST_TYPES.includes(type as (typeof POST_TYPES)[number])) {
    return res.status(400).json({ error: `type must be one of: ${POST_TYPES.join(", ")}` });
  }

  const post = await Post.create({
    authorId: uid,
    fellowshipId,
    type,
    body: body.trim(),
    mediaUrl: mediaUrl?.trim() || null,
  });

  const author = await User.findById(uid)
    .select("fullName username avatarUrl")
    .lean<AuthorSummary>();

  return res.status(201).json(serializePost(post, author));
});

// GET /posts — chronological feed, newest first; cursor = last post _id
router.get("/posts", async (req: Request, res: Response) => {
  const fellowshipId = await loadUserFellowship(req, res);
  if (!fellowshipId) return;

  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
  const cursor = req.query.cursor as string | undefined;

  const filter: Record<string, unknown> = { fellowshipId };

  if (cursor && Types.ObjectId.isValid(cursor)) {
    const cursorPost = await Post.findById(cursor).select("createdAt").lean<{ createdAt: Date }>();
    if (cursorPost) {
      filter.createdAt = { $lt: cursorPost.createdAt };
    }
  }

  const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(limit).lean<PostDoc[]>();

  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("fullName username avatarUrl")
    .lean<AuthorSummary[]>();
  const authorById = new Map(authors.map((a) => [a._id, a]));

  const items = posts.map((p) => serializePost(p, authorById.get(p.authorId) ?? null));
  const nextCursor = items.length === limit ? items[items.length - 1]._id : null;

  return res.json({ items, nextCursor });
});

// GET /posts/:id
router.get("/posts/:id", async (req: Request, res: Response) => {
  const post = await loadPost(req, res);
  if (!post) return;

  const author = await User.findById(post.authorId)
    .select("fullName username avatarUrl")
    .lean<AuthorSummary>();

  return res.json(serializePost(post, author));
});

// PATCH /posts/:id
router.patch("/posts/:id", async (req: Request, res: Response) => {
  const post = await loadPost(req, res);
  if (!post) return;

  const isAuthor = post.authorId === req.firebaseUid;
  const isAdmin = req.userRole === "admin";
  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: "Only the author can edit this post" });
  }

  const { body, mediaUrl } = req.body as { body?: string; mediaUrl?: string | null };

  if (body !== undefined) {
    if (!body.trim()) {
      return res.status(400).json({ error: "body cannot be empty" });
    }
    post.body = body.trim();
  }
  if (mediaUrl !== undefined) {
    post.mediaUrl = mediaUrl?.trim() || null;
  }

  await post.save();

  const author = await User.findById(post.authorId)
    .select("fullName username avatarUrl")
    .lean<AuthorSummary>();

  return res.json(serializePost(post, author));
});

// DELETE /posts/:id
router.delete("/posts/:id", async (req: Request, res: Response) => {
  const post = await loadPost(req, res);
  if (!post) return;

  const isAuthor = post.authorId === req.firebaseUid;
  const isAdmin = req.userRole === "admin";

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: "Only the author can delete this post" });
  }

  await post.deleteOne();
  return res.json({ deleted: true });
});

export default router;
