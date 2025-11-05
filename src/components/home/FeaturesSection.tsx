import iconImport from "@/assets/icon-import.png";
import iconAI from "@/assets/icon-ai.png";
import iconExams from "@/assets/icon-exams.png";
import { FileUp, Brain, Calendar } from "lucide-react";

const features = [
  {
    icon: iconImport,
    lucideIcon: FileUp,
    title: "Import automatique",
    description: "Importe ton emploi du temps .ics en un clic",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    iconColor: "text-blue-500",
  },
  {
    icon: iconAI,
    lucideIcon: Brain,
    title: "Planning IA",
    description: "L'IA génère ton planning de révisions personnalisé",
    gradient: "from-primary/10 via-primary/5 to-transparent",
    iconColor: "text-primary",
  },
  {
    icon: iconExams,
    lucideIcon: Calendar,
    title: "Examens & Contraintes",
    description: "Ajoute tes examens, job, sport et alternance",
    gradient: "from-accent/10 via-accent/5 to-transparent",
    iconColor: "text-accent",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="relative px-6 py-8 w-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-primary/5 pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
          Comment ça marche ?
        </h2>
        <p className="text-center text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          Trois étapes simples pour optimiser tes révisions
        </p>
        
        <div className="space-y-4 max-w-lg mx-auto">
          {features.map((feature, index) => {
            const LucideIcon = feature.lucideIcon;
            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover-scale group animate-fade-in"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
                
                <div className="relative p-5 flex items-start gap-4">
                  {/* Icon container */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-md border">
                      <img 
                        src={feature.icon} 
                        alt={feature.title}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    {/* Small lucide icon badge */}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-background flex items-center justify-center ${feature.iconColor}`}>
                      <LucideIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-muted-foreground/30">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-lg">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
