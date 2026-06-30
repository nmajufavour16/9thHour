"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shield, RefreshCw } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";

interface Overview {
  openReports: number;
  pendingVerifications: number;
  exchangeRate: { coinsPerNaira: number; effectiveFrom: string } | null;
  flaggedMinisters: Array<{
    ministerProfileId: string;
    ministryName: string;
    ministerName: string;
    distinctReporters: number;
    isSuspended: boolean;
  }>;
  complaintWindowDays: number;
}

interface VerificationItem {
  _id: string;
  ministerId: string;
  requestedTier: number;
  fullName: string;
  churchName: string;
  status: string;
  createdAt: string;
}

interface ReportItem {
  _id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  category: string;
  status: string;
  createdAt: string;
}

type Tab = "overview" | "verification" | "reports" | "exchange";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: profileLoading } = useUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [coinsPerNaira, setCoinsPerNaira] = useState("0.85");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    const data = await apiFetch<Overview>("admin/overview");
    setOverview(data);
    if (data.exchangeRate) {
      setCoinsPerNaira(String(data.exchangeRate.coinsPerNaira));
    }
  }, []);

  const loadVerifications = useCallback(async () => {
    const data = await apiFetch<VerificationItem[]>("verification/queue");
    setVerifications(data);
  }, []);

  const loadReports = useCallback(async () => {
    const data = await apiFetch<{ reports: ReportItem[] }>("admin/reports?status=open");
    setReports(data.reports);
  }, []);

  useEffect(() => {
    if (authLoading || profileLoading || !isAdmin) return;
    setError(null);
    const load =
      tab === "overview"
        ? loadOverview
        : tab === "verification"
        ? loadVerifications
        : tab === "reports"
        ? loadReports
        : loadOverview;
    load().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [tab, authLoading, profileLoading, isAdmin, loadOverview, loadVerifications, loadReports]);

  async function approveVerification(id: string) {
    setBusy(true);
    try {
      await apiFetch(`admin/verification/${id}/approve`, { method: "POST", body: "{}" });
      await loadVerifications();
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function rejectVerification(id: string) {
    const reason = window.prompt("Rejection reason:");
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`admin/verification/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason: reason.trim() }),
      });
      await loadVerifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  async function reviewReport(id: string, status: "reviewed" | "actioned" | "dismissed") {
    setBusy(true);
    try {
      await apiFetch(`admin/reports/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadReports();
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveExchangeRate() {
    const rate = parseFloat(coinsPerNaira);
    if (Number.isNaN(rate) || rate <= 0) {
      setError("Enter a valid exchange rate");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("admin/exchange-rate", {
        method: "PUT",
        body: JSON.stringify({ coinsPerNaira: rate }),
      });
      await loadOverview();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update rate");
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ color: "var(--color-text-secondary)" }}>
        Please <Link href="/login" className="underline ml-1">sign in</Link>.
      </main>
    );
  }

  if (!profileLoading && !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ color: "var(--color-error)" }}>
        Admin access required.
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "verification", label: "Verification" },
    { id: "reports", label: "Reports" },
    { id: "exchange", label: "Exchange Rate" },
  ];

  return (
    <main className="min-h-screen px-4 py-6 pb-24 max-w-3xl mx-auto sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={22} style={{ color: "var(--color-primary-light)" }} aria-hidden />
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Admin Dashboard
        </h1>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? "var(--color-primary)" : "var(--color-bg-elevated)",
              color: tab === t.id ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ color: "var(--color-error)", background: "var(--color-bg-elevated)" }}>
          {error}
        </p>
      )}

      {tab === "overview" && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Open reports" value={overview.openReports} />
            <StatCard label="Pending verifications" value={overview.pendingVerifications} />
            <StatCard
              label="Coins per ₦1"
              value={overview.exchangeRate?.coinsPerNaira ?? "—"}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <section>
            <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              Complaint ratio ({overview.complaintWindowDays}d)
            </h2>
            {overview.flaggedMinisters.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No ministers flagged.</p>
            ) : (
              <ul className="space-y-2">
                {overview.flaggedMinisters.map((m) => (
                  <li
                    key={m.ministerProfileId}
                    className="p-3 rounded-xl border text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{m.ministryName}</p>
                      <p style={{ color: "var(--color-text-muted)" }}>{m.ministerName}</p>
                    </div>
                    <span style={{ color: m.isSuspended ? "var(--color-error)" : "var(--color-text-secondary)" }}>
                      {m.distinctReporters} reporters{m.isSuspended ? " · suspended" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "verification" && (
        <ul className="space-y-3">
          {verifications.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Queue empty.</p>
          ) : (
            verifications.map((v) => (
              <li
                key={v._id}
                className="p-4 rounded-xl border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
              >
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{v.fullName}</p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {v.churchName} · Tier {v.requestedTier} · {v.status}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    disabled={busy}
                    onClick={() => approveVerification(v._id)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--color-success)" }}
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => rejectVerification(v._id)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--color-error)" }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "reports" && (
        <ul className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No open reports.</p>
          ) : (
            reports.map((r) => (
              <li
                key={r._id}
                className="p-4 rounded-xl border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
              >
                <p className="text-sm font-medium capitalize" style={{ color: "var(--color-text-primary)" }}>
                  {r.category.replace("_", " ")} · {r.targetType}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(["reviewed", "actioned", "dismissed"] as const).map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() => reviewReport(r._id, s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50 capitalize"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "exchange" && (
        <div
          className="p-4 rounded-xl border space-y-4"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Changes apply only to <strong>future</strong> coin purchases — never retroactively.
          </p>
          <label className="block text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Coins per ₦1 (e.g. 0.85 → ₦1,000 buys 850 coins)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="2"
            value={coinsPerNaira}
            onChange={(e) => setCoinsPerNaira(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            disabled={busy}
            onClick={saveExchangeRate}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            <RefreshCw size={16} aria-hidden />
            Update rate
          </button>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${className}`}
      style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold mt-1 font-mono" style={{ color: "var(--color-text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
