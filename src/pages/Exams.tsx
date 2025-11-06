import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ExamsList } from "@/components/exams/ExamsList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

const Exams = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExam, setNewExam] = useState({ subject: "", date: "", priority: "medium" });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.exams) {
      setExams(location.state.exams);
    }
  }, [location.state]);

  const loadData = async () => {
    if (!user) return;

    // Load exams
    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (examsError) {
      console.error('Error loading exams:', examsError);
      toast.error("Erreur lors du chargement des examens");
    } else {
      setExams(examsData || []);
    }
  };

  const removeExam = async (id: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    setExams(exams.filter(exam => exam.id !== id));
  };

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

    setIsDialogOpen(false);
    setNewExam({ subject: "", date: "", priority: "medium" });
    loadData();
  };

  return (
    <div className="relative w-full min-h-screen pb-24 pt-safe px-safe">
      <Button
        onClick={() => setIsDialogOpen(true)}
        size="icon"
        className="fixed top-12 right-6 z-20 rounded-full"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <div className="h-full">
        <ExamsList exams={exams} removeExam={removeExam} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel examen</DialogTitle>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-4 p-0 pt-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exams;
