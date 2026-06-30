import { Resend } from "resend";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function warnIfResendUnconfigured(): void {
  if (!isResendConfigured()) {
    console.warn(
      "[Resend] RESEND_API_KEY and/or RESEND_FROM_EMAIL not set — offering receipts will be skipped."
    );
  }
}

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@9thhour.live";
}
