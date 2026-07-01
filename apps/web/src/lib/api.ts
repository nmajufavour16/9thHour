import { auth } from "./firebase";

// Thrown by apiFetch on any non-OK response or transport failure. Carries the
// HTTP status (0 = network/no response) and the raw server message so the UI
// can map it to friendly copy (see lib/errors.ts) instead of leaking it.
export class ApiError extends Error {
  status: number;
  serverMessage?: string;

  constructor(status: number, message: string, serverMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

// Every backend call goes through the BFF proxy. We attach the caller's Firebase
// ID token here so the Node.js firebaseAuth middleware can identify the user.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Attach the caller's Firebase token when signed in; public reads (feed, live
  // sessions) work without one. Writes are enforced server-side and 401 if absent.
  const user = auth.currentUser;
  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`/api/proxy/${path.replace(/^\//, "")}`, {
      ...options,
      headers,
    });
  } catch {
    // fetch only rejects on transport failure (offline, DNS, CORS) — no status.
    throw new ApiError(0, "Network request failed");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const serverMessage =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : undefined;
    throw new ApiError(res.status, serverMessage || `Request failed (${res.status})`, serverMessage);
  }

  return payload as T;
}
