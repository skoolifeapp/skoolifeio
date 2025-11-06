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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AddExamOrConstraint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<"select" | "exam" | "constraint">("select");
  const [newExam, setNewExam] = useState({ subject: "", date: "", priority: "medium" });
  const [constraintType, setConstraintType] = useState("");
  const [commuteTime, setCommuteTime] = useState<number>(0);

  const handleAddExam = async () => {
    if (!user || !newExam.subject || !newExam.date) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const { error } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        subject: newExam.subject,
        date: newExam.date,
        priority: newExam.priority,
      });

    if (error) {
      console.error('Error adding exam:', error);
      toast.error("Erreur lors de l'ajout de l'examen");
      return;
    }

    navigate("/exams");
  };

  const handleAddConstraint = () => {
    // Redirect to the new Constraints page
    toast.info("Utilise la page Contraintes pour une gestion complète");
    navigate("/constraints");
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/exams", { state: location.state })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">
          {mode === "select" ? "Ajouter" : mode === "exam" ? "Nouvel examen" : "Nouvelle contrainte"}
        </h1>
      </div>
      {mode === "select" && (
        <div>
          <div className="space-y-3">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("exam")}
            >
              <CardHeader>
                <CardTitle>Ajouter un examen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
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
                <p className="text-muted-foreground text-sm">
                  Définis tes disponibilités et contraintes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {mode === "exam" && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'examen</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Type de contrainte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
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
              
              <div>
                <Label htmlFor="commute-time">Temps de trajet (aller simple, en minutes)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Cette info aide l'IA à mieux organiser ton planning
                </p>
                <Input
                  id="commute-time"
                  type="number"
                  min="0"
                  placeholder="Ex: 30"
                  value={commuteTime === 0 ? "" : commuteTime}
                  onChange={(e) => setCommuteTime(parseInt(e.target.value) || 0)}
                />
              </div>

              <Button onClick={handleAddConstraint} className="w-full" disabled={!constraintType}>
                Ajouter la contrainte
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AddExamOrConstraint;
