import { Flame, Award } from "lucide-react";

export const HeaderStreak = () => {
  return (
    <div className="safe-area-top bg-card border-b border-border">
      <div className="container-responsive py-2 flex items-center justify-end gap-2">
        <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-semibold">
          <Flame className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">12</span>
          <span className="xs:hidden">12</span>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
          <Award className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">60</span>
          <span className="xs:hidden">60</span>
        </div>
      </div>
    </div>
  );
};
