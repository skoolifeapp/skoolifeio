import iconImport from "@/assets/icon-import.png";
import iconAI from "@/assets/icon-ai.png";
import iconExams from "@/assets/icon-exams.png";

const features = [
  {
    icon: iconImport,
    title: "Import automatique",
    description: "Importe ton emploi du temps .ics en un clic",
  },
  {
    icon: iconAI,
    title: "Planning IA",
    description: "L'IA génère ton planning de révisions personnalisé",
  },
  {
    icon: iconExams,
    title: "Examens & Contraintes",
    description: "Ajoute tes examens, job, sport et alternance",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="px-6 py-8">
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
        Comment ça marche ?
      </h2>
      
      <div className="space-y-5">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] transition-all duration-300 border border-border/50 hover:border-primary/30 animate-slide-up group cursor-pointer hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/5 flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-soft)] group-hover:shadow-[var(--shadow-medium)] transition-all duration-300 group-hover:scale-110">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
