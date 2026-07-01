"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Radio, Plus, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ErrorNotice from "@/components/ui/ErrorNotice";

interface SessionSummary {
  _id: string;
  title: string;
  category: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt: string;
  viewerCount: number;
}

const CATEGORIES = ["prayer", "worship", "sermon", "counseling"] as const;

export default function SessionsPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Pull the live + upcoming session list from the backend.
  async function load() {
    setFetching(true);
    try {
      const data = await apiFetch<SessionSummary[]>("sessions");
      setSessions(data);
    } catch (err) {
      setError(err);
    } finally {
      setFetching(false);
    }
  }

  // Wait for auth to settle before calling the API (apiFetch needs a token).
  useEffect(() => {
    if (!loading && user) load();
  }, [loading, user]);

  if (!loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        Please <Link href="/login" className="underline ml-1">sign in</Link> to view live sessions.
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Live Sessions
        </h1>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={16} aria-hidden /> New
        </button>
      </div>

      {showCreate && <CreateSession onCreated={() => { setShowCreate(false); load(); }} />}

      <ErrorNotice error={error} className="mb-4" />

      {fetching ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No live or upcoming sessions right now.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s._id}>
              <Link
                href={`/sessions/${s._id}`}
                className="flex items-center justify-between p-4 rounded-xl border transition-colors"
                style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.title}</p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--color-text-muted)" }}>
                    {s.category} · {new Date(s.scheduledAt).toLocaleString()}
                  </p>
                </div>
                {s.status === "live" ? (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md text-white" style={{ background: "var(--color-live, #E53E3E)" }}>
                    <Radio size={12} aria-hidden /> LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ color: "var(--color-text-muted)" }}>
                    <Calendar size={12} aria-hidden /> Upcoming
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// Inline form for a minister to schedule a new session. The backend enforces
// the minister role, so a non-minister submit comes back as an error here.
function CreateSession({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("prayer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("sessions", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), category }),
      });
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="p-4 rounded-xl border mb-5 space-y-3"
      style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Session title"
        required
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none capitalize"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <ErrorNotice error={error} />
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-lg font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--color-primary)" }}
      >
        {submitting ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
