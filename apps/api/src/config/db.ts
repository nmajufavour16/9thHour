import mongoose from "mongoose";

// Financial writes elsewhere in the app must use transactions — see TRD.md §4.2.
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  }

  mongoose.connection.on("connected", () => console.log("[MongoDB] Connected"));
  mongoose.connection.on("error", (err) => console.error("[MongoDB] Error:", err));
  mongoose.connection.on("disconnected", () => console.warn("[MongoDB] Disconnected — retrying"));

  // Don't crash the process on initial failure — Mongoose retries automatically.
  // The server stays up so routes can surface real error traces during diagnosis.
  mongoose
    .connect(uri, { serverSelectionTimeoutMS: 10000 })
    .catch((err) => console.error("[MongoDB] Initial connection failed:", err.message));
}
