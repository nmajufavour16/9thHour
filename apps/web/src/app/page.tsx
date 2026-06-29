import Logo from "../components/Logo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4">
        <Logo className="h-20 w-auto mx-auto" />
      </h1>
      <p className="text-text-secondary max-w-md">
        &ldquo;Peter and John went to the temple at the ninth hour, the hour
        of prayer.&rdquo; — Acts 3:1
      </p>
      <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/feed" className="underline" style={{ color: "var(--color-primary-light)" }}>
          Fellowship Feed
        </Link>
        <Link href="/sessions" className="underline" style={{ color: "var(--color-primary-light)" }}>
          Live Sessions
        </Link>
        <Link href="/airtime" className="underline" style={{ color: "var(--color-primary-light)" }}>
          Buy Airtime
        </Link>
      </nav>
    </main>
  );
}
