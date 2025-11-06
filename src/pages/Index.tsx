import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-[100dvh] safe-area-inset-bottom pt-safe px-safe py-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Bienvenue sur Skoolife</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="hover:shadow-[var(--shadow-medium)] transition-all touch-manipulation active:scale-[0.98]">
            <CardHeader className="pb-3">
              <Calendar className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Emploi du temps</CardTitle>
              <CardDescription className="text-base">Importe ton calendrier scolaire</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/import">
                <Button variant="outline" className="w-full group">
                  Importer
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-medium)] transition-all touch-manipulation active:scale-[0.98]">
            <CardHeader className="pb-3">
              <BookOpen className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Examens</CardTitle>
              <CardDescription className="text-base">Gère tes examens et contraintes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/exams">
                <Button variant="outline" className="w-full group">
                  Voir les examens
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--shadow-medium)] transition-all touch-manipulation active:scale-[0.98]">
            <CardHeader className="pb-3">
              <Target className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Planning IA</CardTitle>
              <CardDescription className="text-base">Ton planning de révisions optimal</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/planning">
                <Button variant="outline" className="w-full group">
                  Voir le planning
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 mt-2">
          <CardHeader className="pb-3">
            <CardTitle>Commencer avec Skoolife</CardTitle>
            <CardDescription className="text-base">Suis ces étapes pour créer ton planning de révisions optimal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <p className="text-base leading-relaxed">Importe ton emploi du temps au format .ics</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <p className="text-base leading-relaxed">Ajoute tes examens avec leur date et difficulté</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <p className="text-base leading-relaxed">Génère ton planning de révisions avec l'IA</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
