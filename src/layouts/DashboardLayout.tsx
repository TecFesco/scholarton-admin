import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { BrandLogo } from "@/components/BrandLogo";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Matches the main app's dashboard shell: a sticky w-64 sidebar that slides in
 * as a drawer on mobile, and a slim mobile-only top bar with the hamburger.
 * The user control + theme toggle live in the sidebar's bottom popover, so the
 * desktop layout needs no top header at all.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex bg-white dark:bg-surface-dark min-h-screen">
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden
        />
      )}

      <AppSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden">
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-btn_border_color dark:border-surface-dark-elev bg-white dark:bg-surface-dark px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="text-gray-600 dark:text-ink-dark-mid"
          >
            <Menu className="h-6 w-6" />
          </button>
          <BrandLogo className="h-6" />
        </header>

        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
