import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamCard } from "@/components/exams/ExamCard";

type Priority = "faible" | "moyenne" | "élevée";

export interface Exam {
  id: string;
  user_id: string;
  subject: string;
  date: string;
  priority: Priority;
  type?: string;
}

const ExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchExams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!error && data) {
        setExams(
          data.map((e: any) => ({
            id: e.id,
            user_id: e.user_id,
            subject: e.subject,
            date: e.date,
            priority: (e.priority || "moyenne") as Priority,
            type: e.type || undefined,
          }))
        );
      }
      setLoading(false);
    };
    fetchExams();
  }, [user]);

  const handleAddExam = () => {
    navigate("/add-exam-or-constraint", { state: { mode: "exam" } });
  };

  const handleRemoveExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("exams").delete().eq("id", id);
  };

  const nextExam = useMemo(
    () => exams[0],
    [exams]
  );

  const daysUntilNext = useMemo(() => {
    if (!nextExam) return null;
    const today = new Date();
    const d = new Date(nextExam.date);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }, [nextExam]);

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mes examens
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualise tes objectifs, Skoolife s'occupe de ton planning.
          </p>
        </div>
        <Button
          size="icon"
          className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-black shadow-md"
          onClick={handleAddExam}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Insight bar */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        <Card className="border-none bg-yellow-50">
          <CardContent className="py-3 px-3 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">
              Exams à venir
            </span>
            <span className="text-xl font-semibold">{exams.length}</span>
            <span className="text-[10px] text-muted-foreground">
              Plus tu es clair ici, plus l'IA est précise.
            </span>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
          <CardContent className="py-3 px-3 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Prochain examen
            </span>
            {loading ? (
              <Skeleton className="h-4 w-16 mt-1" />
            ) : nextExam ? (
              <>
                <span className="text-xs font-medium truncate">
                  {nextExam.subject}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  J-{daysUntilNext}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Ajoute un examen pour démarrer.
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-[#111827] text-white flex items-center">
          <CardContent className="py-3 px-3 flex flex-col gap-1">
            <span className="text-[10px] uppercase opacity-70 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> IA Planning
            </span>
            <span className="text-[10px]">
              Configure tes examens, génère ton planning depuis l'onglet Planning.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Liste des examens */}
      <div className="px-5 mt-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : exams.length === 0 ? (
          <Card className="border-dashed border-yellow-300 bg-yellow-50/40 rounded-2xl">
            <CardContent className="py-6 px-4 flex flex-col items-start gap-2">
              <Badge className="bg-yellow-400 text-black">Commence ici</Badge>
              <p className="text-sm font-medium">
                Aucun examen enregistré.
              </p>
              <p className="text-xs text-muted-foreground">
                Ajoute tes examens (matière, date, difficulté). Skoolife utilisera ces infos
                pour construire un planning de révisions intelligent.
              </p>
              <Button
                onClick={handleAddExam}
                className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full text-xs px-4"
              >
                Ajouter mon premier examen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onDelete={() => handleRemoveExam(exam.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsPage;
