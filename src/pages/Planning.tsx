import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Planning = () => {
  const [currentWeek, setCurrentWeek] = useState(0);

  const generatePlanning = () => {
    toast.success("Planning généré par l'IA !", {
      description: "Ton planning de révisions a été créé avec succès.",
    });
  };

  // Mock planning data
  const planningData = [
    { day: "Lundi", tasks: ["Mathématiques (2h)", "Physique (1h)"] },
    { day: "Mardi", tasks: ["Anglais (1h30)", "Histoire (1h)"] },
    { day: "Mercredi", tasks: ["Mathématiques (1h)", "Chimie (2h)"] },
    { day: "Jeudi", tasks: ["Repos"] },
    { day: "Vendredi", tasks: ["Physique (2h)", "Anglais (1h)"] },
    { day: "Samedi", tasks: ["Révision générale (3h)"] },
    { day: "Dimanche", tasks: ["Repos"] },
  ];

  return (
    <div className="min-h-screen pb-20 px-6 pt-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Planning IA</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Semaine du {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Button variant="hero" size="sm" onClick={generatePlanning}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            Semaine {currentWeek === 0 ? "actuelle" : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Planning Grid */}
        <div className="space-y-3">
          {planningData.map((day, index) => (
            <Card
              key={index}
              className="p-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-[80px]">
                  <p className="font-semibold text-primary">{day.day}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Date.now() + index * 86400000).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {day.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className={`text-sm p-2 rounded-lg ${
                        task === "Repos"
                          ? "bg-muted text-muted-foreground italic"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Conseils IA
          </h3>
          <p className="text-xs text-muted-foreground">
            Ton planning est optimisé en fonction de tes examens et contraintes. N'oublie pas de prendre des pauses régulières !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Planning;
