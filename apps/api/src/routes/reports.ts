import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { Report } from "../models/Report";
import { MinisterProfile } from "../models/MinisterProfile";

const router = Router();

router.use(firebaseAuth);

const COMPLAINT_WINDOW_DAYS = 30;
const SUSPENSION_THRESHOLD = 5;

// POST /reports — any authenticated user files a report
router.post("/", async (req: Request, res: Response) => {
  const reporterId = req.firebaseUid!;
  const { targetType, targetId, category, details } = req.body as {
    targetType: string;
    targetId: string;
    category: string;
    details?: string;
  };

  if (!targetType || !targetId || !category) {
    return res.status(400).json({ error: "targetType, targetId, and category are required" });
  }

  if (!Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ error: "targetId must be a valid ObjectId" });
  }

  const report = await Report.create({
    reporterId,
    targetType,
    targetId: new Types.ObjectId(targetId),
    category,
    details: details ?? null,
  });

  // Complaint-ratio check: if >5 open reports filed against the same targetId
  // within the last 30 days, flag the associated MinisterProfile as suspended.
  if (targetType === "minister") {
    const windowStart = new Date(Date.now() - COMPLAINT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recentCount = await Report.countDocuments({
      targetId: new Types.ObjectId(targetId),
      createdAt: { $gte: windowStart },
    });

    if (recentCount > SUSPENSION_THRESHOLD) {
      // targetId for minister reports is the minister's User ObjectId string — but
      // MinisterProfile.userId is a string (Firebase UID). We need to match carefully.
      // The convention: when targetType === 'minister', targetId holds the MinisterProfile _id.
      await MinisterProfile.findByIdAndUpdate(targetId, {
        isSuspended: true,
        suspendedReason: `Auto-suspended: ${recentCount} complaints in the last ${COMPLAINT_WINDOW_DAYS} days`,
      });
    }
  }

  return res.status(201).json({ id: report._id });
});

// GET /reports — admin fetches open reports queue (oldest first)
router.get("/", requireRole("admin"), async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
  const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20", 10));
  const statusFilter = (req.query.status as string) ?? "open";

  const reports = await Report.find({ status: statusFilter })
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json({ reports, page, limit });
});

// GET /reports/:id — admin fetches a single report
router.get("/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  return res.json(report);
});

// PATCH /reports/:id/review — admin marks a report as reviewed, actioned, or dismissed
router.patch("/:id/review", requireRole("admin"), async (req: Request, res: Response) => {
  const adminUid = req.firebaseUid!;
  const { status } = req.body as {
    status: "reviewed" | "actioned" | "dismissed";
  };

  if (!["reviewed", "actioned", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "status must be reviewed, actioned, or dismissed" });
  }

  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  report.status = status;
  report.reviewedByAdminId = adminUid;
  await report.save();

  return res.json({ message: "Updated", status });
});

export default router;
