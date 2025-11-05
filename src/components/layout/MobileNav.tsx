import { Home, Upload, FileText, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: Upload, label: "Import", path: "/import" },
  { icon: FileText, label: "Examens", path: "/exams" },
  { icon: Calendar, label: "Planning", path: "/planning" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[var(--shadow-strong)]">
      <div 
        className="flex justify-around items-center h-16 px-2"
        style={{
          paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom))`
        }}
      >
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[60px]",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-pulse-soft")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
