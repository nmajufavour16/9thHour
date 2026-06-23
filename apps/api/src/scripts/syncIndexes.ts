import "dotenv/config";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction";

// Reconciles DB indexes with the schema (drops stale ones, builds new). Needed
// after changing the externalRef index from sparse to partial. Safe to re-run.
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Check apps/api/.env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const before = await Transaction.collection.indexes();
  console.log("before:", before.map((i) => i.name).join(", "));

  await Transaction.syncIndexes();

  const after = await Transaction.collection.indexes();
  console.log("after: ", after.map((i) => i.name).join(", "));

  await mongoose.disconnect();
  console.log("done");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
