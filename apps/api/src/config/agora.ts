import { Request, Response, NextFunction } from "express";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// The App Certificate signs tokens and must never reach the client. Tokens are
// minted here, server-side, and only the token itself goes back to the browser.
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour — client rejoins for longer sessions

export function isAgoraConfigured(): boolean {
  return Boolean(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE);
}

export function warnIfAgoraUnconfigured(): void {
  if (!isAgoraConfigured()) {
    console.warn(
      "[Agora] AGORA_APP_ID and/or AGORA_APP_CERTIFICATE not set — live session " +
        "token issuance will return 503 until both are configured. All other routes work normally."
    );
  }
}

export function ensureAgoraConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!isAgoraConfigured()) {
    return res.status(503).json({ error: "Live session service not yet configured" });
  }
  return next();
}

export function getAgoraAppId(): string {
  return process.env.AGORA_APP_ID as string;
}

export interface IssuedToken {
  token: string;
  appId: string;
  channelName: string;
  account: string;
  role: "host" | "audience";
  expiresAt: number; // unix seconds
}

// account is the Firebase UID — string-account tokens keep parity with our IDs
// so the same uid is used on join() and in attendance records.
export function buildRtcToken(
  channelName: string,
  account: string,
  role: "host" | "audience"
): IssuedToken {
  const appId = getAgoraAppId();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE as string;
  const rtcRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUserAccount(
    appId,
    appCertificate,
    channelName,
    account,
    rtcRole,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS
  );

  return {
    token,
    appId,
    channelName,
    account,
    role,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
}
