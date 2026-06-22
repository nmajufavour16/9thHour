"use client";

import { useState, FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../../lib/firebase";
import { getAuthErrorMessage } from "../../../lib/authErrors";

type Role = "believer" | "minister";

// Password rules enforced by Firebase Authentication (default policy):
// minimum 8 characters, at least one uppercase letter, at least one number.
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("believer");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ministryName, setMinistryName] = useState("");
  const [churchName, setChurchName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function syncWithBackend(
    idToken: string,
    payload: {
      fullName: string;
      username: string;
      role: Role;
      ministryName?: string;
      churchName?: string;
    }
  ) {
    const res = await fetch("/api/proxy/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        fullName: payload.fullName,
        username: payload.username,
        role: payload.role,
        ...(payload.role === "minister"
          ? { ministryName: payload.ministryName, churchName: payload.churchName }
          : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "sync-failed");
    }
    return res.json();
  }

  async function handleEmailRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Explicit JS validation — HTML `required` can be bypassed by autofill on
    // some browsers where the visible value is filled but onChange never fired.
    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim().replace(/^@/, "");

    if (!trimmedFullName) {
      setError("Please enter your full name.");
      return;
    }
    if (!trimmedUsername) {
      setError("Please enter a username (without the @ sign).");
      return;
    }

    const failing = PASSWORD_RULES.find((r) => !r.test(password));
    if (failing) {
      setError(`Password needs: ${failing.label.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      await syncWithBackend(idToken, {
        fullName: trimmedFullName,
        username: trimmedUsername,
        role,
        ...(role === "minister" ? { ministryName, churchName } : {}),
      });
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

  async function handleGoogleRegister() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const derivedUsername = (result.user.email?.split("@")[0] ?? `user-${Date.now()}`)
        .replace(/[^a-z0-9_]/gi, "")
        .slice(0, 30);
      await syncWithBackend(idToken, {
        fullName: result.user.displayName ?? "9th Hour User",
        username: derivedUsername || `user${Date.now()}`,
        role,
        ...(role === "minister" ? { ministryName, churchName } : {}),
      });
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
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-bg-primary">
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
            Create Account
          </h2>

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
              I am joining as:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["believer", "minister"] as Role[]).map((r) => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className="py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    background: role === r ? "var(--color-primary)" : "transparent",
                    borderColor: role === r ? "var(--color-primary)" : "var(--color-border)",
                    color: role === r ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  {r === "believer" ? "🙏 Believer" : "✝️ Minister"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <AuthInput label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Your full name" required />
            <AuthInput label="Username" type="text" value={username} onChange={setUsername} placeholder="@yourhandle" required />

            {role === "minister" && (
              <>
                <AuthInput label="Ministry Name" type="text" value={ministryName} onChange={setMinistryName} placeholder="e.g. Grace Covenant Ministry" required />
                <AuthInput label="Church Name" type="text" value={churchName} onChange={setChurchName} placeholder="e.g. Grace Covenant Church" required />
              </>
            )}

            <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />

            {/* Password with inline requirements */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Password
              </label>
              <input
                type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  setPasswordFocused(true);
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                }}
                onBlur={(e) => {
                  setPasswordFocused(false);
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              {/* Inline checklist — shown as soon as the field receives focus */}
              {(passwordFocused || password.length > 0) && (
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <span style={{ color: met ? "var(--color-success)" : "var(--color-text-muted)" }}>
                          {met ? "✓" : "○"}
                        </span>
                        <span style={{ color: met ? "var(--color-success)" : "var(--color-text-muted)" }}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {error && (
              <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <Divider />

          <button
            onClick={handleGoogleRegister} disabled={loading}
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
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline" style={{ color: "var(--color-primary-light)" }}>
              Sign in
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
