"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { connectSocket, getSocket } from "../lib/socket";

interface ChatMessage {
  sessionId: string;
  authorId: string;
  displayName: string;
  body: string;
  createdAt: string;
}

interface Props {
  sessionId: string;
}

export default function SessionChat({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    connectSocket()
      .then((sock) => {
        if (!active) return;

        sock.emit("join_session", { sessionId }, (res: { ok?: boolean; error?: string }) => {
          if (!active) return;
          if (res?.ok) {
            setConnected(true);
            setError(null);
          } else {
            setError(res?.error ?? "Could not join chat");
          }
        });

        const onMessage = (msg: ChatMessage) => {
          if (msg.sessionId === sessionId) {
            setMessages((prev) => [...prev, msg]);
          }
        };

        sock.on("chat_message", onMessage);

        return () => {
          sock.off("chat_message", onMessage);
        };
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Chat unavailable");
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const body = input.trim();
    if (!body || !connected) return;

    const sock = getSocket();
    if (!sock) return;

    sock.emit(
      "send_message",
      { sessionId, body },
      (res: { ok?: boolean; error?: string }) => {
        if (res?.ok) {
          setInput("");
          setError(null);
        } else {
          setError(res?.error ?? "Could not send message");
        }
      }
    );
  }

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}
    >
      <div
        className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
      >
        Live chat {connected ? "" : "· connecting…"}
      </div>

      <div className="h-40 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Say hello to everyone in the session.
          </p>
        ) : (
          messages.map((msg) => (
            <div key={`${msg.createdAt}-${msg.authorId}-${msg.body}`} className="text-sm">
              <span className="font-semibold" style={{ color: "var(--color-primary-light)" }}>
                {msg.displayName}
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}> · {msg.body}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-3 text-xs" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      <form
        className="flex gap-2 p-2 border-t"
        style={{ borderColor: "var(--color-border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Send a message…"
          disabled={!connected}
          className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none disabled:opacity-60"
          style={{
            background: "var(--color-bg)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="px-3 py-2 rounded-lg disabled:opacity-40"
          style={{ background: "var(--color-primary)", color: "#fff" }}
          aria-label="Send message"
        >
          <Send size={16} aria-hidden />
        </button>
      </form>
    </div>
  );
}
