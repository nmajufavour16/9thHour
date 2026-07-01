"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Palette,
  User as UserIcon,
  ShieldCheck,
  Bell,
  Lock,
  Wallet as WalletIcon,
  AlertTriangle,
  Check,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, ThemePreference } from "@/components/ui/ThemeProvider";
import RequireAuth from "@/components/features/auth/RequireAuth";
import ErrorNotice from "@/components/ui/ErrorNotice";
import Toggle from "@/components/ui/Toggle";

interface NotificationPrefs {
  prayerResponses: boolean;
  liveSessions: boolean;
  fellowshipActivity: boolean;
}
interface Privacy {
  anonymousPrayerDefault: boolean;
  profileVisibility: "public" | "fellowship" | "private";
}
interface Profile {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: "believer" | "minister" | "admin";
  avatarUrl: string | null;
  bio?: string;
  notificationPrefs?: NotificationPrefs;
  privacy?: Privacy;
}

const DEFAULT_PREFS: NotificationPrefs = {
  prayerResponses: true,
  liveSessions: true,
  fellowshipActivity: true,
};
const DEFAULT_PRIVACY: Privacy = { anonymousPrayerDefault: false, profileVisibility: "fellowship" };

function patchProfile(body: Record<string, unknown>) {
  return apiFetch<Profile>("auth/me", { method: "PATCH", body: JSON.stringify(body) });
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}

function SettingsInner() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiFetch<Profile>("auth/me").then(setProfile).catch(setError);
  }, []);

  return (
    <main className="px-4 py-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <ErrorNotice error={error} />

      <AppearanceSection />

      {profile ? (
        <>
          <ProfileSection profile={profile} onSaved={setProfile} />
          <AccountSection profile={profile} />
          <NotificationsSection profile={profile} onSaved={setProfile} />
          <PrivacySection profile={profile} onSaved={setProfile} />
          <WalletSection />
          <DangerZone signOut={signOut} />
        </>
      ) : (
        !error && <p className="text-text-muted">Loading your settings…</p>
      )}
    </main>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Palette;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-bg-elevated p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">
        <Icon size={16} aria-hidden className="text-primary-light" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg text-sm border border-border bg-bg-surface text-text-primary outline-none";

function AppearanceSection() {
  const { preference, setPreference } = useTheme();
  const options: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];
  return (
    <Card icon={Palette} title="Appearance">
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-bg-surface">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setPreference(o.value)}
            aria-pressed={preference === o.value}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              preference === o.value
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ProfileSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await patchProfile({ fullName, username, avatarUrl: avatarUrl || null, bio });
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card icon={UserIcon} title="Profile">
      <form onSubmit={save} className="space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-bg-surface capitalize text-text-secondary">
            {profile.role}
          </span>
        </div>
        <label className="block">
          <span className="text-xs text-text-secondary">Display name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-xs text-text-secondary">Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-xs text-text-secondary">Avatar URL</span>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs text-text-secondary">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            className={`${inputClass} resize-none`}
          />
        </label>
        {error ? <ErrorNotice error={error} /> : null}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check size={14} aria-hidden /> Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  password: "Email & password",
  "google.com": "Google",
};

function AccountSection({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const providers = auth.currentUser?.providerData.map((p) => p.providerId) ?? [];

  async function resetPassword() {
    setSending(true);
    setStatus(null);
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setStatus("Password reset email sent.");
    } catch {
      setStatus("Could not send the reset email. Try again shortly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card icon={ShieldCheck} title="Account">
      <Row title="Email">
        <span className="text-sm text-text-secondary truncate">{profile.email}</span>
      </Row>
      <Row title="Password" description="We'll email you a secure reset link.">
        <button
          type="button"
          onClick={resetPassword}
          disabled={sending}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-primary disabled:opacity-50"
        >
          {sending ? "Sending…" : "Reset password"}
        </button>
      </Row>
      <Row title="Connected sign-in">
        <span className="text-sm text-text-secondary">
          {providers.length ? providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ") : "—"}
        </span>
      </Row>
      {status && <p className="text-xs text-text-secondary mt-1">{status}</p>}
    </Card>
  );
}

function NotificationsSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const prefs = profile.notificationPrefs ?? DEFAULT_PREFS;
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function update(key: keyof NotificationPrefs, value: boolean) {
    setSaving(key);
    setError(null);
    try {
      const updated = await patchProfile({ notificationPrefs: { [key]: value } });
      onSaved(updated);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(null);
    }
  }

  const items: { key: keyof NotificationPrefs; title: string; description: string }[] = [
    { key: "prayerResponses", title: "Prayer responses", description: "When someone prays for your request." },
    { key: "liveSessions", title: "Live sessions", description: "When a session goes live." },
    { key: "fellowshipActivity", title: "Fellowship activity", description: "New posts and announcements." },
  ];

  return (
    <Card icon={Bell} title="Notifications">
      {items.map((it) => (
        <Row key={it.key} title={it.title} description={it.description}>
          <Toggle
            label={it.title}
            checked={prefs[it.key]}
            disabled={saving === it.key}
            onChange={(v) => update(it.key, v)}
          />
        </Row>
      ))}
      {error ? <ErrorNotice error={error} /> : null}
    </Card>
  );
}

function PrivacySection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const privacy = profile.privacy ?? DEFAULT_PRIVACY;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function update(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchProfile({ privacy: body });
      onSaved(updated);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card icon={Lock} title="Privacy">
      <Row
        title="Post prayers anonymously by default"
        description="New prayer requests hide your identity from peers."
      >
        <Toggle
          label="Anonymous prayers by default"
          checked={privacy.anonymousPrayerDefault}
          disabled={saving}
          onChange={(v) => update({ anonymousPrayerDefault: v })}
        />
      </Row>
      <Row title="Profile visibility" description="Who can see your profile.">
        <select
          value={privacy.profileVisibility}
          disabled={saving}
          onChange={(e) => update({ profileVisibility: e.target.value })}
          className="px-3 py-1.5 rounded-lg text-sm border border-border bg-bg-surface text-text-primary"
        >
          <option value="public">Public</option>
          <option value="fellowship">Fellowship</option>
          <option value="private">Private</option>
        </select>
      </Row>
      {error ? <ErrorNotice error={error} /> : null}
    </Card>
  );
}

function WalletSection() {
  return (
    <Card icon={WalletIcon} title="Wallet">
      <p className="text-sm text-text-secondary mb-3">
        Payout details are handled securely by our payment provider — no card numbers are ever stored here.
      </p>
      <Link
        href="/wallet"
        className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-primary"
      >
        Open wallet & history
      </Link>
    </Card>
  );
}

function DangerZone({ signOut }: { signOut: () => Promise<void> }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  async function requestDeletion() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("auth/deletion-request", { method: "POST" });
      setRequested(true);
      setConfirming(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-xl border p-5"
      style={{
        borderColor: "color-mix(in srgb, var(--color-error) 35%, transparent)",
        background: "color-mix(in srgb, var(--color-error) 6%, transparent)",
      }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--color-error)" }}>
        <AlertTriangle size={16} aria-hidden />
        Danger zone
      </h2>

      <Row title="Sign out" description="End your session on this device.">
        <button
          type="button"
          onClick={handleSignOut}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-primary"
        >
          Sign out
        </button>
      </Row>

      <Row title="Delete account" description="Submit a request for account deletion.">
        {requested ? (
          <span className="text-xs text-text-secondary">Request received.</span>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestDeletion}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--color-error)" }}
            >
              {busy ? "Submitting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ color: "var(--color-error)", borderColor: "var(--color-error)", borderWidth: 1 }}
          >
            Request deletion
          </button>
        )}
      </Row>
      {error ? <ErrorNotice error={error} /> : null}
    </section>
  );
}
