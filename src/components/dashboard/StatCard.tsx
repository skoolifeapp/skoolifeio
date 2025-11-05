import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: string;
  iconColor?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  gradient = "from-primary/10 to-transparent",
  iconColor = "text-primary"
}: StatCardProps) => {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 hover-scale">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <Icon className={`h-5 w-5 ${iconColor} opacity-80`} />
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
