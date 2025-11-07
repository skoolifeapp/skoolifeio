import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, TrendingUp } from "lucide-react";

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

export const DashboardStats = () => {
  const stats: Stat[] = [
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Examens à venir",
      value: 0,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Heures planifiées",
      value: "0h",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Sessions cette semaine",
      value: 0,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Taux de complétion",
      value: "0%",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg text-foreground">
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
