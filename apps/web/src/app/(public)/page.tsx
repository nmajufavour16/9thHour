"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Branded onboarding splash: the site opens here, shows the mark + what 9th Hour
// is, plays a short loading animation, then heads into the feed. No login wall —
// auth-gating happens per protected page.
export default function Landing() {
  const router = useRouter();
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    // Kick the progress fill on the next frame so the transition animates.
    const raf = requestAnimationFrame(() => setFilling(true));
    const timer = setTimeout(() => router.replace("/home"), 1800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-7">
      <div className="animate-[fadeInUp_0.6s_ease-out]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.svg" alt="9th Hour" className="h-16 sm:h-20 w-auto" />
      </div>

      <div className="max-w-md space-y-2 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
        <p className="text-lg sm:text-xl font-semibold text-text-primary">
          A place to pray, share, give, and belong — any hour of the day.
        </p>
        <p className="text-sm italic text-text-secondary">
          &ldquo;Peter and John went to the temple at the ninth hour, the hour of prayer.&rdquo; — Acts 3:1
        </p>
      </div>

      <div
        className="w-56 h-1.5 rounded-full overflow-hidden animate-[fadeInUp_0.6s_ease-out_0.2s_both]"
        style={{ background: "var(--color-border)" }}
        role="progressbar"
        aria-label="Loading 9th Hour"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: filling ? "100%" : "0%",
            transition: "width 1.7s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "linear-gradient(90deg, var(--color-primary), var(--color-gold))",
          }}
        />
      </div>
    </main>
  );
}
