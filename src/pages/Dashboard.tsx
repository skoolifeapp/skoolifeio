import { Calendar, BookOpen, Clock, TrendingUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { PomodoroTimer } from "@/components/dashboard/PomodoroTimer";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingExams } from "@/components/dashboard/UpcomingExams";

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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header avec animation */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {greeting()}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Pomodoro Timer - Featured */}
      <div className="mb-6 animate-scale-in">
        <PomodoroTimer />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <StatCard
          title="Prochain examen"
          value={nextExam ? `${daysUntilNextExam}j` : '—'}
          subtitle={nextExam?.subject}
          icon={Calendar}
          gradient="from-primary/10 via-primary/5 to-transparent"
          iconColor="text-primary"
        />
        
        <StatCard
          title="Examens totaux"
          value={exams.length}
          subtitle="enregistrés"
          icon={BookOpen}
          gradient="from-accent/10 via-accent/5 to-transparent"
          iconColor="text-accent"
        />
        
        <StatCard
          title="Priorité haute"
          value={highPriorityCount}
          subtitle="à prioriser"
          icon={TrendingUp}
          gradient="from-destructive/10 via-destructive/5 to-transparent"
          iconColor="text-destructive"
        />
        
        <StatCard
          title="Cette semaine"
          value={eventsThisWeek}
          subtitle="événements"
          icon={Clock}
          gradient="from-blue-500/10 via-blue-500/5 to-transparent"
          iconColor="text-blue-500"
        />
      </div>

      {/* Upcoming Exams */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <UpcomingExams exams={exams} />
      </div>
    </div>
  );
};

export default Dashboard;
