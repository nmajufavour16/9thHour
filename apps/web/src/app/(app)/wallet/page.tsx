"use client";

import RequireAuth from "@/components/features/auth/RequireAuth";

export default function WalletPage() {
  return (
    <RequireAuth>
      <main className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Wallet</h1>
        <p className="text-sm text-text-secondary">
          Your coins, giving, and transaction history.
        </p>
      </main>
    </RequireAuth>
  );
}
