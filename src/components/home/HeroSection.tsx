import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-8 pb-6 animate-fade-in">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-3xl blur-3xl" />
        <img 
          src={heroImage} 
          alt="Students collaborating with AI" 
          className="relative w-full max-w-md rounded-3xl shadow-[var(--shadow-strong)]"
        />
      </div>
      
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-br from-primary via-primary-glow to-primary bg-clip-text text-transparent animate-slide-up">
        Skoolife
      </h1>
      
      <p className="text-xl font-medium text-foreground mb-3 animate-fade-in">
        Ton assistant IA pour réviser intelligemment
      </p>
      
      <p className="text-base text-muted-foreground mb-10 max-w-md leading-relaxed animate-fade-in">
        Import ton emploi du temps, ajoute tes examens et contraintes. L'IA crée ton planning de révisions optimal.
      </p>
      
      <Link to="/exams">
        <Button variant="hero" size="lg" className="group shadow-[var(--shadow-glow)]">
          Commencer maintenant
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </section>
  );
};
