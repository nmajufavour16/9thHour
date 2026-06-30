"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Goes back to wherever the user came from (register/login, etc.). Falls back to
// the home page when there's no in-app history — e.g. the page was opened directly
// or in a fresh tab — so the button never strands the user on about:blank.
export default function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-80"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <ArrowLeft size={16} aria-hidden /> Back
    </button>
  );
}
