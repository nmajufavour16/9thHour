"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import RequireAuth from "@/components/features/auth/RequireAuth";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <main className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Profile</h1>
        <p className="text-sm text-text-secondary mb-5">Manage your profile and account.</p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Settings size={16} aria-hidden /> Open settings
        </Link>
      </main>
    </RequireAuth>
  );
}
