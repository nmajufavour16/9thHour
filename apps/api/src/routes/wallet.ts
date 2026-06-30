import { Router, Request, Response } from "express";
import crypto from "crypto";
import { Types } from "mongoose";
import { firebaseAuth, requireRole } from "../middleware/firebaseAuth";
import {
  ensurePaystackConfigured,
  initializePaystackTransaction,
  createTransferRecipient,
  initiatePaystackTransfer,
} from "../lib/paystack";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import { ExchangeRateConfig } from "../models/ExchangeRateConfig";
import { MinisterProfile } from "../models/MinisterProfile";
import { VerificationRequest } from "../models/VerificationRequest";
import {
  giveOffering,
  requestWithdrawal,
  settleWithdrawal,
  WalletError,
} from "../services/walletService";
import { sendOfferingReceiptEmail } from "../services/email";

const router = Router();

router.use(firebaseAuth);

const MIN_FUNDING_NAIRA = 100;
const MIN_WITHDRAWAL_COINS = 100;

// POST /wallet/purchase/initialize — start a Paystack payment to fund the wallet.
// Only Naira→coin conversion point in the system.
router.post(
  "/wallet/purchase/initialize",
  ensurePaystackConfigured,
  async (req: Request, res: Response) => {
    const uid = req.firebaseUid!;
    const { nairaAmount } = req.body as { nairaAmount?: number };

    if (typeof nairaAmount !== "number" || !Number.isInteger(nairaAmount) || nairaAmount < MIN_FUNDING_NAIRA) {
      return res
        .status(400)
        .json({ error: `nairaAmount must be a whole number of at least ${MIN_FUNDING_NAIRA}` });
    }

    try {
      const user = await User.findById(uid).select("email");
      if (!user?.email) {
        return res.status(400).json({ error: "User has no email on file" });
      }

      const config = await ExchangeRateConfig.findOne({ isActive: true });
      if (!config) {
        return res.status(500).json({ error: "No active exchange rate configured" });
      }

      const coins = Math.floor(nairaAmount * config.coinsPerNaira);
      const reference = `9h_fund_${uid}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      const pending = await Transaction.create({
        fromUserId: uid,
        type: "fund_wallet",
        amount: coins,
        feeCharged: 0,
        netAmount: coins,
        status: "pending",
        externalRef: reference,
        metadata: { nairaAmount },
      });

      try {
        const init = await initializePaystackTransaction({
          email: user.email,
          amountKobo: nairaAmount * 100,
          reference,
          metadata: { userId: uid, nairaAmount, coins },
        });

        return res.status(200).json({
          authorizationUrl: init.authorizationUrl,
          reference: init.reference,
          coinsToCredit: coins,
          nairaAmount,
        });
      } catch (err) {
        pending.status = "failed";
        await pending.save();
        console.error("[/wallet/purchase/initialize] Paystack init failed:", err);
        return res.status(502).json({ error: "Could not start payment. Please try again." });
      }
    } catch (err) {
      console.error("[/wallet/purchase/initialize] Unhandled error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /wallet/give — tithe or offering from the authenticated giver to a minister.
router.post("/wallet/give", async (req: Request, res: Response) => {
  const fromUserId = req.firebaseUid!;
  const { toMinisterId, amount, type, sessionId } = req.body as {
    toMinisterId?: string;
    amount?: number;
    type?: string;
    sessionId?: string;
  };

  if (!toMinisterId || typeof toMinisterId !== "string") {
    return res.status(400).json({ error: "toMinisterId is required" });
  }
  if (type !== "tithe" && type !== "offering") {
    return res.status(400).json({ error: "type must be 'tithe' or 'offering'" });
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1) {
    return res.status(400).json({ error: "amount must be a whole number of at least 1 coin" });
  }
  if (toMinisterId === fromUserId) {
    return res.status(400).json({ error: "You cannot give to yourself" });
  }
  if (sessionId !== undefined && !Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "sessionId must be a valid id" });
  }

  try {
    const result = await giveOffering({
      fromUserId,
      toMinisterId,
      amount,
      type,
      sessionId: sessionId ?? null,
    });

    // Receipt email is best-effort — never block the gift response on Resend.
    void User.findById(fromUserId)
      .select("email fullName")
      .lean<{ email: string; fullName: string }>()
      .then((giver) => {
        if (!giver?.email) return;
        return sendOfferingReceiptEmail(giver.email, giver.fullName, result.receipt);
      })
      .catch((err) => console.error("[/wallet/give] receipt email failed:", err));

    return res.status(201).json({
      message: "Gift sent",
      transactionId: result.transactionId,
      receipt: result.receipt,
    });
  } catch (err) {
    if (err instanceof WalletError) {
      return res.status(err.httpStatus).json({ error: err.message });
    }
    console.error("[/wallet/give] Unhandled error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Minister cashes out earnings. Debits pendingWithdrawalBalance only; 7% fee;
// transfer webhook finalizes or refunds.
router.post(
  "/wallet/withdraw",
  requireRole("minister"),
  ensurePaystackConfigured,
  async (req: Request, res: Response) => {
    const ministerId = req.firebaseUid!;
    const { amount, bankCode } = req.body as { amount?: number; bankCode?: string };

    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < MIN_WITHDRAWAL_COINS) {
      return res
        .status(400)
        .json({ error: `amount must be a whole number of at least ${MIN_WITHDRAWAL_COINS} coins` });
    }
    if (!bankCode || typeof bankCode !== "string") {
      return res.status(400).json({ error: "bankCode is required" });
    }

    try {
      const profile = await MinisterProfile.findOne({ userId: ministerId }).select("isSuspended");
      if (profile?.isSuspended) {
        return res.status(403).json({ error: "Withdrawals are temporarily unavailable" });
      }

      // Payout destination comes from the most recent approved verification.
      const verification = await VerificationRequest.findOne({
        userId: ministerId,
        status: "approved",
      })
        .sort({ createdAt: -1 })
        .select("bankAccountName +bankAccountNumber");

      if (!verification?.bankAccountName || !verification?.bankAccountNumber) {
        return res.status(400).json({ error: "No verified bank account on file" });
      }

      // Atomic debit first — money leaves the ledger before we call out.
      const wd = await requestWithdrawal(ministerId, amount);

      try {
        const recipientCode = await createTransferRecipient({
          name: verification.bankAccountName,
          accountNumber: verification.bankAccountNumber,
          bankCode,
        });
        const transfer = await initiatePaystackTransfer({
          amountKobo: wd.netPayout * 100,
          recipientCode,
          reference: wd.transactionId,
        });

        return res.status(200).json({
          message: "Withdrawal initiated",
          transactionId: wd.transactionId,
          amount: wd.amount,
          feeCharged: wd.feeCharged,
          netPayout: wd.netPayout,
          status: transfer.status,
        });
      } catch (transferErr) {
        // Transfer couldn't be started — reverse the debit so the minister is
        // never left with deducted-but-unpaid coins.
        await settleWithdrawal(wd.transactionId, false);
        console.error("[/wallet/withdraw] transfer failed, refunded:", transferErr);
        return res
          .status(502)
          .json({ error: "Withdrawal could not be processed. Your balance has been restored." });
      }
    } catch (err) {
      if (err instanceof WalletError) {
        return res.status(err.httpStatus).json({ error: err.message });
      }
      console.error("[/wallet/withdraw] Unhandled error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
