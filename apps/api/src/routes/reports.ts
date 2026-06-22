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
router.post("/reports", async (req: Request, res: Response) => {
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

  const targetObjectId = new Types.ObjectId(targetId);

  // A minister is identified everywhere else by Firebase UID (a string), but
  // Report.targetId is an ObjectId. The only ObjectId that represents a minister
  // is their MinisterProfile._id, so that's what callers must pass here. Confirm
  // it resolves before storing the report — otherwise the suspension below would
  // silently target nothing.
  if (targetType === "minister") {
    const exists = await MinisterProfile.exists({ _id: targetObjectId });
    if (!exists) {
      return res.status(404).json({ error: "No minister found for that targetId (expected MinisterProfile _id)" });
    }
  }

  const report = await Report.create({
    reporterId,
    targetType,
    targetId: targetObjectId,
    category,
    details: details ?? null,
  });

  // Complaint ratio is measured by distinct reporters, not raw report count —
  // one user filing six reports must not trip suspension on its own.
  if (targetType === "minister") {
    const windowStart = new Date(Date.now() - COMPLAINT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const distinctReporters = await Report.distinct("reporterId", {
      targetId: targetObjectId,
      createdAt: { $gte: windowStart },
    });

    if (distinctReporters.length > SUSPENSION_THRESHOLD) {
      await MinisterProfile.findByIdAndUpdate(targetObjectId, {
        isSuspended: true,
        suspendedReason: `Auto-suspended: ${distinctReporters.length} complaints in the last ${COMPLAINT_WINDOW_DAYS} days`,
      });
    }
  }

  return res.status(201).json({ id: report._id });
});

// GET /admin/reports — admin fetches open reports queue (oldest first)
router.get("/admin/reports", requireRole("admin"), async (req: Request, res: Response) => {
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

// GET /admin/reports/:id — admin fetches a single report
router.get("/admin/reports/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  return res.json(report);
});

// PATCH /admin/reports/:id/review — admin marks a report as reviewed, actioned, or dismissed
router.patch("/admin/reports/:id/review", requireRole("admin"), async (req: Request, res: Response) => {
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
