import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";

export const HeroSection = () => {
  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-8 pb-6 w-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        {/* Hero Image with enhanced styling */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <img 
            src={heroImage} 
            alt="Students collaborating with AI" 
            className="relative w-full max-w-md rounded-2xl shadow-lg hover-scale"
          />
        </div>
        
        {/* Title with gradient and sparkles */}
        <div className="flex items-center gap-2 mb-4 animate-scale-in">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Skoolife
          </h1>
          <Sparkles className="h-8 w-8 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Subtitle */}
        <p className="text-xl font-semibold mb-3 text-foreground/90 animate-fade-in" style={{ animationDelay: '100ms' }}>
          Ton assistant IA pour réviser intelligemment
        </p>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
          Import ton emploi du temps, ajoute tes examens et contraintes. L'IA crée ton planning de révisions optimal.
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg" 
          className="group shadow-lg hover:shadow-xl transition-all animate-scale-in bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          style={{ animationDelay: '300ms' }}
          onClick={() => {
            localStorage.setItem('hasSeenWelcome', 'true');
            window.location.href = '/';
          }}
        >
          Commencer maintenant
          <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};
