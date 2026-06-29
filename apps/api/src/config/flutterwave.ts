import { Request, Response, NextFunction } from "express";

const FLW_API_BASE = "https://api.flutterwave.com/v3";

export function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY && process.env.FLW_SECRET_HASH);
}

export function warnIfFlutterwaveUnconfigured(): void {
  if (!isFlutterwaveConfigured()) {
    console.warn(
      "[Flutterwave] FLW_SECRET_KEY and/or FLW_SECRET_HASH not set — airtime purchase and " +
        "the Flutterwave webhook will return 503 until both are configured."
    );
  }
}

export function ensureFlutterwaveConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!isFlutterwaveConfigured()) {
    return res.status(503).json({ error: "Airtime service not yet configured" });
  }
  return next();
}

// Flutterwave signs webhooks with the secret hash you configure in their dashboard.
export function verifyFlutterwaveWebhookHash(hash: string | undefined): boolean {
  const expected = process.env.FLW_SECRET_HASH;
  if (!expected || !hash) return false;
  return hash === expected;
}

function normalizeNigerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+234${digits}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

interface AirtimeBillParams {
  phoneNumber: string;
  amountNaira: number;
  reference: string;
}

export async function purchaseAirtimeBill(
  params: AirtimeBillParams
): Promise<{ success: boolean; flwRef?: string; message?: string }> {
  const customer = normalizeNigerianPhone(params.phoneNumber);

  const response = await fetch(`${FLW_API_BASE}/bills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: "NG",
      customer,
      amount: params.amountNaira,
      recurrence: "ONCE",
      type: "AIRTIME",
      reference: params.reference,
    }),
  });

  const json = (await response.json()) as {
    status?: string;
    message?: string;
    data?: { flw_ref?: string; tx_ref?: string; reference?: string };
  };

  if (!response.ok || json.status !== "success") {
    return { success: false, message: json.message ?? "Airtime purchase failed" };
  }

  return {
    success: true,
    flwRef: json.data?.flw_ref ?? json.data?.tx_ref ?? json.data?.reference,
  };
}
