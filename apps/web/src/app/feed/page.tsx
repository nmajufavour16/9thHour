"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

interface PostAuthor {
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

interface FeedPost {
  _id: string;
  type: "announcement" | "testimony" | "prayer_point";
  body: string;
  mediaUrl: string | null;
  seedCount: number;
  createdAt: string;
  author: PostAuthor | null;
}

interface FeedResponse {
  items: FeedPost[];
  nextCursor: string | null;
}

const POST_TYPES = ["testimony", "prayer_point", "announcement"] as const;

export default function FeedPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<(typeof POST_TYPES)[number]>("testimony");
  const [submitting, setSubmitting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextCursor: string | null, append: boolean) => {
    const qs = new URLSearchParams({ limit: "20" });
    if (nextCursor) qs.set("cursor", nextCursor);

    const data = await apiFetch<FeedResponse>(`posts?${qs.toString()}`);
    setPosts((prev) => (append ? [...prev, ...data.items] : data.items));
    setCursor(data.nextCursor);
    setHasMore(Boolean(data.nextCursor));
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    setFetching(true);
    loadPage(null, false)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load feed"))
      .finally(() => setFetching(false));
  }, [loading, user, loadPage]);

  // Intersection Observer — pure chronological pagination, no ranking.
  useEffect(() => {
    if (!hasMore || loadingMore || fetching) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || !cursor) return;
        setLoadingMore(true);
        loadPage(cursor, true)
          .catch((err) => setError(err instanceof Error ? err.message : "Could not load more"))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetching, loadPage]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<FeedPost>("posts", {
        method: "POST",
        body: JSON.stringify({ body: body.trim(), type: postType }),
      });
      setPosts((prev) => [created, ...prev]);
      setBody("");
      setShowCompose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        Please <Link href="/login" className="underline ml-1">sign in</Link> to view your fellowship feed.
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Fellowship Feed
        </h1>
        <button
          onClick={() => setShowCompose((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={16} aria-hidden />
          Post
        </button>
      </div>

      {showCompose && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 rounded-xl border space-y-3"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
        >
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value as (typeof POST_TYPES)[number])}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {POST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share with your fellowship…"
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {submitting ? "Posting…" : "Share"}
          </button>
        </form>
      )}

      {error && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      {fetching ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading feed…</p>
      ) : posts.length === 0 ? (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No posts yet. Be the first to share something with your fellowship.
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post._id}
              className="p-4 rounded-xl border"
              style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {post.author?.fullName ?? "Member"}
                </span>
                <span
                  className="text-xs capitalize px-2 py-0.5 rounded-md"
                  style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}
                >
                  {post.type.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                {post.body}
              </p>
              <time
                className="block mt-2 text-xs"
                style={{ color: "var(--color-text-muted)" }}
                dateTime={post.createdAt}
              >
                {new Date(post.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
        {loadingMore && <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />}
      </div>
    </main>
  );
}
