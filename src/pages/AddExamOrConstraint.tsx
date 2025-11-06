import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddExamOrConstraint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = location.state?.mode || "exam";

  const [newExam, setNewExam] = useState({ 
    subject: "", 
    date: "", 
    priority: "moyenne",
    type: ""
  });

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
        type: newExam.type || null,
      });

    if (error) {
      console.error('Error adding exam:', error);
      toast.error("Erreur lors de l'ajout de l'examen");
      return;
    }

    toast.success("Examen ajouté avec succès");
    navigate("/exams");
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-24">
      <div className="px-5 pt-6">
        <Button
          variant="ghost"
          size="icon"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          {mode === "exam" ? "Nouvel examen" : "Nouvelle contrainte"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "exam" 
            ? "Renseigne les détails de ton examen pour que l'IA puisse organiser tes révisions."
            : "Ajoute une contrainte fixe à ton planning."
          }
        </p>
      </div>

      <div className="px-5 mt-6">
        {mode === "exam" && (
          <Card className="border-none rounded-2xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Détails de l'examen</CardTitle>
              <CardDescription>
                Ces informations permettent à Skoolife de créer un planning adapté.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Matière</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Mathématiques"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="type">Type d'examen (optionnel)</Label>
                <Input
                  id="type"
                  placeholder="Ex: Écrit, Oral, Partiel..."
                  value={newExam.type}
                  onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="date">Date de l'examen</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="priority">Niveau d'importance</Label>
                <Select
                  value={newExam.priority}
                  onValueChange={(value) => setNewExam({ ...newExam, priority: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible - Exam standard</SelectItem>
                    <SelectItem value="moyenne">Moyenne - Important</SelectItem>
                    <SelectItem value="élevée">Élevée - Exam clé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAddExam} 
                className="w-full mt-6 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full font-semibold"
                size="lg"
              >
                Ajouter l'examen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddExamOrConstraint;
