import "express";

declare module "express-serve-static-core" {
  interface Request {
    // Populated by firebaseAuth middleware after token verification
    firebaseUid?: string;
    userRole?: "believer" | "minister" | "admin";
    // Raw request body buffer — captured for webhook HMAC signature verification
    rawBody?: Buffer;
  }
}
