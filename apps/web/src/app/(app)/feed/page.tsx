"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The feed now lives on the social home. Keep this path working for bookmarks.
export default function FeedRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}
