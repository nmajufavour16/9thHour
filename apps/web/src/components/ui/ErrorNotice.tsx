import { AlertCircle } from "lucide-react";
import { resolveError } from "@/lib/errors";

interface ErrorNoticeProps {
  // Any thrown value — an ApiError, an Error, or unknown. Rendered only when truthy.
  error: unknown;
  className?: string;
}

// Inline error banner for forms and feeds: soft error tint, subtle border, an
// icon, and a clear title / description hierarchy. Reads the dual-theme error
// token so it works in both dark and light modes. Returns null when there's no
// error, so callers can render it unconditionally.
export default function ErrorNotice({ error, className = "" }: ErrorNoticeProps) {
  if (!error) return null;
  const { title, description } = resolveError(error);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-3 ${className}`}
      style={{
        background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
        borderColor: "color-mix(in srgb, var(--color-error) 35%, transparent)",
      }}
    >
      <AlertCircle
        size={18}
        aria-hidden
        className="mt-0.5 shrink-0"
        style={{ color: "var(--color-error)" }}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
          {title}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
