import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderKanban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { NavLink } from "@/components/NavLink";
import { BrandLogo } from "@/components/BrandLogo";
import { SidebarProfileMenu } from "@/components/SidebarProfileMenu";
import { useAuth } from "@/Context/AuthContext";
import { useAdminName } from "@/hooks/useAdminName";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Students", url: "/students", icon: Users, end: false },
  { title: "Mentors", url: "/mentors", icon: UserCog, end: false },
  { title: "Projects", url: "/projects", icon: FolderKanban, end: false },
];

/** First letters of the first two words, e.g. "Pelumi Aniyajuwon" → "PA". */
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

interface AppSidebarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

export function AppSidebar({ menuOpen, setMenuOpen }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const name = useAdminName();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Signed out.");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <aside
      className={`bg-[#FAFAFA] dark:bg-surface-dark-card w-64 h-screen fixed md:sticky top-0 p-6 transition-transform border-r border-r-btn_border_color dark:border-r-surface-dark-elev flex flex-col z-50 ${
        menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-start mb-8">
        <BrandLogo className="w-32" />
      </div>

      <nav className="flex flex-col items-start space-y-1 flex-grow overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className="flex items-center text-sm font-semibold p-3 w-full rounded-xl transition-all text-gray-500 dark:text-ink-dark-mid hover:bg-gray-50 dark:hover:bg-white/5"
            activeClassName="bg-blue-50 dark:bg-btn_bg_dark/20 text-[#3b82f6] dark:text-btn_bg_dark shadow-sm hover:bg-blue-50 dark:hover:bg-btn_bg_dark/20"
          >
            <item.icon className="mr-3 h-5 w-5 opacity-80" />
            <span className="flex-1">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-surface-dark-elev">
        <SidebarProfileMenu
          name={name}
          email={user?.email ?? undefined}
          initials={initialsFor(name)}
          onLogout={handleLogout}
        />
      </div>
    </aside>
  );
}
