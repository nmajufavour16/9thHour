import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { LiveSession } from "../models/LiveSession";
import { MinisterProfile } from "../models/MinisterProfile";
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
      // Recipient must be a minister who can currently accept offerings. Checked
      // inside the transaction so a suspension can't slip in between check and
      // credit. The error stays generic — don't leak suspension/disciplinary
      // state to the giver.
      const recipientProfile = await MinisterProfile.findOne({ userId: toMinisterId })
        .select("canAcceptOfferings isSuspended")
        .session(session);

      if (!recipientProfile || !recipientProfile.canAcceptOfferings || recipientProfile.isSuspended) {
        throw new WalletError(403, "Recipient is not eligible to receive offerings");
      }

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

interface RequestWithdrawalResult {
  transactionId: string;
  amount: number;
  feeCharged: number;
  netPayout: number;
}

// Atomic withdrawal debit (TRD §4.7 steps 2–5). Debits ONLY pendingWithdrawalBalance
// (earnings) — never spendable balance — with the same guarded pattern, and logs a
// pending withdrawal transaction. The external payout is triggered by the caller;
// settleWithdrawal finalizes or refunds based on the transfer result.
export async function requestWithdrawal(
  ministerId: string,
  amount: number
): Promise<RequestWithdrawalResult> {
  const feeCharged = computeFee("withdrawal", amount); // 7%
  const netPayout = amount - feeCharged;

  if (amount !== feeCharged + netPayout) {
    throw new WalletError(500, "Fee reconciliation failed");
  }

  const session = await mongoose.startSession();
  let transactionId = "";

  try {
    await session.withTransaction(async () => {
      const updated = await Wallet.findOneAndUpdate(
        { userId: ministerId, pendingWithdrawalBalance: { $gte: amount } },
        { $inc: { pendingWithdrawalBalance: -amount } },
        { new: true, session }
      );

      if (!updated) {
        throw new WalletError(402, "Insufficient withdrawable balance");
      }

      const [txn] = await Transaction.create(
        [
          {
            fromUserId: ministerId,
            type: "withdrawal",
            amount,
            feeCharged,
            netAmount: netPayout,
            status: "pending",
          },
        ],
        { session }
      );

      transactionId = txn._id.toString();
    });
  } finally {
    await session.endSession();
  }

  return { transactionId, amount, feeCharged, netPayout };
}

// Finalizes a pending withdrawal. On success → completed. On failure → mark failed
// and refund the full amount back to pendingWithdrawalBalance (TRD §4.7 step 8).
// The guarded pending→terminal status transition makes this idempotent, so a
// replayed transfer webhook can't double-refund or double-complete.
export async function settleWithdrawal(
  transactionId: string,
  success: boolean
): Promise<{ settled: boolean }> {
  const session = await mongoose.startSession();
  let settled = false;

  try {
    await session.withTransaction(async () => {
      const txn = await Transaction.findOneAndUpdate(
        { _id: transactionId, type: "withdrawal", status: "pending" },
        { $set: { status: success ? "completed" : "failed" } },
        { new: true, session }
      );

      // Already settled (or unknown) — no-op keeps this idempotent.
      if (!txn) return;

      if (!success) {
        await Wallet.findOneAndUpdate(
          { userId: txn.fromUserId },
          { $inc: { pendingWithdrawalBalance: txn.amount } },
          { new: true, session }
        );
      }
      settled = true;
    });
  } finally {
    await session.endSession();
  }

  return { settled };
}

interface InitiateAirtimeParams {
  userId: string;
  amount: number;
  phoneNumber: string;
  reference: string;
}

// Debits spendable balance before Flutterwave is called (TRD §6). Caller settles
// the pending transaction after the provider responds.
export async function initiateAirtimePurchase(
  params: InitiateAirtimeParams
): Promise<{ transactionId: string }> {
  const { userId, amount, phoneNumber, reference } = params;

  if (amount !== Math.floor(amount) || amount < 1) {
    throw new WalletError(400, "amount must be a whole number of at least 1 coin");
  }

  const session = await mongoose.startSession();
  let transactionId = "";

  try {
    await session.withTransaction(async () => {
      const updated = await Wallet.findOneAndUpdate(
        { userId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );

      if (!updated) {
        throw new WalletError(402, "Insufficient balance");
      }

      const [txn] = await Transaction.create(
        [
          {
            fromUserId: userId,
            type: "airtime",
            amount,
            feeCharged: 0,
            netAmount: amount,
            status: "pending",
            externalRef: reference,
            metadata: { phoneNumber },
          },
        ],
        { session }
      );

      transactionId = txn._id.toString();
    });
  } finally {
    await session.endSession();
  }

  return { transactionId };
}

// Finalizes or refunds a pending airtime purchase. Guarded pending→terminal
// transition keeps webhook replays idempotent.
export async function settleAirtimePurchase(
  reference: string,
  success: boolean
): Promise<{ settled: boolean }> {
  const session = await mongoose.startSession();
  let settled = false;

  try {
    await session.withTransaction(async () => {
      const txn = await Transaction.findOneAndUpdate(
        { externalRef: reference, type: "airtime", status: "pending" },
        { $set: { status: success ? "completed" : "failed" } },
        { new: true, session }
      );

      if (!txn) return;

      if (!success && txn.fromUserId) {
        await Wallet.findOneAndUpdate(
          { userId: txn.fromUserId },
          { $inc: { balance: txn.amount } },
          { new: true, session }
        );
      }

      settled = true;
    });
  } finally {
    await session.endSession();
  }

  return { settled };
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
