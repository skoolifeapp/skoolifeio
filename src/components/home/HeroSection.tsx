import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center text-center px-6 w-full max-w-lg mx-auto animate-fade-in">
      <div className="mb-6 w-full">
        <img 
          src={heroImage} 
          alt="Students collaborating with AI" 
          className="w-full h-auto rounded-2xl shadow-[var(--shadow-medium)]"
        />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Skoolife
      </h1>
      
      <p className="text-lg text-muted-foreground mb-2">
        Ton assistant IA pour réviser intelligemment
      </p>
      
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Import ton emploi du temps, ajoute tes examens et contraintes. L'IA crée ton planning de révisions optimal.
      </p>
      
      <Link to="/import">
        <Button variant="hero" size="lg" className="group">
          Commencer maintenant
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </section>
  );
};
