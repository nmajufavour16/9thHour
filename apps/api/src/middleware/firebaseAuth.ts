import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase";
import { User } from "../models/User";

// Verifies the Firebase ID token from Authorization: Bearer <token>,
// then hydrates req.firebaseUid and req.userRole from the DB.
export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const idToken = authHeader.slice(7);

  // A token failure is a genuine auth problem → 401.
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
  }

  // A DB failure here is infrastructure, not bad credentials — forward it to the
  // central error handler (→ 503) instead of masking it as a 401.
  let user;
  try {
    user = await User.findById(decoded.uid).select("role").lean<{ role: string }>();
  } catch (err) {
    return next(err);
  }

  if (!user) {
    return res.status(404).json({ error: "User not found — call /auth/sync first" });
  }

  req.firebaseUid = decoded.uid;
  req.userRole = user.role as "believer" | "minister" | "admin";
  return next();
}

// Like firebaseAuth but never rejects: if a valid token is present it hydrates
// req.firebaseUid/req.userRole; otherwise the request continues as anonymous.
// Use on public-read routes that personalize when signed in. Writes still use
// the strict firebaseAuth. Infra (DB) failures are still forwarded, not masked.
export async function optionalFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return next(); // bad/expired token on a public route → treat as anonymous
  }

  let user;
  try {
    user = await User.findById(decoded.uid).select("role").lean<{ role: string }>();
  } catch (err) {
    return next(err);
  }

  if (user) {
    req.firebaseUid = decoded.uid;
    req.userRole = user.role as "believer" | "minister" | "admin";
  }
  return next();
}

export function requireRole(...roles: Array<"believer" | "minister" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
