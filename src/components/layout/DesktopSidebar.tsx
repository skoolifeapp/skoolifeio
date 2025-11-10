import { Home, ListTodo, FileText, Calendar, User, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import skoolifeLogo from "@/assets/skoolife-logo.png";

const navItems = [
  { icon: Home, label: "Tableau de bord", path: "/" },
  { icon: ListTodo, label: "Contraintes", path: "/constraints" },
  { icon: FileText, label: "Examens", path: "/exams" },
  { icon: Calendar, label: "Planning", path: "/planning" },
  { icon: User, label: "Profil", path: "/profile" },
];

export function DesktopSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { open } = useSidebar();

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "SK";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={skoolifeLogo} alt="Skoolife" className="h-8 w-8 shrink-0" />
          {open && <span className="text-lg font-bold text-sidebar-foreground">Skoolife</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || "Utilisateur"}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
