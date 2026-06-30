"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "./useAuth";

export interface AppUser {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: "believer" | "minister" | "admin";
  fellowshipId: string | null;
  avatarUrl: string | null;
}

export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<AppUser>("auth/me")
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load profile"))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading, error, isAdmin: profile?.role === "admin" };
}
