import { Loader2, Sparkles, Check } from "lucide-react";
import { useEffect, useState } from "react";

interface GeneratingOverlayProps {
  isVisible: boolean;
  sessionCount?: number;
  isComplete?: boolean;
}

export const GeneratingOverlay = ({ isVisible, sessionCount, isComplete }: GeneratingOverlayProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isVisible || isComplete) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, isComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6 max-w-md mx-4">
        {!isComplete ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl border border-primary/20">
                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">
                Génération en cours{dots}
              </h2>
              <p className="text-muted-foreground text-lg">
                L'IA analyse tes examens et contraintes pour créer ton planning optimal
              </p>
            </div>

            <div className="flex items-center gap-3 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="font-medium">Optimisation en cours</span>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
              <div className="relative p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl border border-green-500/20 animate-scale-in">
                <Check className="h-16 w-16 text-green-500" />
              </div>
            </div>
            
            <div className="text-center space-y-3 animate-fade-in">
              <h2 className="text-3xl font-bold text-foreground">
                Planning généré !
              </h2>
              <p className="text-muted-foreground text-lg">
                {sessionCount} session{sessionCount! > 1 ? 's' : ''} de révision créée{sessionCount! > 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
