"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The site opens straight onto the feed-first social home for everyone —
// no marketing splash, no login wall. Auth-gating happens per protected page.
export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>
  );
}
