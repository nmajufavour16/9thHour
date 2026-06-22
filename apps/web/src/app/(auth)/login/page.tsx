"use client";

import { useState, FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../../lib/firebase";
import { getAuthErrorMessage } from "../../../lib/authErrors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : "unknown";
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Only sync on the very first Google sign-in (creationTime === lastSignInTime).
      const isFirstLogin =
        result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

      if (isFirstLogin) {
        const derivedUsername = result.user.email?.split("@")[0] ?? `user-${Date.now()}`;
        const res = await fetch("/api/proxy/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            fullName: result.user.displayName ?? "9th Hour User",
            username: derivedUsername,
            role: "believer",
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "sync-failed");
        }
      }

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(getAuthErrorMessage(err.code));
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-4xl font-bold mb-2" style={{ color: "var(--color-gold)" }}>
            9th Hour
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            The Hour of Prayer is Now
          </p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>
            Sign In
          </h2>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

            {error && (
              <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <Divider />

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-medium text-sm transition-colors disabled:opacity-60"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
              background: "var(--color-bg-elevated)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium underline" style={{ color: "var(--color-primary-light)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function AuthInput({
  label, type, value, onChange, placeholder, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
      />
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>or</span>
      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
