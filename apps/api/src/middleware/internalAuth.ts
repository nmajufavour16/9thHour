import { Request, Response, NextFunction } from "express";

/**
 * 9TH HOUR — INTERNAL AUTH GUARD
 *
 * Rejects any request that doesn't carry the shared INTERNAL_COMMUNICATION_KEY
 * header set by the Next.js BFF proxy. This is the wall between "the browser"
 * and "this server" — direct calls to the API bypassing the proxy are refused.
 *
 * EXEMPTION: routes under /webhooks/* authenticate via the provider's own
 * signature scheme (Paystack HMAC-SHA512, Flutterwave verif-hash) instead,
 * since Paystack/Flutterwave obviously cannot send our internal key.
 *
 * Per AGENT_PROMPT.md Phase 1, Rule: "middleware that rejects requests
 * missing the INTERNAL_COMMUNICATION_KEY — except /webhooks/*."
 */
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
