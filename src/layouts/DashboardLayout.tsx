import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/Context/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <h1 className="truncate text-sm font-medium text-muted-foreground sm:text-base">
                {user?.email ?? ""}
              </h1>
            </div>
            <ThemeToggle />
          </header>
          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
