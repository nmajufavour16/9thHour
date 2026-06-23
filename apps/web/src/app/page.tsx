import Logo from "../components/Logo";

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
      <p className="mt-6 text-sm text-text-muted font-mono">
        Page Contents coming up soon...
      </p>
    </main>
  );
}
