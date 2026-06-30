import { Request, Response, NextFunction, RequestHandler } from "express";

// True when an error is a database connectivity/availability problem rather
// than a client mistake. These must surface as 503 — never a misleading 401
// (bad token) or an opaque 500 — so callers know to retry, not re-authenticate.
export function isDbConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as { name?: string }).name ?? "";
  const message = (err as { message?: string }).message ?? "";
  return (
    name === "MongooseServerSelectionError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    name === "MongoNotConnectedError" ||
    /buffering timed out|failed to connect|ECONNREFUSED|topology was destroyed|getaddrinfo|client is not connected/i.test(
      message
    )
  );
}

// Wraps an async handler so a rejected promise is forwarded to the central
// error handler instead of hanging the request. express-async-errors covers
// this globally; this stays exported for explicit use where preferred.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Last middleware in the chain. Distinguishes infrastructure failures (503)
// from everything else (500) and never leaks internals to the client.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (res.headersSent) {
    return;
  }

  if (isDbConnectionError(err)) {
    return res
      .status(503)
      .json({ error: "Service temporarily unavailable. Please try again shortly." });
  }

  console.error("[errorHandler]", err);
  return res.status(500).json({ error: "Internal server error" });
}
