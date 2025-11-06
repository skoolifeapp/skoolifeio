import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

interface ExamsListProps {
  exams: Exam[];
  removeExam: (id: string) => void;
}

export const ExamsList = ({ exams, removeExam }: ExamsListProps) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-primary';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-destructive/10 border-destructive/20';
      case 'medium': return 'bg-primary/10 border-primary/20';
      case 'low': return 'bg-secondary border-border/50';
      default: return 'bg-secondary border-border/50';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-24">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">Mes examens</h1>
        <p className="text-muted-foreground text-base">Liste de tes examens à venir</p>
      </div>

      {exams.length === 0 ? (
        <Card className="border-border/50 animate-slide-up">
          <CardContent className="py-16">
            <p className="text-center text-muted-foreground">
              Aucun examen enregistré. Ajoute ton premier examen !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam, index) => (
            <div
              key={exam.id}
              className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all duration-300 hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 animate-slide-up group ${getPriorityBg(exam.priority)}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate mb-1">{exam.subject}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(exam.date).toLocaleDateString('fr-FR', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className={`font-medium ${getPriorityColor(exam.priority)}`}>
                    {exam.priority === 'high' ? '🔴 Haute' : exam.priority === 'medium' ? '🟡 Moyenne' : '🟢 Faible'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExam(exam.id)}
                className="hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
