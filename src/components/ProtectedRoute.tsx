import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/Context/AuthContext";

/**
 * Gates the console behind a signed-in Firebase user.
 *
 * This is *authentication only*. The API has no admin role yet — its
 * AuthMiddleware accepts any valid Firebase ID token, so a student's token
 * reaches the same endpoints. Adding a `requireAdmin` middleware plus a custom
 * claim on the API is tracked in README.md under "Known API gaps".
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loader" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
