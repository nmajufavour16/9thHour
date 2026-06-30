import mongoose from "mongoose";
import dns from "dns";

// mongodb+srv:// resolves the cluster via an SRV record using Node's c-ares
// resolver. Some local setups point c-ares at a loopback DNS that refuses
// queries (querySrv ECONNREFUSED), breaking the lookup even though the OS
// resolver works. When the configured resolver is only loopback, fall back to a
// public DNS — a no-op on hosts with a real resolver (e.g. Railway).
const resolvers = dns.getServers();
if (resolvers.length > 0 && resolvers.every((s) => s === "127.0.0.1" || s === "::1")) {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

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
