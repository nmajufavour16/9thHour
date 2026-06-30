"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SideNav from "@/components/features/nav/SideNav";
import BottomNav from "@/components/features/nav/BottomNav";

// Authenticated app shell: global navigation (side rail on desktop/tablet, bottom
// bar on mobile) wrapping every (app) route. Unauthenticated visitors are sent to
// login — the social surfaces live strictly behind auth.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
