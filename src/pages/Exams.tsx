import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load from localStorage first
    const storedExams = localStorage.getItem('exams');
    const storedConstraints = localStorage.getItem('constraints');
    
    if (storedExams) {
      setExams(JSON.parse(storedExams));
    }
    if (storedConstraints) {
      setConstraints(JSON.parse(storedConstraints));
    }

    // Then update from navigation state if available
    if (location.state?.exams) {
      setExams(location.state.exams);
    }
    if (location.state?.constraints) {
      setConstraints(location.state.constraints);
    }
  }, [location.state]);

  // Save to localStorage whenever exams or constraints change
  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('constraints', JSON.stringify(constraints));
  }, [constraints]);

  const removeExam = (id: string) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  const handleAddClick = () => {
    navigate("/exams/add", { state: { exams, constraints } });
  };

  const handleGenerateStudyPlan = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: {}
      });

      if (error) {
        console.error('Error generating study plan:', error);
        alert('Erreur lors de la génération du planning');
        return;
      }

      console.log('Study plan generated:', data);
      alert(data.message || 'Planning généré avec succès !');
      
      // Optionally navigate to planning page to see results
      navigate('/planning');
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-screen pt-safe pb-safe">
      <div className="fixed top-20 right-6 z-20 flex gap-2">
        <Button
          onClick={handleGenerateStudyPlan}
          size="lg"
          disabled={isGenerating || exams.length === 0}
          className="gap-2"
        >
          <Sparkles className="h-5 w-5" />
          {isGenerating ? "Génération..." : "Générer mon planning IA"}
        </Button>
        <Button
          onClick={handleAddClick}
          size="icon"
          className="rounded-full"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

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
