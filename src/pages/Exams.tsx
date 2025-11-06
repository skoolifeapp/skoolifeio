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
  const [exams, setExams] = useState<Exam[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

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

  return (
    <div className="relative w-full h-[100dvh] pt-safe pb-safe">
      <Button
        onClick={handleAddClick}
        size="icon"
        className="fixed top-4 right-4 z-20 rounded-full shadow-lg min-h-[56px] min-w-[56px] h-14 w-14"
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
