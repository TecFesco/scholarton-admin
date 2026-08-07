import { useEffect, useRef, useState } from "react";
import { ChevronUp, LogOut, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/Store/useThemeStore";

interface SidebarProfileMenuProps {
  name: string;
  email?: string;
  initials: string;
  onLogout: () => void;
}

/**
 * The sidebar's bottom user control — a mirror of the main app's
 * SidebarProfileMenu (avatar/initials + name + email, chevron, pop-up menu).
 * Trimmed to the actions the admin console actually has: theme toggle and
 * logout (there are no admin profile/settings pages to link to). Uses lucide
 * icons instead of react-icons so no new dependency is pulled in.
 */
export function SidebarProfileMenu({
  name,
  email,
  initials,
  onLogout,
}: SidebarProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-surface-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-surface-dark-elev py-1 z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => toggleTheme()}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-ink-dark-mid hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-gray-400" />
            )}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <div className="my-1 border-t border-gray-100 dark:border-surface-dark-elev" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-btn_bg_dark/30 text-btn_bg dark:text-ink-dark-hi flex items-center justify-center font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-ink-dark-hi truncate">
            {name}
          </p>
          {email && (
            <p className="text-[10px] text-gray-400 dark:text-ink-dark-lo truncate">
              {email}
            </p>
          )}
        </div>
        <ChevronUp
          className={`text-gray-300 dark:text-ink-dark-lo h-3 w-3 transition-transform ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>
    </div>
  );
}
