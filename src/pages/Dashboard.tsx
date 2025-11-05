import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

const Dashboard = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [importedEvents, setImportedEvents] = useState([]);

  useEffect(() => {
    const storedExams = localStorage.getItem('exams');
    const storedEvents = localStorage.getItem('importedEvents');
    
    if (storedExams) {
      setExams(JSON.parse(storedExams));
    }
    if (storedEvents) {
      setImportedEvents(JSON.parse(storedEvents));
    }
  }, []);

  // Get next exam
  const nextExam = exams
    .filter(exam => new Date(exam.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysUntilNextExam = nextExam 
    ? differenceInDays(new Date(nextExam.date), new Date())
    : null;

  // Count high priority exams
  const highPriorityCount = exams.filter(exam => 
    exam.priority === 'Haute' && new Date(exam.date) >= new Date()
  ).length;

  // Total events this week
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eventsThisWeek = importedEvents.filter((event: any) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= today && eventDate <= weekFromNow;
  }).length;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Prochain examen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextExam ? (
              <>
                <div className="text-2xl font-bold">{daysUntilNextExam}j</div>
                <p className="text-xs text-muted-foreground truncate">{nextExam.subject}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun examen</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Examens totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" />
              Priorité haute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">à prioriser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsThisWeek}</div>
            <p className="text-xs text-muted-foreground">événements</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming exams list */}
      <Card>
        <CardHeader>
          <CardTitle>Examens à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Aucun examen enregistré. Commence par ajouter tes examens !
            </p>
          ) : (
            <div className="space-y-3">
              {exams
                .filter(exam => new Date(exam.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{exam.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exam.date), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      exam.priority === 'Haute' 
                        ? 'bg-destructive/10 text-destructive' 
                        : exam.priority === 'Moyenne'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {exam.priority}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
