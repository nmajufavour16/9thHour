import { Types } from "mongoose";
import { PrayerRequest } from "../models/PrayerRequest";
import { User } from "../models/User";
import { MinisterProfile } from "../models/MinisterProfile";
import { getIO } from "../lib/socket";
import { notifyFellowshipMinisters, notifyUser } from "./notifications";

export interface PrayerRequestDoc {
  _id: Types.ObjectId;
  fellowshipId: Types.ObjectId;
  body: string;
  type: string;
  status: string;
  isAnonymousToPeers: boolean;
  requesterId: string;
  acceptedByMinisterId: string | null;
  prayedForCount: number;
  createdAt: Date;
}

export interface PrayerRequestPayload {
  _id: string;
  fellowshipId: string;
  body: string;
  type: string;
  status: string;
  isAnonymousToPeers: boolean;
  requesterId: string;
  requesterDisplay: string;
  acceptedByMinisterId: string | null;
  prayedForCount: number;
  createdAt: string;
}

// Ministers always see the real requester; peers see a placeholder when anonymous.
export function maskPrayerRequest(
  doc: PrayerRequestDoc,
  viewer: { uid: string; role: string },
  requester?: { fullName: string } | null
): PrayerRequestPayload {
  const isMinister = viewer.role === "minister" || viewer.role === "admin";
  const isRequester = viewer.uid === doc.requesterId;
  const hideIdentity = doc.isAnonymousToPeers && !isMinister && !isRequester;

  return {
    _id: doc._id.toString(),
    fellowshipId: doc.fellowshipId.toString(),
    body: doc.body,
    type: doc.type,
    status: doc.status,
    isAnonymousToPeers: doc.isAnonymousToPeers,
    requesterId: hideIdentity ? "anonymous" : doc.requesterId,
    requesterDisplay: hideIdentity
      ? "Anonymous Member"
      : (requester?.fullName ?? "Member"),
    acceptedByMinisterId: doc.acceptedByMinisterId,
    prayedForCount: doc.prayedForCount,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function broadcastNewPrayerRequest(
  request: PrayerRequestDoc,
  requesterName: string
): Promise<void> {
  const fellowshipId = request.fellowshipId.toString();
  const payload = {
    _id: request._id.toString(),
    fellowshipId,
    body: request.body,
    type: request.type,
    status: request.status,
    requesterDisplay: request.isAnonymousToPeers ? "Anonymous Member" : requesterName,
    createdAt: request.createdAt.toISOString(),
  };

  getIO().to(`fellowship:${fellowshipId}:ministers`).emit("prayer_request:new", payload);

  const verifiedMinisters = await User.find({
    fellowshipId: request.fellowshipId,
    role: "minister",
    _id: { $ne: request.requesterId },
  })
    .select("_id")
    .lean();

  if (verifiedMinisters.length === 0) return;

  const ministerIds = verifiedMinisters.map((m) => m._id);
  const profiles = await MinisterProfile.find({
    userId: { $in: ministerIds },
    verifiedAt: { $ne: null },
    isSuspended: false,
  })
    .select("userId")
    .lean();

  if (profiles.length === 0) return;

  const preview = request.body.length > 80 ? `${request.body.slice(0, 80)}…` : request.body;
  await notifyFellowshipMinisters(
    fellowshipId,
    "New prayer request",
    preview,
    { type: "prayer_request", requestId: request._id.toString() }
  );
}

export async function claimPrayerRequest(
  requestId: string,
  ministerId: string
): Promise<
  | { ok: true; request: PrayerRequestDoc }
  | { ok: false; status: number; error: string }
> {
  if (!Types.ObjectId.isValid(requestId)) {
    return { ok: false, status: 400, error: "Invalid request id" };
  }

  const claimed = await PrayerRequest.findOneAndUpdate(
    { _id: requestId, status: "open" },
    { status: "accepted", acceptedByMinisterId: ministerId },
    { new: true }
  );

  if (!claimed) {
    return { ok: false, status: 409, error: "Already claimed by another minister" };
  }

  const fellowshipId = claimed.fellowshipId.toString();
  getIO().to(`fellowship:${fellowshipId}:ministers`).emit("prayer_request:claimed", {
    _id: claimed._id.toString(),
    acceptedByMinisterId: ministerId,
  });

  await notifyUser(
    claimed.requesterId,
    "A minister is praying with you",
    "Your prayer request has been accepted.",
    { type: "prayer_accepted", requestId: claimed._id.toString() }
  );

  return { ok: true, request: claimed };
}

// Escalation fires once per request — cron only picks requests in the 5–6 minute window.
export async function escalateStalePrayerRequests(): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000);

  const stale = await PrayerRequest.find({
    status: "open",
    createdAt: { $lte: fiveMinAgo, $gt: sixMinAgo },
  }).lean<PrayerRequestDoc[]>();

  for (const request of stale) {
    const fellowshipId = request.fellowshipId.toString();
    const preview = request.body.length > 80 ? `${request.body.slice(0, 80)}…` : request.body;

    getIO().to(`fellowship:${fellowshipId}:ministers`).emit("prayer_request:escalated", {
      _id: request._id.toString(),
      fellowshipId,
      body: request.body,
      type: request.type,
      createdAt: request.createdAt.toISOString(),
    });

    await notifyFellowshipMinisters(
      fellowshipId,
      "Urgent: unanswered prayer request",
      preview,
      { type: "prayer_escalation", requestId: request._id.toString() }
    );
  }

  return stale.length;
}
