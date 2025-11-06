import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);

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

  const handleAddClick = () => {
    navigate("/exams/add", { state: { exams } });
  };

  return (
    <div className="relative w-full h-screen pt-safe pb-safe">
      <Button
        onClick={handleAddClick}
        size="icon"
        className="fixed top-20 right-6 z-20 rounded-full"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <div className="h-full">
        <ExamsList exams={exams} removeExam={removeExam} />
      </div>
    </div>
  );
};

export default Exams;
