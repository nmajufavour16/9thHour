import { auth } from "./firebase";

// Every backend call goes through the BFF proxy. We attach the caller's Firebase
// ID token here so the Node.js firebaseAuth middleware can identify the user.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const idToken = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api/proxy/${path.replace(/^\//, "")}`, {
    ...options,
    headers,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && (payload as { error: string }).error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}
