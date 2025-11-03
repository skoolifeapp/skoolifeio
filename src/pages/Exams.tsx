import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

interface Constraint {
  id: string;
  type: string;
  days: string[];
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [newExam, setNewExam] = useState({ subject: "", date: "", priority: "medium" });

  const addExam = () => {
    if (newExam.subject && newExam.date) {
      setExams([...exams, { ...newExam, id: Date.now().toString() }]);
      setNewExam({ subject: "", date: "", priority: "medium" });
      toast.success("Examen ajouté !");
    }
  };

  const removeExam = (id: string) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  const addConstraint = (type: string) => {
    setConstraints([...constraints, { id: Date.now().toString(), type, days: [] }]);
    toast.success("Contrainte ajoutée !");
  };

  return (
    <div className="min-h-screen pb-20 px-6 pt-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Examens & Contraintes</h1>
        <p className="text-muted-foreground mb-8">
          Configure tes examens et disponibilités
        </p>

        {/* Add Exam Section */}
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

        {/* Exams List */}
        {exams.length > 0 && (
          <Card className="p-6 mb-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold mb-4">Mes examens</h2>
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

        {/* Constraints Section */}
        <Card className="p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold mb-4">Mes contraintes</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("alternance")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Alternance
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("sport")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sport
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("job")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Job étudiant
            </Button>
          </div>

          {constraints.length > 0 && (
            <div className="mt-4 space-y-2">
              {constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <p className="font-medium capitalize">{constraint.type}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setConstraints(constraints.filter((c) => c.id !== constraint.id))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Exams;
