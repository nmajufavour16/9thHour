"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  NetworkQuality,
} from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, WifiOff, PhoneOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import SessionChat from "./SessionChat";
import ErrorNotice from "@/components/ui/ErrorNotice";

// Renders one Agora RTC session. The host publishes camera + mic; everyone else
// subscribes. On a poor downlink the UI drops to audio-only to stay usable on
// weak connections. Join/leave are reported to the backend for attendance.

interface TokenResponse {
  token: string;
  appId: string;
  channelName: string;
  account: string;
}

interface Props {
  sessionId: string;
  channelName: string;
  isHost: boolean;
  title: string;
  onLeave?: () => void;
}

type Phase = "connecting" | "live" | "ended" | "error";

// Agora rates downlink 0–6; 4/5/6 mean Bad / Very Bad / Down.
const POOR_DOWNLINK = 4;

export default function LiveSession({ sessionId, channelName, isHost, title, onLeave }: Props) {
  // UI state shown to the viewer.
  const [phase, setPhase] = useState<Phase>("connecting");
  const [error, setError] = useState<unknown>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Live Agora objects kept in refs so re-renders don't recreate the connection.
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localContainerRef = useRef<HTMLDivElement | null>(null);
  const audioOnlyRef = useRef(false);

  // Drops video to save bandwidth while keeping audio alive. Idempotent — the
  // network-quality event fires repeatedly, but we only switch once.
  const forceAudioOnly = useCallback(async () => {
    if (audioOnlyRef.current) return;
    audioOnlyRef.current = true;
    setAudioOnly(true);

    const client = clientRef.current;
    if (isHost) {
      const video = localVideoRef.current;
      if (client && video) {
        await client.unpublish(video).catch(() => undefined);
        video.stop();
        video.close();
        localVideoRef.current = null;
      }
      setCamOn(false);
    } else if (client) {
      for (const user of client.remoteUsers) {
        if (user.videoTrack) {
          await client.unsubscribe(user, "video").catch(() => undefined);
        }
      }
    }
  }, [isHost]);

  // Whole connection lifecycle: set up Agora, fetch a token, join, then publish
  // (host) or wait for the host (audience). Runs once per mount.
  useEffect(() => {
    // Guards against state updates after the component unmounts mid-connect.
    let cancelled = false;

    async function start() {
      // SDK is browser-only, so it's imported lazily to keep it out of SSR.
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(2);

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole(isHost ? "host" : "audience");

      // Subscribe to remote media as it appears; skip video once in audio-only.
      client.on("user-published", async (user, mediaType) => {
        if (mediaType === "video" && audioOnlyRef.current && !isHost) return;
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
        setRemoteUsers([...client.remoteUsers]);
      });

      // Keep the rendered remote list in sync as people drop or stop tracks.
      client.on("user-unpublished", () => setRemoteUsers([...client.remoteUsers]));
      client.on("user-left", () => setRemoteUsers([...client.remoteUsers]));

      // Bandwidth watchdog — degrade to audio-only when the downlink is poor.
      client.on("network-quality", (stats: NetworkQuality) => {
        if (stats.downlinkNetworkQuality >= POOR_DOWNLINK) {
          void forceAudioOnly();
        }
      });

      // Token is minted server-side; host vs audience decides publish rights.
      const role = isHost ? "host" : "audience";
      const tok = await apiFetch<TokenResponse>("agora/token", {
        method: "POST",
        body: JSON.stringify({ channelName, role }),
      });

      await client.join(tok.appId, channelName, tok.token, tok.account);
      if (cancelled) return;

      // Only the host captures and publishes local camera + mic.
      if (isHost) {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;
        if (localContainerRef.current) videoTrack.play(localContainerRef.current);
        await client.publish([audioTrack, videoTrack]);
      }

      // Best-effort attendance ping; a failure here shouldn't break the stream.
      await apiFetch(`sessions/${sessionId}/attendance/join`, { method: "POST" }).catch(
        () => undefined
      );

      if (!cancelled) setPhase("live");
    }

    start().catch((err: unknown) => {
      if (cancelled) return;
      setError(err);
      setPhase("error");
    });

    // Teardown: release tracks, leave the channel, and mark attendance left.
    return () => {
      cancelled = true;
      const client = clientRef.current;
      localVideoRef.current?.close();
      localAudioRef.current?.close();
      localVideoRef.current = null;
      localAudioRef.current = null;
      if (client) {
        client.removeAllListeners();
        client.leave().catch(() => undefined);
      }
      void apiFetch(`sessions/${sessionId}/attendance/leave`, { method: "POST" }).catch(
        () => undefined
      );
    };
    // Connect exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Host mic toggle — enabling/disabling keeps the track published.
  function toggleMic() {
    const audio = localAudioRef.current;
    if (!audio) return;
    const next = !micOn;
    void audio.setEnabled(next);
    setMicOn(next);
  }

  // Host camera toggle — disabled while forced into audio-only.
  function toggleCam() {
    const video = localVideoRef.current;
    if (!video || audioOnly) return;
    const next = !camOn;
    void video.setEnabled(next);
    setCamOn(next);
  }

  // Host ends the session for everyone; an audience member just leaves.
  async function endOrLeave() {
    if (isHost) {
      await apiFetch(`sessions/${sessionId}/end`, { method: "POST" }).catch(() => undefined);
    }
    setPhase("ended");
    onLeave?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h1>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wide"
          style={{
            background: phase === "live" ? "var(--color-live, #E53E3E)" : "var(--color-bg-elevated)",
            color: phase === "live" ? "#fff" : "var(--color-text-muted)",
          }}
        >
          {phase === "live" ? "● Live" : phase}
        </span>
      </div>

      {audioOnly && (
        <div
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
          style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
          role="status"
        >
          <WifiOff size={16} aria-hidden />
          Audio-only mode (Poor Connection)
        </div>
      )}

      <ErrorNotice error={error} />

      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden"
        style={{ background: "#000" }}
      >
        {isHost ? (
          <div ref={localContainerRef} className="w-full h-full" />
        ) : (
          <RemoteStage users={remoteUsers} audioOnly={audioOnly} phase={phase} />
        )}

        {audioOnly && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2" style={{ color: "#fff" }}>
              <Mic size={40} aria-hidden />
              <span className="text-sm opacity-80">Listening in audio-only</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {isHost && (
          <>
            <ControlButton onClick={toggleMic} active={micOn} label={micOn ? "Mute" : "Unmute"}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </ControlButton>
            <ControlButton
              onClick={toggleCam}
              active={camOn && !audioOnly}
              disabled={audioOnly}
              label={camOn ? "Stop video" : "Start video"}
            >
              {camOn && !audioOnly ? <Video size={18} /> : <VideoOff size={18} />}
            </ControlButton>
          </>
        )}
        <button
          onClick={endOrLeave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
          style={{ background: "var(--color-error, #E53E3E)" }}
        >
          <PhoneOff size={18} aria-hidden />
          {isHost ? "End session" : "Leave"}
        </button>
      </div>

      {phase === "live" && <SessionChat sessionId={sessionId} />}
    </div>
  );
}

// Audience view: shows the host's video, or a status message when there's no
// video to show (still connecting, audio-only, or host not streaming yet).
function RemoteStage({
  users,
  audioOnly,
  phase,
}: {
  users: IAgoraRTCRemoteUser[];
  audioOnly: boolean;
  phase: Phase;
}) {
  const host = users.find((u) => u.hasVideo);

  if (audioOnly || !host) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: "#fff" }}>
        <span className="text-sm opacity-70">
          {phase === "connecting"
            ? "Connecting…"
            : audioOnly
            ? ""
            : "Waiting for the host to start streaming…"}
        </span>
      </div>
    );
  }

  return <RemoteVideo user={host} />;
}

// Plays one remote user's video into its own div, and stops it on cleanup.
function RemoteVideo({ user }: { user: IAgoraRTCRemoteUser }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current && user.videoTrack) {
      user.videoTrack.play(ref.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user]);

  return <div ref={ref} className="w-full h-full" />;
}

function ControlButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex items-center justify-center w-11 h-11 rounded-full border transition-colors disabled:opacity-40"
      style={{
        background: active ? "var(--color-bg-elevated)" : "var(--color-error, #E53E3E)",
        borderColor: "var(--color-border)",
        color: active ? "var(--color-text-primary)" : "#fff",
      }}
    >
      {children}
    </button>
  );
}
