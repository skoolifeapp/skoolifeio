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
import { ConstraintsList } from "@/components/exams/ConstraintsList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.exams) {
      setExams(location.state.exams);
    }
    if (location.state?.constraints) {
      setConstraints(location.state.constraints);
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

    // Load constraints
    const { data: constraintsData, error: constraintsError } = await supabase
      .from('constraints')
      .select('*')
      .eq('user_id', user.id);

    if (constraintsError) {
      console.error('Error loading constraints:', constraintsError);
      toast.error("Erreur lors du chargement des contraintes");
    } else {
      setConstraints(constraintsData || []);
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
    toast.success("Examen supprimé");
  };

  const removeConstraint = async (id: string) => {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    setConstraints(constraints.filter((c) => c.id !== id));
    toast.success("Contrainte supprimée");
  };

  const handleAddClick = () => {
    navigate("/exams/add", { state: { exams, constraints } });
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

      <Carousel 
        className="w-full h-full"
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="h-full">
          <CarouselItem className="h-full">
            <ExamsList exams={exams} removeExam={removeExam} />
          </CarouselItem>
          <CarouselItem className="h-full">
            <ConstraintsList constraints={constraints} removeConstraint={removeConstraint} />
          </CarouselItem>
        </CarouselContent>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <CarouselPrevious className="relative left-0 translate-y-0" />
          <CarouselNext className="relative right-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default Exams;
