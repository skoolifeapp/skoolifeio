import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

interface AddExamSectionProps {
  exams: Exam[];
  newExam: { subject: string; date: string; priority: string };
  setNewExam: (exam: { subject: string; date: string; priority: string }) => void;
  addExam: () => void;
  removeExam: (id: string) => void;
}

export const AddExamSection = ({ exams, newExam, setNewExam, addExam, removeExam }: AddExamSectionProps) => {
  return (
    <div className="px-6 pt-6 pb-20 h-full overflow-y-auto">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mes examens</h1>
        <p className="text-muted-foreground mb-8">
          Ajoute tes examens à venir
        </p>

        <Card className="p-6 mb-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold mb-4">Ajouter un examen</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Matière</Label>
              <Input
                id="subject"
                value={newExam.subject}
                onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                placeholder="Ex: Mathématiques"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date">Date de l'examen</Label>
              <Input
                id="date"
                type="date"
                value={newExam.date}
                onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={newExam.priority}
                onValueChange={(value) => setNewExam({ ...newExam, priority: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addExam} className="w-full" variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter l'examen
            </Button>
          </div>
        </Card>

        {exams.length > 0 && (
          <Card className="p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold mb-4">Liste des examens</h2>
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{exam.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(exam.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExam(exam.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
