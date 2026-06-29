import { Router, Request, Response } from "express";
import crypto from "crypto";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { ensureFlutterwaveConfigured, purchaseAirtimeBill } from "../config/flutterwave";
import { Wallet } from "../models/Wallet";
import {
  initiateAirtimePurchase,
  settleAirtimePurchase,
  WalletError,
} from "../services/walletService";

const router = Router();

router.use(firebaseAuth);

const MIN_AIRTIME_COINS = 50;
const MAX_AIRTIME_COINS = 50_000;

function isValidNigerianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return (
    (digits.startsWith("234") && digits.length === 13) ||
    (digits.startsWith("0") && digits.length === 11) ||
    digits.length === 10
  );
}

// POST /airtime/purchase — debit wallet first, then fulfil via Flutterwave.
router.post(
  "/airtime/purchase",
  ensureFlutterwaveConfigured,
  async (req: Request, res: Response) => {
    const uid = req.firebaseUid!;
    const { phoneNumber, amount } = req.body as { phoneNumber?: string; amount?: number };

    if (!phoneNumber || !isValidNigerianPhone(phoneNumber)) {
      return res.status(400).json({ error: "phoneNumber must be a valid Nigerian mobile number" });
    }
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < MIN_AIRTIME_COINS ||
      amount > MAX_AIRTIME_COINS
    ) {
      return res.status(400).json({
        error: `amount must be a whole number between ${MIN_AIRTIME_COINS} and ${MAX_AIRTIME_COINS} coins`,
      });
    }

    const reference = `9h_airtime_${uid}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    try {
      const { transactionId } = await initiateAirtimePurchase({
        userId: uid,
        amount,
        phoneNumber,
        reference,
      });

      const flw = await purchaseAirtimeBill({
        phoneNumber,
        amountNaira: amount,
        reference,
      });

      if (!flw.success) {
        await settleAirtimePurchase(reference, false);
        return res.status(502).json({
          error: flw.message ?? "Airtime could not be delivered. Your coins have been refunded.",
        });
      }

      await settleAirtimePurchase(reference, true);

      const wallet = await Wallet.findOne({ userId: uid }).select("balance").lean<{ balance: number }>();

      return res.status(200).json({
        message: "Airtime sent",
        transactionId,
        reference,
        amount,
        phoneNumber,
        flwRef: flw.flwRef ?? null,
        balance: wallet?.balance ?? 0,
      });
    } catch (err) {
      if (err instanceof WalletError) {
        return res.status(err.httpStatus).json({ error: err.message });
      }
      // Provider call threw after debit — refund defensively.
      await settleAirtimePurchase(reference, false).catch(() => undefined);
      console.error("[/airtime/purchase] Unhandled error:", err);
      return res.status(500).json({ error: "Airtime purchase failed. Your balance has been restored." });
    }
  }
);

export default router;
