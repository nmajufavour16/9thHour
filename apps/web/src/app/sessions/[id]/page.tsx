"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Radio } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";
import LiveSession from "../../../components/LiveSession";

interface SessionDetail {
  _id: string;
  ministerId: string;
  title: string;
  category: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  agoraChannelName: string;
  scheduledAt: string;
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [starting, setStarting] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<SessionDetail>(`sessions/${params.id}`);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load session");
    }
  }

  useEffect(() => {
    if (!loading && user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, params.id]);

  if (!loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        Please <Link href="/login" className="underline ml-1">sign in</Link> to join.
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <Link href="/sessions" className="underline text-sm" style={{ color: "var(--color-primary-light)" }}>
          Back to sessions
        </Link>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
        Loading…
      </main>
    );
  }

  const isHost = !!user && session.ministerId === user.uid;

  async function startSession() {
    setStarting(true);
    try {
      await apiFetch(`sessions/${session!._id}/start`, { method: "POST" });
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session");
    } finally {
      setStarting(false);
    }
  }

  const canRenderStage = joined || session.status === "live";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {canRenderStage ? (
        <LiveSession
          sessionId={session._id}
          channelName={session.agoraChannelName}
          isHost={isHost}
          title={session.title}
          onLeave={() => router.push("/sessions")}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center mt-16">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {session.title}
          </h1>
          <p className="text-sm capitalize" style={{ color: "var(--color-text-muted)" }}>
            {session.category} · {session.status}
          </p>

          {isHost && session.status === "scheduled" ? (
            <button
              onClick={startSession}
              disabled={starting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--color-live, #E53E3E)" }}
            >
              <Radio size={18} aria-hidden />
              {starting ? "Starting…" : "Go Live"}
            </button>
          ) : session.status === "scheduled" ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              The host hasn&apos;t started yet. Check back at{" "}
              {new Date(session.scheduledAt).toLocaleString()}.
            </p>
          ) : (
            <p style={{ color: "var(--color-text-secondary)" }}>This session has {session.status}.</p>
          )}

          <Link href="/sessions" className="underline text-sm" style={{ color: "var(--color-primary-light)" }}>
            Back to sessions
          </Link>
        </div>
      )}
    </main>
  );
}
