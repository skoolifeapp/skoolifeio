import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const AddExamOrConstraint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"select" | "exam" | "constraint">("select");
  const [newExam, setNewExam] = useState({ subject: "", date: "", priority: "medium" });
  const [constraintType, setConstraintType] = useState("");

  const handleAddExam = () => {
    if (newExam.subject && newExam.date) {
      const currentExams = location.state?.exams || [];
      const updatedExams = [...currentExams, { ...newExam, id: Date.now().toString() }];
      toast.success("Examen ajouté !");
      navigate("/exams", { state: { exams: updatedExams, constraints: location.state?.constraints || [] } });
    }
  };

  const handleAddConstraint = () => {
    if (constraintType) {
      const currentConstraints = location.state?.constraints || [];
      const updatedConstraints = [...currentConstraints, { id: Date.now().toString(), type: constraintType, days: [] }];
      toast.success("Contrainte ajoutée !");
      navigate("/exams", { state: { exams: location.state?.exams || [], constraints: updatedConstraints } });
    }
  };

  return (
    <div className="min-h-screen p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/exams", { state: location.state })}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <div className="max-w-2xl mx-auto">
        {mode === "select" && (
          <div>
            <h1 className="text-4xl font-bold mb-8 text-center">Que veux-tu ajouter ?</h1>
            <div className="grid gap-4">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setMode("exam")}
              >
                <CardHeader>
                  <CardTitle>Ajouter un examen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Enregistre un nouvel examen à venir
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setMode("constraint")}
              >
                <CardHeader>
                  <CardTitle>Ajouter une contrainte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Définis tes disponibilités et contraintes
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {mode === "exam" && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un examen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Matière</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Mathématiques"
                    value={newExam.subject}
                    onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date de l'examen</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExam.date}
                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={newExam.priority}
                    onValueChange={(value) => setNewExam({ ...newExam, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddExam} className="w-full">
                  Ajouter l'examen
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "constraint" && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une contrainte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Type de contrainte</Label>
                  <div className="grid gap-2 mt-2">
                    <Button
                      variant={constraintType === "alternance" ? "default" : "outline"}
                      onClick={() => setConstraintType("alternance")}
                      className="w-full"
                    >
                      Alternance
                    </Button>
                    <Button
                      variant={constraintType === "sport" ? "default" : "outline"}
                      onClick={() => setConstraintType("sport")}
                      className="w-full"
                    >
                      Sport
                    </Button>
                    <Button
                      variant={constraintType === "job" ? "default" : "outline"}
                      onClick={() => setConstraintType("job")}
                      className="w-full"
                    >
                      Job étudiant
                    </Button>
                  </div>
                </div>
                <Button onClick={handleAddConstraint} className="w-full" disabled={!constraintType}>
                  Ajouter la contrainte
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExamOrConstraint;
