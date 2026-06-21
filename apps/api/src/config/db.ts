import mongoose from "mongoose";

/**
 * 9TH HOUR — MONGODB CONNECTION
 * Per SCHEMA.md — all financial writes downstream of this connection
 * MUST use session.withTransaction(). See TRD.md §4.2.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  }

  try {
    await mongoose.connect(uri);
    console.log("[MongoDB] Connected successfully");
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);
    process.exit(1);
  }
}
