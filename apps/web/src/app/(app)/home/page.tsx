"use client";

import { useState } from "react";
import FeedTimeline from "@/components/features/feed/FeedTimeline";
import PrayerFeed from "@/components/features/prayer/PrayerFeed";
import RightRail from "@/components/features/home/RightRail";

type Tab = "feed" | "prayers";

const TABS: { key: Tab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "prayers", label: "Prayers" },
];

// Feed-first social home: center timeline (Feed / Prayers) plus the desktop right rail.
export default function HomePage() {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5 inline-flex rounded-lg border border-border p-0.5 bg-bg-surface">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? "bg-bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "feed" ? <FeedTimeline /> : <PrayerFeed />}
      </div>

      <RightRail />
    </div>
  );
}
