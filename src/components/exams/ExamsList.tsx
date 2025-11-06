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

      <Card>
        <CardHeader>
          <CardTitle>Examens enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun examen enregistré. Ajoute ton premier examen !
            </p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{exam.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(exam.date).toLocaleDateString('fr-FR')} - Priorité: {exam.priority}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExam(exam.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
