"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

const AMOUNTS = [100, 500, 1000, 2000, 5000] as const;

interface PurchaseResult {
  message: string;
  amount: number;
  phoneNumber: string;
  balance: number;
}

export default function AirtimePage() {
  const { user, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 8000);
      return () => clearTimeout(t);
    }
  }, [success]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const coins = customAmount ? parseInt(customAmount, 10) : amount;
    if (!Number.isInteger(coins) || coins < 50) {
      setError("Amount must be at least 50 coins");
      setSubmitting(false);
      return;
    }

    try {
      const result = await apiFetch<PurchaseResult>("airtime/purchase", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, amount: coins }),
      });
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        Please <Link href="/login" className="underline ml-1">sign in</Link> to buy airtime.
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
        <Smartphone size={24} aria-hidden />
        Buy Airtime
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        1 coin = ₦1. Deducted from your wallet balance.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-4 rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
      >
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            Phone number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08012345678"
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm border"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
            Amount (coins)
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a);
                  setCustomAmount("");
                }}
                className="py-2 rounded-lg text-sm font-semibold border transition-colors"
                style={{
                  background: amount === a && !customAmount ? "var(--color-primary)" : "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: amount === a && !customAmount ? "#fff" : "var(--color-text-primary)",
                }}
              >
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={50}
            step={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom amount"
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm" style={{ color: "var(--color-success, #38A169)" }}>
            {success.message} — ₦{success.amount.toLocaleString()} sent to {success.phoneNumber}.
            Balance: ₦{success.balance.toLocaleString()}.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !phoneNumber.trim()}
          className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          {submitting ? "Sending…" : "Deduct & Send Airtime"}
        </button>
      </form>
    </main>
  );
}
