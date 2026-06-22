import { Router, Request, Response } from "express";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import { VerificationRequest } from "../models/VerificationRequest";
import { MinisterProfile } from "../models/MinisterProfile";
import { User } from "../models/User";

const router = Router();

// All verification routes require a verified Firebase session.
router.use(firebaseAuth);

// POST /verification/submit
// Minister submits ID + selfie URLs for Tier 2 or Tier 3 review.
// Image upload itself happens client-side to Firebase Storage; we receive the resulting URLs.
router.post("/verification/submit", requireRole("minister"), async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;

  const {
    requestedTier,
    fullName,
    churchName,
    churchAddress,
    denomination,
    phoneNumber,
    idType,
    idImageUrl,
    selfieImageUrl,
    // Tier 3 only
    bankAccountName,
    bankAccountNumber,
    socialMediaProofUrl,
    videoInterviewUrl,
  } = req.body as {
    requestedTier: number;
    fullName: string;
    churchName: string;
    churchAddress: string;
    denomination?: string;
    phoneNumber: string;
    idType: string;
    idImageUrl: string;
    selfieImageUrl: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    socialMediaProofUrl?: string;
    videoInterviewUrl?: string;
  };

  if (!requestedTier || ![2, 3].includes(requestedTier)) {
    return res.status(400).json({ error: "requestedTier must be 2 or 3" });
  }
  if (!fullName || !churchName || !churchAddress || !phoneNumber || !idType || !idImageUrl || !selfieImageUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const profile = await MinisterProfile.findOne({ userId: uid });
  if (!profile) {
    return res.status(404).json({ error: "MinisterProfile not found" });
  }

  // Prevent applying for a tier below or equal to the one already held.
  if (requestedTier <= profile.tier) {
    return res.status(409).json({ error: `Already at tier ${profile.tier} or above` });
  }

  // Block if a pending/in-review request already exists for this minister.
  const existing = await VerificationRequest.findOne({
    ministerId: uid,
    status: { $in: ["pending", "in_review"] },
  });
  if (existing) {
    return res.status(409).json({ error: "A verification request is already under review" });
  }

  const verificationRequest = await VerificationRequest.create({
    ministerId: uid,
    requestedTier,
    fullName,
    churchName,
    churchAddress,
    denomination: denomination ?? "Independent",
    phoneNumber,
    idType,
    idImageUrl,
    selfieImageUrl,
    ...(requestedTier === 3 && {
      bankAccountName,
      bankAccountNumber,
      socialMediaProofUrl,
      videoInterviewUrl,
    }),
  });

  return res.status(201).json({ id: verificationRequest._id, status: "pending" });
});

// GET /verification/my-status
// Minister polls their current verification request status.
router.get("/verification/my-status", requireRole("minister"), async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;

  const request = await VerificationRequest.findOne({ ministerId: uid })
    .sort({ createdAt: -1 })
    .select("requestedTier status rejectionReason createdAt updatedAt");

  if (!request) {
    return res.status(404).json({ error: "No verification request found" });
  }

  return res.json(request);
});

// GET /verification/queue — admin sees all pending requests
router.get("/verification/queue", requireRole("admin"), async (req: Request, res: Response) => {
  const requests = await VerificationRequest.find({ status: { $in: ["pending", "in_review"] } })
    .sort({ createdAt: 1 })
    .select("-idImageUrl -selfieImageUrl -phoneNumber -bankAccountNumber");

  return res.json(requests);
});

// GET /verification/:id — admin fetches a single request (includes sensitive fields)
router.get("/verification/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const request = await VerificationRequest.findById(req.params.id)
    .select("+idImageUrl +selfieImageUrl +phoneNumber +bankAccountNumber");

  if (!request) return res.status(404).json({ error: "Not found" });
  return res.json(request);
});

// POST /verification/:id/approve
router.post("/admin/verification/:id/approve", requireRole("admin"), async (req: Request, res: Response) => {
  const adminUid = req.firebaseUid!;
  const { reviewNotes } = req.body as { reviewNotes?: string };

  const request = await VerificationRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: "Not found" });
  if (request.status === "approved") return res.status(409).json({ error: "Already approved" });

  const profile = await MinisterProfile.findOne({ userId: request.ministerId });
  if (!profile) return res.status(404).json({ error: "MinisterProfile not found" });

  const newTier = request.requestedTier as 2 | 3;
  const newBadge = newTier === 2 ? "blue" : "gold";
  const now = new Date();

  // Tier 2 approval always triggers a 30-day probation period per PRD §11.2.
  const isTier2 = newTier === 2;
  const probationEndsAt = isTier2 ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null;

  await MinisterProfile.findOneAndUpdate(
    { userId: request.ministerId },
    {
      tier: newTier,
      badge: newBadge,
      verifiedAt: now,
      verificationExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      canAcceptOfferings: true,
      ...(isTier2 && {
        isOnProbation: true,
        probationEndsAt,
        maxOfferingPerSession: 50000,
        maxWithdrawableDuringProbation: 100000,
      }),
    }
  );

  await User.findByIdAndUpdate(request.ministerId, { isVerified: true });

  request.status = "approved";
  request.reviewedByAdminId = adminUid;
  if (reviewNotes) request.reviewNotes = reviewNotes;
  await request.save();

  return res.json({ message: "Approved", tier: newTier, badge: newBadge });
});

// POST /verification/:id/reject
router.post("/admin/verification/:id/reject", requireRole("admin"), async (req: Request, res: Response) => {
  const adminUid = req.firebaseUid!;
  const { rejectionReason } = req.body as { rejectionReason: string };

  if (!rejectionReason) {
    return res.status(400).json({ error: "rejectionReason is required" });
  }

  const request = await VerificationRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: "Not found" });
  if (request.status === "approved") return res.status(409).json({ error: "Cannot reject an already-approved request" });

  request.status = "rejected";
  request.reviewedByAdminId = adminUid;
  request.rejectionReason = rejectionReason;
  await request.save();

  return res.json({ message: "Rejected" });
});

export default router;
