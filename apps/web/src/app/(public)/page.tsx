import Logo from "@/components/ui/Logo";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/feed", label: "Fellowship Feed" },
  { href: "/sessions", label: "Live Sessions" },
  { href: "/airtime", label: "Buy Airtime" },
  { href: "/login", label: "Sign In" },
  { href: "/admin", label: "Admin" },
] as const;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-8 text-center">
      <div className="mb-6 h-20 flex items-center justify-center">
        <Logo className="h-20 w-auto" />
      </div>
      <p
        className="max-w-md text-sm sm:text-base leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        &ldquo;Peter and John went to the temple at the ninth hour, the hour
        of prayer.&rdquo; — Acts 3:1
      </p>
      <nav className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="underline underline-offset-2 py-1"
            style={{ color: "var(--color-primary-light)" }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
