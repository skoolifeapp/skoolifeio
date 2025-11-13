import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

export const DashboardStats = () => {
  const { user } = useAuth();
  const { exams, calendarEvents } = useData();
  const [upcomingExams, setUpcomingExams] = useState(0);
  const [plannedHours, setPlannedHours] = useState("0h");
  const [weekSessions, setWeekSessions] = useState(0);
  const [completionRate, setCompletionRate] = useState("0%");

  // Recalculer les stats à chaque changement de données
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get upcoming exams count depuis DataContext
      const upcomingCount = (exams || []).filter(exam => exam.date >= today).length;
      setUpcomingExams(upcomingCount);

      // Get total planned hours from AI revision events in calendar_events
      const aiRevisionEvents = (calendarEvents || []).filter(e => e.source === 'ai_revision');
      if (aiRevisionEvents.length > 0) {
        const totalMinutes = aiRevisionEvents.reduce((acc, event) => {
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
          return acc + minutes;
        }, 0);
        const hours = Math.round(totalMinutes / 60);
        setPlannedHours(`${hours}h`);
      }

      // Get AI revision sessions this week from calendar_events
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Dimanche
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const aiSessions = (calendarEvents || []).filter(event => {
        const eventDate = new Date(event.start_date);
        return event.source === 'ai_revision' && eventDate >= startOfWeek && eventDate < endOfWeek;
      });
      
      setWeekSessions(aiSessions.length);

      // Calculate completion rate from AI revision sessions
      const now = new Date();
      const pastSessions = aiSessions.filter(s => new Date(s.end_date) < now);
      
      if (aiSessions.length > 0) {
        const rate = Math.round((pastSessions.length / aiSessions.length) * 100);
        setCompletionRate(`${rate}%`);
      } else {
        setCompletionRate("0%");
      }
    };

    loadStats();
  }, [user, exams, calendarEvents]);

  const stats: Stat[] = [
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Examens à venir",
      value: upcomingExams,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Heures planifiées",
      value: plannedHours,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Sessions cette semaine",
      value: weekSessions,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Taux de complétion",
      value: completionRate,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-secondary rounded-xl text-foreground">
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
