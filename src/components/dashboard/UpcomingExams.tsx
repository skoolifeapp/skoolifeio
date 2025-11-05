import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

interface UpcomingExamsProps {
  exams: Exam[];
}

export const UpcomingExams = ({ exams }: UpcomingExamsProps) => {
  const upcomingExams = exams
    .filter(exam => new Date(exam.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Moyenne': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Examens à venir
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        {upcomingExams.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              Aucun examen enregistré
            </p>
            <p className="text-muted-foreground/70 text-xs mt-1">
              Commence par ajouter tes examens !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors group"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {exam.subject}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(exam.date), "EEEE d MMMM", { locale: fr })}
                  </div>
                </div>
                <Badge variant="outline" className={getPriorityColor(exam.priority)}>
                  {exam.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
