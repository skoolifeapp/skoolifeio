import { PomodoroTimer } from "@/components/dashboard/PomodoroTimer";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

const Index = () => {
  return (
    <div className="h-[100dvh] flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe overflow-y-auto scroll-smooth">
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue sur Skoolife</p>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Pomodoro Timer */}
        <PomodoroTimer />
      </div>
    </div>
  );
};

export default Index;
