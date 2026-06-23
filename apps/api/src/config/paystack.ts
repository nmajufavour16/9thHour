import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Both must be present: the secret key to call Paystack, and the webhook secret
// to verify inbound signatures. Set PAYSTACK_WEBHOOK_SECRET to your Paystack
// secret key value — Paystack signs webhooks with the secret key.
export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_WEBHOOK_SECRET);
}

export function warnIfPaystackUnconfigured(): void {
  if (!isPaystackConfigured()) {
    console.warn(
      "[Paystack] PAYSTACK_SECRET_KEY and/or PAYSTACK_WEBHOOK_SECRET not set — wallet " +
        "funding and the Paystack webhook will return 503 until both are configured. " +
        "All other routes continue to work normally."
    );
  }
}

// Guard for every Paystack-touching route. Clean 503, never a raw SDK error.
export function ensurePaystackConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!isPaystackConfigured()) {
    return res.status(503).json({ error: "Payment service not yet configured" });
  }
  return next();
}

interface PaystackInitParams {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
}

export async function initializePaystackTransaction(params: PaystackInitParams): Promise<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      metadata: params.metadata ?? {},
    }),
  });

  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };

  if (!response.ok || !json.status || !json.data) {
    throw new Error(json.message || "Paystack transaction initialization failed");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<string> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });

  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { recipient_code: string };
  };

  if (!response.ok || !json.status || !json.data) {
    throw new Error(json.message || "Failed to create transfer recipient");
  }
  return json.data.recipient_code;
}

export async function initiatePaystackTransfer(params: {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}): Promise<{ transferCode: string; status: string }> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? "9th Hour withdrawal",
    }),
  });

  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { transfer_code: string; status: string };
  };

  if (!response.ok || !json.status || !json.data) {
    throw new Error(json.message || "Transfer initiation failed");
  }
  return { transferCode: json.data.transfer_code, status: json.data.status };
}

// Paystack signs each webhook with HMAC-SHA512 over the raw request body.
export function verifyPaystackSignature(
  rawBody: Buffer | undefined,
  signature: string | undefined
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret || !signature || !rawBody) return false;

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
