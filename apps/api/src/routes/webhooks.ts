import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import {
  ensurePaystackConfigured,
  verifyPaystackSignature,
} from "../lib/paystack";
import {
  verifyFlutterwaveWebhookHash,
} from "../lib/flutterwave";
import { Transaction } from "../models/Transaction";
import { ExchangeRateConfig } from "../models/ExchangeRateConfig";
import { applyFundingCredit, settleWithdrawal, settleAirtimePurchase } from "../services/walletService";

const router = Router();

// POST /webhooks/paystack — external, called directly by Paystack (not the BFF).
// Exempt from INTERNAL_COMMUNICATION_KEY (see internalAuthGuard); authenticity is
// proven by the HMAC-SHA512 signature instead.
router.post("/webhooks/paystack", ensurePaystackConfigured, async (req: Request, res: Response) => {
  const signature = req.headers["x-paystack-signature"] as string | undefined;

  if (!verifyPaystackSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body as {
    event?: string;
    data?: { reference?: string; amount?: number; metadata?: Record<string, unknown> };
  };

  // Outgoing transfers finalize a withdrawal: success completes it, failure or
  // reversal refunds pendingWithdrawalBalance. settleWithdrawal is idempotent.
  if (
    event.event === "transfer.success" ||
    event.event === "transfer.failed" ||
    event.event === "transfer.reversed"
  ) {
    const ref = event.data?.reference;
    try {
      if (ref && Types.ObjectId.isValid(ref)) {
        await settleWithdrawal(ref, event.event === "transfer.success");
      }
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("[/webhooks/paystack] transfer settle error:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  // Acknowledge anything we don't act on so Paystack stops retrying.
  if (event.event !== "charge.success" || !event.data?.reference) {
    return res.status(200).json({ received: true });
  }

  const reference = event.data.reference;

  try {
    // Fast idempotency path for the common replay case.
    const alreadyDone = await Transaction.findOne({ externalRef: reference, status: "completed" });
    if (alreadyDone) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const nairaPaid = (event.data.amount ?? 0) / 100;
    const config = await ExchangeRateConfig.findOne({ isActive: true });
    const coinsPerNaira = config?.coinsPerNaira ?? 0.85;
    const fallbackCoins = Math.floor(nairaPaid * coinsPerNaira);
    const userId = (event.data.metadata?.userId as string) ?? "";

    await applyFundingCredit({ reference, userId, fallbackCoins });

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[/webhooks/paystack] processing error:", err);
    // 500 → Paystack retries later; idempotency guard makes retries safe.
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// POST /webhooks/flutterwave — bill payment status updates from Flutterwave.
router.post("/webhooks/flutterwave", async (req: Request, res: Response) => {
  const verifHash = req.headers["verif-hash"] as string | undefined;

  if (!verifyFlutterwaveWebhookHash(verifHash)) {
    return res.status(401).json({ error: "Invalid webhook hash" });
  }

  const event = req.body as {
    event?: string;
    data?: {
      tx_ref?: string;
      reference?: string;
      status?: string;
    };
  };

  const reference = event.data?.tx_ref ?? event.data?.reference;
  if (!reference) {
    return res.status(200).json({ received: true });
  }

  try {
    const alreadyDone = await Transaction.findOne({
      externalRef: reference,
      status: "completed",
      type: "airtime",
    });
    if (alreadyDone) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const status = (event.data?.status ?? "").toLowerCase();
    const success =
      event.event === "charge.completed" ||
      status === "successful" ||
      status === "success";

    const failed =
      event.event === "charge.failed" ||
      status === "failed";

    if (success) {
      await settleAirtimePurchase(reference, true);
    } else if (failed) {
      await settleAirtimePurchase(reference, false);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[/webhooks/flutterwave] processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
