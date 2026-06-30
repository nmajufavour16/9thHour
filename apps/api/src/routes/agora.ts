import { Router, Request, Response } from "express";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { ensureAgoraConfigured, buildRtcToken } from "../lib/agora";
import { LiveSession } from "../models/LiveSession";

const router = Router();

router.use(firebaseAuth);

// POST /agora/token — mint an RTC token for a session's channel.
// Host role is only granted to the minister who owns the session; everyone else
// gets a subscriber token. The App Certificate stays server-side.
router.post("/agora/token", ensureAgoraConfigured, async (req: Request, res: Response) => {
  const uid = req.firebaseUid!;
  const { channelName, role } = req.body as { channelName?: string; role?: "host" | "audience" };

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }
  if (role !== "host" && role !== "audience") {
    return res.status(400).json({ error: "role must be 'host' or 'audience'" });
  }

  const session = await LiveSession.findOne({ agoraChannelName: channelName }).select("ministerId");
  if (!session) {
    return res.status(404).json({ error: "No session for that channel" });
  }

  // Only the owning minister may publish; silently deny a forged host claim.
  if (role === "host" && session.ministerId !== uid) {
    return res.status(403).json({ error: "Only the host can publish to this session" });
  }

  const issued = buildRtcToken(channelName, uid, role);
  return res.json(issued);
});

export default router;
