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
  return (
    <div className="h-full overflow-y-auto px-safe pt-safe pb-safe">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Mes examens</h1>
        <p className="text-sm text-muted-foreground">Liste de tes examens à venir</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Examens enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-base">
              Aucun examen enregistré. Ajoute ton premier examen !
            </p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-semibold truncate text-base">{exam.subject}</h3>
                    <p className="text-base text-muted-foreground">
                      {new Date(exam.date).toLocaleDateString('fr-FR')} - Priorité: {exam.priority}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExam(exam.id)}
                    className="flex-shrink-0 min-h-[48px] min-w-[48px]"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
