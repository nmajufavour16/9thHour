import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { ExchangeRateConfig } from "../models/ExchangeRateConfig";
import { Report } from "../models/Report";
import { MinisterProfile } from "../models/MinisterProfile";
import { VerificationRequest } from "../models/VerificationRequest";
import { User } from "../models/User";

const router = Router();

router.use(firebaseAuth, requireRole("admin"));

const COMPLAINT_WINDOW_DAYS = 30;

interface RateDoc {
  coinsPerNaira: number;
  effectiveFrom: Date;
  setByAdminId: string;
}

interface MinisterProfileLean {
  _id: mongoose.Types.ObjectId;
  userId: string;
  ministryName: string;
  isSuspended: boolean;
  complaintCount30Days: number;
}

// GET /admin/overview — dashboard stats + ministers flagged by complaint ratio
router.get("/admin/overview", async (_req: Request, res: Response) => {
  const windowStart = new Date(Date.now() - COMPLAINT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [openReports, pendingVerifications, activeRate, complaintAgg] = await Promise.all([
    Report.countDocuments({ status: "open" }),
    VerificationRequest.countDocuments({ status: { $in: ["pending", "in_review"] } }),
    ExchangeRateConfig.findOne({ isActive: true }).lean<RateDoc | null>(),
    Report.aggregate<{ _id: mongoose.Types.ObjectId; reporterCount: number }>([
      { $match: { targetType: "minister", createdAt: { $gte: windowStart } } },
      { $group: { _id: "$targetId", reporters: { $addToSet: "$reporterId" } } },
      { $project: { reporterCount: { $size: "$reporters" } } },
      { $match: { reporterCount: { $gte: 3 } } },
      { $sort: { reporterCount: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const profileIds = complaintAgg.map((c) => c._id);
  const profiles = await MinisterProfile.find({ _id: { $in: profileIds } })
    .select("userId ministryName isSuspended complaintCount30Days")
    .lean<MinisterProfileLean[]>();
  const profileById = new Map(profiles.map((p) => [p._id.toString(), p]));

  const ministerUserIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: ministerUserIds } })
    .select("fullName username")
    .lean();
  const userById = new Map(users.map((u) => [u._id, u]));

  const flaggedMinisters = complaintAgg.map((row) => {
    const profile = profileById.get(row._id.toString());
    const user = profile ? userById.get(profile.userId) : null;
    return {
      ministerProfileId: row._id.toString(),
      ministryName: profile?.ministryName ?? "Unknown",
      ministerName: user?.fullName ?? "Unknown",
      distinctReporters: row.reporterCount,
      isSuspended: profile?.isSuspended ?? false,
    };
  });

  return res.json({
    openReports,
    pendingVerifications,
    exchangeRate: activeRate
      ? {
          coinsPerNaira: activeRate.coinsPerNaira,
          effectiveFrom: activeRate.effectiveFrom,
          setByAdminId: activeRate.setByAdminId,
        }
      : null,
    flaggedMinisters,
    complaintWindowDays: COMPLAINT_WINDOW_DAYS,
  });
});

// GET /admin/exchange-rate — current active rate + recent history
router.get("/admin/exchange-rate", async (_req: Request, res: Response) => {
  const [active, history] = await Promise.all([
    ExchangeRateConfig.findOne({ isActive: true }).lean<RateDoc | null>(),
    ExchangeRateConfig.find().sort({ effectiveFrom: -1 }).limit(10).lean<RateDoc[]>(),
  ]);

  return res.json({ active, history });
});

// PUT /admin/exchange-rate — new rate applies only to future purchases
router.put("/admin/exchange-rate", async (req: Request, res: Response) => {
  const adminId = req.firebaseUid!;
  const { coinsPerNaira } = req.body as { coinsPerNaira?: number };

  if (typeof coinsPerNaira !== "number" || coinsPerNaira <= 0 || coinsPerNaira > 2) {
    return res.status(400).json({ error: "coinsPerNaira must be a number between 0 and 2" });
  }

  const session = await mongoose.startSession();
  let created: { coinsPerNaira: number; effectiveFrom: Date } | null = null;

  try {
    await session.withTransaction(async () => {
      await ExchangeRateConfig.updateMany({ isActive: true }, { $set: { isActive: false } }, { session });

      const [doc] = await ExchangeRateConfig.create(
        [
          {
            coinsPerNaira,
            isActive: true,
            setByAdminId: adminId,
            effectiveFrom: new Date(),
          },
        ],
        { session }
      );

      created = { coinsPerNaira: doc.coinsPerNaira, effectiveFrom: doc.effectiveFrom };
    });
  } finally {
    await session.endSession();
  }

  return res.json({
    message: "Exchange rate updated — applies to future purchases only",
    active: created,
  });
});

export default router;
