import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, BookOpen } from "lucide-react";

const DayDetail = () => {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();

  // Mock detailed planning for the day
  const dayData = {
    date: new Date(parseInt(day || "0")).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    sessions: [
      {
        id: 1,
        subject: "Mathématiques",
        time: "09:00 - 11:00",
        duration: "2h",
        type: "Révision",
        topics: ["Analyse", "Probabilités"]
      },
      {
        id: 2,
        subject: "Physique",
        time: "14:00 - 15:00",
        duration: "1h",
        type: "Exercices",
        topics: ["Électromagnétisme"]
      },
    ]
  };

  return (
    <div className="min-h-screen pb-20 px-6 pt-6">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate("/planning")}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour à la semaine
        </Button>

        {/* Day Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold capitalize mb-1">
            {dayData.date.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            {dayData.date.split(' ').slice(1).join(' ')}
          </p>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Planning de la journée</h2>
          
          {dayData.sessions.map((session, index) => (
            <Card
              key={session.id}
              className="p-5 shadow-[var(--shadow-soft)] animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="space-y-3">
                {/* Session Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{session.subject}</h3>
                    <p className="text-sm text-muted-foreground">{session.type}</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-medium">
                    {session.duration}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{session.time}</span>
                </div>

                {/* Topics */}
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic, topicIndex) => (
                      <span
                        key={topicIndex}
                        className="bg-secondary px-3 py-1 rounded-full text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Empty State if no sessions */}
          {dayData.sessions.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground italic">
                Aucune session de révision prévue pour cette journée.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Profite de ce jour de repos ! 😊
              </p>
            </Card>
          )}
        </div>

        {/* Daily Summary */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <h3 className="font-semibold text-sm mb-2">Résumé de la journée</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• {dayData.sessions.length} session{dayData.sessions.length > 1 ? 's' : ''} de révision</p>
            <p>• {dayData.sessions.reduce((acc, s) => acc + parseInt(s.duration), 0)}h de travail prévues</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DayDetail;
