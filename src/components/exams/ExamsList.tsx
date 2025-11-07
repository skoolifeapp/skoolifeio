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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-destructive/10 border-destructive/30';
    case 'medium':
      return 'bg-warning/10 border-warning/30';
    case 'low':
      return 'bg-success/10 border-success/30';
    default:
      return 'bg-muted/10 border-border';
  }
};

const getPriorityEmoji = (priority: string) => {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Faible';
    default:
      return priority;
  }
};

const getDaysUntilExam = (date: string) => {
  const examDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const ExamsList = ({ exams, removeExam }: ExamsListProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background p-4 pb-4 border-b">
        <h1 className="text-3xl font-bold mb-2">Mes examens</h1>
        <p className="text-muted-foreground text-sm">Liste de tes examens à venir</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {exams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-muted-foreground">
              Aucun examen enregistré. Ajoute ton premier examen !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => {
              const daysUntil = getDaysUntilExam(exam.date);
              return (
                <Card
                  key={exam.id}
                  className={`${getPriorityColor(exam.priority)} transition-all hover:shadow-md`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getPriorityEmoji(exam.priority)}</span>
                          <h3 className="font-bold text-lg truncate">{exam.subject}</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            📅 {new Date(exam.date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Priorité: {getPriorityLabel(exam.priority)}</span>
                            <span>•</span>
                            <span className={daysUntil <= 7 ? 'font-semibold text-destructive' : ''}>
                              {daysUntil > 0 ? `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}` : 
                               daysUntil === 0 ? "Aujourd'hui !" : 
                               'Passé'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExam(exam.id)}
                        className="flex-shrink-0 hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
