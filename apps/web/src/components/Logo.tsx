import Image from "next/image";

// Both theme variants render in the markup; globals.css shows the one that
// matches data-theme. PNGs are preloaded in layout so the wordmark paints with
// the page instead of popping in after a late SVG fetch.
const LOGO_WIDTH = 900;
const LOGO_HEIGHT = 480;

export default function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo-dark.png"
        alt="9th Hour"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        className={`logo-dark-only ${className}`}
      />
      <Image
        src="/logo-light.png"
        alt="9th Hour"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        className={`logo-light-only ${className}`}
      />
    </>
  );
}
