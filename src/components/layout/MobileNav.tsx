import { Home, ListTodo, FileText, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: ListTodo, label: "Contraintes", path: "/constraints" },
  { icon: FileText, label: "Examens", path: "/exams" },
  { icon: Calendar, label: "Planning", path: "/planning" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[var(--shadow-strong)]" style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center justify-center p-3 rounded-lg transition-all duration-300",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "animate-pulse-soft")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
