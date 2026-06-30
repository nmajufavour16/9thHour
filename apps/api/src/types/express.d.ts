import "express";

// No bundled types — side-effect import that patches Express to forward async
// route errors to the central error handler.
declare module "express-async-errors";

declare module "express-serve-static-core" {
  interface Request {
    // Populated by firebaseAuth middleware after token verification
    firebaseUid?: string;
    userRole?: "believer" | "minister" | "admin";
    // Raw request body buffer — captured for webhook HMAC signature verification
    rawBody?: Buffer;
  }
}
