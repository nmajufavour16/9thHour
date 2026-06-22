// Maps Firebase Auth error codes to user-facing messages.
// Firebase error codes live on error.code, not error.message — always use this
// instead of surfacing error.message directly.
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      // Firebase enforces: minimum 8 characters, at least one uppercase letter,
      // at least one number. No special character required by default.
      return "Password needs at least 8 characters, one uppercase letter, and one number.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was closed before finishing.";
    case "auth/network-request-failed":
      return "Connection issue — check your internet and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
}
