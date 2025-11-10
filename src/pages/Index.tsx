import { PomodoroTimer } from "@/components/dashboard/PomodoroTimer";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe overflow-y-auto scroll-smooth">
        <div className="space-y-6 pb-6">
          <div className="pt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue sur Skoolife</p>
          </div>
          <DashboardStats />
          <PomodoroTimer />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-[var(--shadow-medium)]">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                Bienvenue sur Skoolife
              </h1>
              <p className="text-lg text-muted-foreground">
                Ton assistant IA pour réussir tes révisions sans stress
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats & Timer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DashboardStats />
        </div>
        <div className="xl:col-span-1">
          <PomodoroTimer />
        </div>
      </div>
    </div>
  );
};

export default Index;
