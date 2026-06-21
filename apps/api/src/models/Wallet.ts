import { Schema, model, models } from "mongoose";

const walletSchema = new Schema(
  {
    userId: { type: String, ref: "User", required: true, unique: true },

    // Spendable balance — coins purchased or received as a personal gift.
    // NOT withdrawable to cash. Spent on tithes, offerings, airtime.
    balance: { type: Number, default: 0, min: 0 },

    // Earned balance — coins received FROM OTHERS via tithe/offering/gift.
    // ONLY this field is debited on withdrawal. Structurally separate from
    // `balance` — do not merge these two fields in any code path.
    pendingWithdrawalBalance: { type: Number, default: 0, min: 0 },

    totalEarnedAllTime: { type: Number, default: 0, min: 0 },
    totalWithdrawnAllTime: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Wallet = models.Wallet || model("Wallet", walletSchema);
