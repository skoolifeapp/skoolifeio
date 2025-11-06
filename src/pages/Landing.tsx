import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";

const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="mb-8">
          <img 
            src={heroImage} 
            alt="Étudiants utilisant Skoolife" 
            className="w-full max-w-2xl mx-auto rounded-2xl"
          />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Skoolife
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4">
          Ton assistant IA pour réviser intelligemment
        </p>
        
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Import ton emploi du temps, ajoute tes examens et contraintes. L'IA crée ton planning de révisions optimal.
        </p>
        
        <Link to="/auth">
          <Button variant="hero" size="lg" className="group text-lg px-8 py-6">
            Commencer maintenant
            <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
