import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Settings, Sparkles } from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

export const QuickActions = () => {
  const actions: QuickAction[] = [
    {
      icon: <Calendar className="h-6 w-6" />,
      label: "Mes examens",
      href: "/exams",
      color: "bg-primary text-primary-foreground",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      label: "Planning IA",
      href: "/planning",
      color: "bg-accent text-accent-foreground",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: "Contraintes",
      href: "/constraints",
      color: "bg-secondary text-secondary-foreground",
    },
    {
      icon: <Settings className="h-6 w-6" />,
      label: "Profil",
      href: "/profile",
      color: "bg-muted text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <Link key={index} to={action.href}>
          <Card className="border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all cursor-pointer group">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform shadow-[var(--shadow-soft)]`}>
                {action.icon}
              </div>
              <p className="text-sm font-medium text-foreground">
                {action.label}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
