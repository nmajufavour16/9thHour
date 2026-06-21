import { Request, Response, NextFunction } from "express";

// Blocks any request without the shared key from the BFF proxy.
// Webhooks are exempt — Paystack/Flutterwave sign their own payloads instead.
export function internalAuthGuard(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/webhooks/")) {
    return next();
  }

  const providedKey = req.headers["x-internal-key"];
  const expectedKey = process.env.INTERNAL_COMMUNICATION_KEY;

  if (!expectedKey) {
    console.error("[internalAuthGuard] INTERNAL_COMMUNICATION_KEY is not set on the server.");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  if (providedKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized — missing or invalid internal key" });
  }

  return next();
}
