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
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Comment ça marche ?
      </h2>
      
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-card rounded-2xl p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all duration-300 border border-border animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-soft)]">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
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
