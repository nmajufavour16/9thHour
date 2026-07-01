import { ApiError } from "./api";

export interface FriendlyError {
  title: string;
  description: string;
}

// User-facing copy keyed by HTTP status. Actionable, calm, never leaks internals.
const STATUS_COPY: Record<number, FriendlyError> = {
  400: {
    title: "Check your details",
    description: "Something in that request wasn't quite right. Please review your input and try again.",
  },
  401: {
    title: "Session expired",
    description: "Your session has expired. Please sign in again to continue.",
  },
  403: {
    title: "You don't have access",
    description:
      "You don't have permission to perform this action. If you think this is a mistake, verify your account status or try signing in again.",
  },
  404: {
    title: "Not found",
    description: "We couldn't find what you were looking for. It may have been moved or removed.",
  },
  408: {
    title: "This took too long",
    description: "The request timed out. Please try again.",
  },
  409: {
    title: "That already exists",
    description: "This conflicts with something that already exists. Please adjust it and try again.",
  },
  422: {
    title: "Check your details",
    description: "Some of that information looks invalid. Please review it and try again.",
  },
  429: {
    title: "Slow down a moment",
    description: "You're doing that a little too fast. Please wait a few seconds and try again.",
  },
  500: {
    title: "Something went wrong",
    description: "Something went wrong on our end. We're looking into it—please try again shortly.",
  },
  502: {
    title: "Something went wrong",
    description: "We couldn't reach the service just now. Please try again in a moment.",
  },
  503: {
    title: "Temporarily unavailable",
    description: "The service is temporarily unavailable. Please try again in a moment.",
  },
  504: {
    title: "This took too long",
    description: "The service took too long to respond. Please try again shortly.",
  },
};

const NETWORK_ERROR: FriendlyError = {
  title: "Connection problem",
  description: "Unable to connect. Please check your internet connection and try again.",
};

const FALLBACK: FriendlyError = {
  title: "Something went wrong",
  description: "An unexpected error occurred. Please try again.",
};

// Statuses where the backend's own message is user-facing and worth surfacing
// (e.g. "Username is already taken") in place of the generic description.
const SHOW_SERVER_MESSAGE = new Set([400, 409, 422]);

// Maps any thrown value into calm, actionable copy for the UI.
export function resolveError(err: unknown): FriendlyError {
  // A deliberate string message (e.g. client-side validation) is already
  // user-facing — surface it directly.
  if (typeof err === "string" && err.trim()) {
    return { title: "Check your details", description: err };
  }

  if (err instanceof ApiError) {
    if (err.status === 0) return NETWORK_ERROR;

    const base = STATUS_COPY[err.status] ?? FALLBACK;
    if (SHOW_SERVER_MESSAGE.has(err.status) && err.serverMessage) {
      return { title: base.title, description: err.serverMessage };
    }
    return base;
  }

  if (err instanceof Error) {
    if (/not signed in|unauthenticated/i.test(err.message)) return STATUS_COPY[401];
    if (/network|failed to fetch|offline|connection/i.test(err.message)) return NETWORK_ERROR;
  }

  return FALLBACK;
}
