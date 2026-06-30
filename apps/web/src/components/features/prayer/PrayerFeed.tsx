"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PrayerItem {
  _id: string;
  body: string;
  type: string;
  status: string;
  isAnonymousToPeers: boolean;
  requesterDisplay: string;
  prayedForCount: number;
  createdAt: string;
}

// Prayer-requests tab. Identity is masked server-side (requesterDisplay is
// "Anonymous Member" for anonymous requests); de-anonymization is a privileged
// pastoral action and is never surfaced here.
export default function PrayerFeed() {
  const [items, setItems] = useState<PrayerItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsFellowship, setNeedsFellowship] = useState(false);

  useEffect(() => {
    apiFetch<PrayerItem[]>("prayer-requests")
      .then(setItems)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load prayer requests";
        if (/fellowship/i.test(message)) setNeedsFellowship(true);
        else setError(message);
      });
  }, []);

  if (needsFellowship) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-8 text-center">
        <Users size={28} className="mx-auto mb-3 text-primary-light" aria-hidden />
        <h2 className="text-lg font-semibold text-text-primary mb-1">Join a fellowship to pray together</h2>
        <p className="text-sm text-text-secondary mb-4">
          Prayer requests are shared within your fellowship.
        </p>
        <Link
          href="/fellowships"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Users size={16} aria-hidden /> Find a fellowship
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!items) return <p className="text-text-muted">Loading prayer requests…</p>;
  if (items.length === 0) {
    return <p className="text-text-secondary">No prayer requests yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item._id} className="p-4 rounded-xl border border-border bg-bg-elevated">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-sm text-text-primary">
              {item.isAnonymousToPeers && <Lock size={13} aria-hidden className="text-text-muted" />}
              {item.requesterDisplay}
            </span>
            <span className="text-xs capitalize px-2 py-0.5 rounded-md bg-bg-surface text-text-muted">
              {item.type}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-text-secondary">{item.body}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted capitalize">{item.status}</span>
            <span className="text-xs text-text-muted">{item.prayedForCount} praying</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
