import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { adminAuth } from "../config/firebase";
import { User } from "../models/User";
import { LiveSession } from "../models/LiveSession";

const MAX_CHAT_LENGTH = 500;

interface SocketUserData {
  uid: string;
  role: string;
  fellowshipId: string | null;
  displayName: string;
}

interface ChatMessage {
  sessionId: string;
  authorId: string;
  displayName: string;
  body: string;
  createdAt: string;
}

let io: Server | null = null;

function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}

function fellowshipMinisterRoom(fellowshipId: string): string {
  return `fellowship:${fellowshipId}:ministers`;
}

async function authenticateSocket(socket: Socket): Promise<SocketUserData> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const user = await User.findById(decoded.uid)
    .select("role fellowshipId fullName")
    .lean<{ role: string; fellowshipId: Types.ObjectId | null; fullName: string }>();

  if (!user) {
    throw new Error("User not found");
  }

  return {
    uid: decoded.uid,
    role: user.role,
    fellowshipId: user.fellowshipId?.toString() ?? null,
    displayName: user.fullName,
  };
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN ?? true,
      credentials: true,
    },
  });

  // Reject unauthenticated sockets before any event listener is registered.
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUserData;

    if (user.role === "minister" && user.fellowshipId) {
      void socket.join(fellowshipMinisterRoom(user.fellowshipId));
    }

    socket.on("join_session", async (payload: { sessionId?: string }, ack?: (res: unknown) => void) => {
      try {
        const sessionId = payload?.sessionId;
        if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
          ack?.({ ok: false, error: "Invalid session id" });
          return;
        }

        const session = await LiveSession.findById(sessionId).select("status").lean<{ status: string }>();
        if (!session) {
          ack?.({ ok: false, error: "Session not found" });
          return;
        }
        if (session.status !== "live") {
          ack?.({ ok: false, error: "Session is not live" });
          return;
        }

        await socket.join(sessionRoom(sessionId));
        ack?.({ ok: true, sessionId });
      } catch {
        ack?.({ ok: false, error: "Could not join session" });
      }
    });

    socket.on(
      "send_message",
      async (payload: { sessionId?: string; body?: string }, ack?: (res: unknown) => void) => {
        try {
          const sessionId = payload?.sessionId;
          const body = payload?.body?.trim() ?? "";

          if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
            ack?.({ ok: false, error: "Invalid session id" });
            return;
          }
          if (!body) {
            ack?.({ ok: false, error: "Message body is required" });
            return;
          }
          if (body.length > MAX_CHAT_LENGTH) {
            ack?.({ ok: false, error: `Message must be at most ${MAX_CHAT_LENGTH} characters` });
            return;
          }

          const room = sessionRoom(sessionId);
          if (!socket.rooms.has(room)) {
            ack?.({ ok: false, error: "Join the session before sending messages" });
            return;
          }

          const message: ChatMessage = {
            sessionId,
            authorId: user.uid,
            displayName: user.displayName,
            body,
            createdAt: new Date().toISOString(),
          };

          io!.to(room).emit("chat_message", message);
          ack?.({ ok: true, message });
        } catch {
          ack?.({ ok: false, error: "Could not send message" });
        }
      }
    );
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
}
