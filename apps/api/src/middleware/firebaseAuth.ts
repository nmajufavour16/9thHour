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

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await User.findById(decoded.uid).select("role").lean<{ role: string }>();

    if (!user) {
      return res.status(404).json({ error: "User not found — call /auth/sync first" });
    }

    req.firebaseUid = decoded.uid;
    req.userRole = user.role as "believer" | "minister" | "admin";
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
  }
}

export function requireRole(...roles: Array<"believer" | "minister" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
