import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/Context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Mentors from "@/pages/Mentors";
import Projects from "@/pages/Projects";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // A 403 from AuthMiddleware won't fix itself on retry — only retry once,
      // for genuinely transient network failures.
      retry: 1,
    },
  },
});

/** Wraps a page in the sidebar shell and the auth gate. */
function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Toaster position="top-right" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <AdminPage>
                    <Dashboard />
                  </AdminPage>
                }
              />
              <Route
                path="/students"
                element={
                  <AdminPage>
                    <Students />
                  </AdminPage>
                }
              />
              <Route
                path="/mentors"
                element={
                  <AdminPage>
                    <Mentors />
                  </AdminPage>
                }
              />
              <Route
                path="/projects"
                element={
                  <AdminPage>
                    <Projects />
                  </AdminPage>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
