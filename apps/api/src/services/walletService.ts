import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { LiveSession } from "../models/LiveSession";
import { computeFee, buildOfferingReceipt, OfferingReceipt } from "../utils/fees";

export class WalletError extends Error {
  httpStatus: number;
  constructor(httpStatus: number, message: string) {
    super(message);
    this.name = "WalletError";
    this.httpStatus = httpStatus;
  }
}

interface GiveOfferingParams {
  fromUserId: string;
  toMinisterId: string;
  amount: number;
  type: "tithe" | "offering";
  sessionId?: string | null;
}

interface GiveOfferingResult {
  transactionId: string;
  amount: number;
  feeCharged: number;
  netAmount: number;
  receipt: OfferingReceipt;
}

// Tithe/offering transfer. The full `amount` leaves the giver's spendable
// `balance`; `netAmount` lands in the minister's `pendingWithdrawalBalance`
// (earnings — kept structurally separate from spendable balance per TRD §4.5).
// The platform keeps `feeCharged`. Everything happens in one ACID transaction
// using the atomic guarded-update pattern, so no partial state can persist.
export async function giveOffering(params: GiveOfferingParams): Promise<GiveOfferingResult> {
  const { fromUserId, toMinisterId, amount, type, sessionId } = params;

  const feeCharged = computeFee(type, amount);
  const netAmount = amount - feeCharged;

  // The invariant the whole engine depends on.
  if (amount !== feeCharged + netAmount) {
    throw new WalletError(500, "Fee reconciliation failed");
  }

  const session = await mongoose.startSession();
  let createdTransactionId = "";

  try {
    await session.withTransaction(async () => {
      // Guarded decrement — condition and mutation in one atomic op. If balance
      // is insufficient, no document matches and updatedGiver is null.
      const updatedGiver = await Wallet.findOneAndUpdate(
        { userId: fromUserId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );

      if (!updatedGiver) {
        throw new WalletError(402, "Insufficient balance");
      }

      const updatedMinister = await Wallet.findOneAndUpdate(
        { userId: toMinisterId },
        { $inc: { pendingWithdrawalBalance: netAmount, totalEarnedAllTime: netAmount } },
        { new: true, session }
      );

      if (!updatedMinister) {
        throw new WalletError(404, "Recipient minister wallet not found");
      }

      if (sessionId) {
        const updatedSession = await LiveSession.findByIdAndUpdate(
          sessionId,
          { $inc: { totalOfferingsReceived: netAmount } },
          { new: true, session }
        );
        if (!updatedSession) {
          throw new WalletError(404, "Live session not found");
        }
      }

      const [txn] = await Transaction.create(
        [
          {
            fromUserId,
            toMinisterId,
            sessionId: sessionId ?? null,
            amount,
            feeCharged,
            netAmount,
            type,
            status: "completed",
          },
        ],
        { session }
      );

      createdTransactionId = txn._id.toString();
    });
  } finally {
    await session.endSession();
  }

  return {
    transactionId: createdTransactionId,
    amount,
    feeCharged,
    netAmount,
    receipt: buildOfferingReceipt(type, amount, feeCharged, netAmount),
  };
}

interface ApplyFundingParams {
  reference: string;
  userId: string;
  fallbackCoins: number;
}

// Credits a wallet after a verified Paystack payment. Idempotent: the pending
// fund_wallet transaction is flipped pending→completed atomically, so only the
// first delivery of a given reference can credit. Replays find no pending row
// and become a no-op.
export async function applyFundingCredit(
  params: ApplyFundingParams
): Promise<{ credited: boolean; coins: number }> {
  const { reference, userId, fallbackCoins } = params;

  const session = await mongoose.startSession();
  let credited = false;
  let coins = 0;

  try {
    await session.withTransaction(async () => {
      const claimed = await Transaction.findOneAndUpdate(
        { externalRef: reference, status: "pending", type: "fund_wallet" },
        { $set: { status: "completed" } },
        { new: true, session }
      );

      if (claimed) {
        coins = claimed.amount;
        const creditedWallet = await Wallet.findOneAndUpdate(
          { userId: claimed.fromUserId },
          { $inc: { balance: claimed.amount } },
          { new: true, session }
        );
        // Abort rather than leave a payment "completed" with no money credited —
        // the rollback keeps the row pending so a retry can succeed.
        if (!creditedWallet) {
          throw new Error(`Wallet not found for user ${claimed.fromUserId} (ref ${reference})`);
        }
        credited = true;
        return;
      }

      // No pending row to claim. Either already processed (idempotent replay) or
      // we never recorded an initiation for this reference.
      const existing = await Transaction.findOne({ externalRef: reference }).session(session);
      if (existing) {
        // already completed/failed — do nothing
        return;
      }

      // Defensive path: credit using the unique externalRef index as the guard.
      // Without a known user we can't credit anyone — bail rather than write an
      // orphan completed transaction.
      if (!userId) {
        throw new Error(`No pending transaction or userId for reference ${reference}`);
      }
      coins = fallbackCoins;
      await Transaction.create(
        [
          {
            fromUserId: userId,
            type: "fund_wallet",
            amount: fallbackCoins,
            feeCharged: 0,
            netAmount: fallbackCoins,
            status: "completed",
            externalRef: reference,
          },
        ],
        { session }
      );
      const defensiveWallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: fallbackCoins } },
        { new: true, session }
      );
      if (!defensiveWallet) {
        throw new Error(`Wallet not found for user ${userId} (ref ${reference})`);
      }
      credited = true;
    });
  } finally {
    await session.endSession();
  }

  return { credited, coins };
}
