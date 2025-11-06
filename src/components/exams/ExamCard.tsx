import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

import type { Exam } from "@/pages/Exams";

const getPriorityStyle = (priority: Exam["priority"]) => {
  switch (priority) {
    case "élevée":
      return { label: "Exam clé", className: "bg-red-500/10 text-red-500" };
    case "moyenne":
      return { label: "Important", className: "bg-orange-400/10 text-orange-500" };
    default:
      return { label: "Standard", className: "bg-emerald-400/10 text-emerald-500" };
  }
};

export const ExamCard = ({
  exam,
  onDelete,
}: {
  exam: Exam;
  onDelete: () => void;
}) => {
  const dateObj = new Date(exam.date);
  const formatted = dateObj.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const today = new Date();
  const diff = Math.ceil(
    (dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dDay = diff >= 0 ? `J-${diff}` : "Passé";

  const priority = getPriorityStyle(exam.priority);

  return (
    <Card className="border-none bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {exam.subject}
            </h3>
            <Badge className={`text-[9px] ${priority.className}`}>
              {priority.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {exam.type ? `${exam.type} • ` : ""}{formatted}
          </p>
          <p className="text-[10px] text-yellow-500 mt-1">
            {dDay !== "Passé"
              ? `${dDay} • Planifié automatiquement dans ton planning IA`
              : "Exam terminé • Garde une trace de tes résultats bientôt"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </CardContent>
    </Card>
  );
};
