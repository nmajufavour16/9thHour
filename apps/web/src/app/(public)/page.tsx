"use client";

import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Lightweight public landing for logged-out visitors. Authenticated users are
// sent straight to the social home — the two surfaces stay distinct.
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [loading, user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-8 text-center">
      <div className="mb-6 h-20 flex items-center justify-center">
        <Logo className="h-20 w-auto" />
      </div>
      <p className="max-w-md text-sm sm:text-base leading-relaxed text-text-secondary">
        &ldquo;Peter and John went to the temple at the ninth hour, the hour of prayer.&rdquo; — Acts 3:1
      </p>
      <p className="mt-3 max-w-md text-sm text-text-muted">
        A place to pray, share, give, and belong — any hour of the day.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/register"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-text-primary"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
