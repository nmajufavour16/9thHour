import { io, Socket } from "socket.io-client";
import { auth } from "./firebase";

let socket: Socket | null = null;

function socketUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const token = await user.getIdToken();

  if (!socket) {
    socket = io(socketUrl(), {
      auth: { token },
      autoConnect: false,
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  await new Promise<void>((resolve, reject) => {
    if (!socket) {
      reject(new Error("Socket unavailable"));
      return;
    }

    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket?.off("connect", onConnect);
      socket?.off("connect_error", onError);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
