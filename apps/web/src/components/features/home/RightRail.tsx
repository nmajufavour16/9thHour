"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Flame, Users, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface SessionItem {
  _id: string;
  title?: string;
  status: string;
  scheduledAt?: string;
}

interface StreakInfo {
  prayerStreak: number;
  checkedInToday: boolean;
}

// Desktop-only right rail: active live sessions, the viewer's streak, and a
// fellowship discovery entry point. Hidden below the lg breakpoint.
export default function RightRail() {
  const { user } = useAuth();
  const [live, setLive] = useState<SessionItem[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useEffect(() => {
    apiFetch<SessionItem[]>("sessions")
      .then((sessions) => setLive(sessions.filter((s) => s.status === "live")))
      .catch(() => {});
    if (user) {
      apiFetch<StreakInfo>("streak/me")
        .then(setStreak)
        .catch(() => {});
    }
  }, [user]);

  return (
    <aside className="hidden lg:block w-72 shrink-0 border-l border-border p-4 space-y-6">
      <section>
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          <Radio size={14} aria-hidden className="text-live" /> Live now
        </h2>
        {live.length === 0 ? (
          <p className="text-sm text-text-muted">No sessions are live right now.</p>
        ) : (
          <ul className="space-y-2">
            {live.map((s) => (
              <li key={s._id}>
                <Link
                  href={`/sessions/${s._id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary hover:opacity-90"
                >
                  <span className="truncate">{s.title ?? "Live session"}</span>
                  <span className="ml-2 inline-block h-2 w-2 shrink-0 rounded-full bg-live" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          <Flame size={14} aria-hidden className="text-gold" /> Your streak
        </h2>
        <div className="rounded-lg border border-border bg-bg-elevated px-3 py-3">
          {user ? (
            <>
              <p className="text-2xl font-bold text-text-primary">
                {streak ? streak.prayerStreak : "—"}
                <span className="ml-1 text-sm font-normal text-text-muted">days</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {streak?.checkedInToday ? "Checked in today 🙏" : "Pray today to keep it going"}
              </p>
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              <Link href="/login" className="underline" style={{ color: "var(--color-primary-light)" }}>
                Sign in
              </Link>{" "}
              to track your prayer streak.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          <Users size={14} aria-hidden className="text-primary-light" /> Fellowships
        </h2>
        <Link
          href="/fellowships"
          className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary hover:opacity-90"
        >
          Discover fellowships
          <ChevronRight size={16} aria-hidden className="text-text-muted" />
        </Link>
      </section>
    </aside>
  );
}
