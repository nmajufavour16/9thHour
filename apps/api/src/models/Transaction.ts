import { Schema, model, models } from "mongoose";

const transactionSchema = new Schema(
  {
    fromUserId: { type: String, ref: "User", default: null },
    toMinisterId: { type: String, ref: "User", default: null },
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", default: null },

    amount: { type: Number, required: true, min: 0 }, // gross, integer coins
    feeCharged: { type: Number, required: true, min: 0 }, // integer coins, Math.ceil()
    netAmount: { type: Number, required: true, min: 0 }, // amount - feeCharged

    type: {
      type: String,
      enum: [
        "fund_wallet", "tithe", "offering", "airtime",
        "gift", "seed", "withdrawal", "payout",
        "project_offering", "thanksgiving", "emergency_fund",
        "booking", "round_up", "feeding_program", "faith_clinic",
      ],
      required: true,
    },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },

    externalRef: { type: String, default: null },

    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toMinisterId: 1, createdAt: -1 });
// Idempotency guard against webhook replay. Partial (not sparse) on purpose:
// externalRef defaults to null, and a sparse index still indexes null values —
// which would make every fee-only txn (tithe/offering/withdrawal) collide. The
// partial filter enforces uniqueness ONLY on real string references.
transactionSchema.index(
  { externalRef: 1 },
  { unique: true, partialFilterExpression: { externalRef: { $type: "string" } } }
);

export const Transaction = models.Transaction || model("Transaction", transactionSchema);
