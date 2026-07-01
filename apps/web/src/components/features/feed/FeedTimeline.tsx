"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { Plus, Loader2, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ErrorNotice from "@/components/ui/ErrorNotice";

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

function isFellowshipError(message: string): boolean {
  return /fellowship/i.test(message);
}

// Center-column timeline: cursor-paginated posts with IntersectionObserver-driven
// infinite scroll (real server paging, never client-only slicing).
export default function FeedTimeline() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [needsFellowship, setNeedsFellowship] = useState(false);
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
    setFetching(true);
    loadPage(null, false)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "";
        if (isFellowshipError(message)) setNeedsFellowship(true);
        else setError(err);
      })
      .finally(() => setFetching(false));
  }, [loadPage]);

  useEffect(() => {
    if (!hasMore || loadingMore || fetching || needsFellowship) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || !cursor) return;
        setLoadingMore(true);
        loadPage(cursor, true)
          .catch((err) => setError(err))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetching, needsFellowship, loadPage]);

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
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (needsFellowship) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-8 text-center">
        <Users size={28} className="mx-auto mb-3 text-primary-light" aria-hidden />
        <h2 className="text-lg font-semibold text-text-primary mb-1">Join a fellowship to begin</h2>
        <p className="text-sm text-text-secondary mb-4">
          Your feed, prayers, and live sessions come alive once you belong to a fellowship.
        </p>
        <Link
          href="/fellowships"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Users size={16} aria-hidden /> Find a fellowship
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">Home</h1>
        <button
          type="button"
          onClick={() => setShowCompose((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={16} aria-hidden /> Post
        </button>
      </div>

      {showCompose && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 rounded-xl border border-border bg-bg-elevated space-y-3"
        >
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value as (typeof POST_TYPES)[number])}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-bg-surface text-text-primary"
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
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-bg-surface text-text-primary resize-none"
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

      <ErrorNotice error={error} className="mb-4" />

      {fetching ? (
        <p className="text-text-muted">Loading feed…</p>
      ) : posts.length === 0 ? (
        <p className="text-text-secondary">No posts yet. Be the first to share with your fellowship.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post._id} className="p-4 rounded-xl border border-border bg-bg-elevated">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-text-primary">
                  {post.author?.fullName ?? "Member"}
                </span>
                <span className="text-xs capitalize px-2 py-0.5 rounded-md bg-bg-surface text-text-muted">
                  {post.type.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-text-secondary">{post.body}</p>
              <time className="block mt-2 text-xs text-text-muted" dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
        {loadingMore && <Loader2 size={20} className="animate-spin text-text-muted" />}
      </div>
    </div>
  );
}
