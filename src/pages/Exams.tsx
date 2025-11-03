import { useState } from "react";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AddExamSection } from "@/components/exams/AddExamSection";
import { ConstraintsSection } from "@/components/exams/ConstraintsSection";

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

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)]">
      <Carousel 
        className="w-full h-full"
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="h-full">
          <CarouselItem className="h-full">
            <AddExamSection 
              exams={exams}
              newExam={newExam}
              setNewExam={setNewExam}
              addExam={addExam}
              removeExam={removeExam}
            />
          </CarouselItem>
          <CarouselItem className="h-full">
            <ConstraintsSection 
              constraints={constraints}
              addConstraint={addConstraint}
              removeConstraint={removeConstraint}
            />
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
