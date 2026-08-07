import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/Context/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * Gates the console behind a signed-in Firebase user who ALSO carries the
 * `admin: true` custom claim. The API enforces the same claim via its
 * requireAdmin middleware, so this is the UI half of a two-sided gate — a
 * non-admin can't get in here, and couldn't call the admin endpoints anyway.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
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

  // Authenticated but not an admin — a real account in the shared Firebase pool
  // that simply hasn't been granted access. Don't bounce to /login (they'd just
  // land right back here); show a dead end with a way out.
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account doesn&apos;t have admin access to the Scholarton console.
          Ask an existing admin to grant it, then sign in again.
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
