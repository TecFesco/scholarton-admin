import { AxiosError } from "axios";

/** Firebase Auth error codes → copy an admin can act on. Mirrors the main
 *  app's Api/error-handling.ts so the two stay consistent. */
export function signInErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

/** Pulls the most useful message out of an API failure. The backend's
 *  errorMiddleware returns `{ error }` or `{ message }`; AuthMiddleware
 *  short-circuits with a bare "Unauthorized" string and a 403. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      return "You do not have permission to perform this action.";
    }

    const body = error.response?.data as
      | { error?: string; message?: string }
      | string
      | undefined;

    if (typeof body === "string") {
      if (body) return body;
    } else if (body) {
      if (body.error) return body.error;
      if (body.message) return body.message;
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
