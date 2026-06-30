// Brand mark — PNG variants swap per theme via globals.css. The old SVG exports
// were ~600KB each (embedded raster); these load instantly on the homepage.
export default function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="9th Hour"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="logo-dark-only h-full w-auto max-h-full object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt=""
        aria-hidden
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="logo-light-only h-full w-auto max-h-full object-contain"
      />
    </span>
  );
}
