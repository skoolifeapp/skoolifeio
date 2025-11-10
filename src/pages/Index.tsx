import { PomodoroTimer } from "@/components/dashboard/PomodoroTimer";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur Skoolife</p>
      </div>
      
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
