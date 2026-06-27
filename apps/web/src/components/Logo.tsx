// Brand wordmark for header positions. Renders both theme variants and lets CSS
// (see globals.css) reveal the right one per data-theme, so it works in server
// components and never flashes the wrong logo on first paint.
export default function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.svg"
        alt="9th Hour"
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        className={`logo-dark-only ${className}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.svg"
        alt="9th Hour"
        fetchPriority="high"
        loading="eager"
        decoding="sync"
        className={`logo-light-only ${className}`}
      />
    </>
  );
}
