import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

export const DashboardStats = () => {
  const { user } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState(0);
  const [plannedHours, setPlannedHours] = useState("0h");
  const [weekSessions, setWeekSessions] = useState(0);
  const [completionRate, setCompletionRate] = useState("0%");

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get upcoming exams count
      const { data: examsData } = await supabase
        .from('exams')
        .select('id')
        .eq('user_id', user.id)
        .gte('date', today);
      
      setUpcomingExams(examsData?.length || 0);

      // Get total planned hours from revision sessions
      const { data: revisionsData } = await supabase
        .from('revision_sessions')
        .select('start_time, end_time')
        .eq('user_id', user.id);
      
      if (revisionsData) {
        const totalMinutes = revisionsData.reduce((acc, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.end_time);
          const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
          return acc + minutes;
        }, 0);
        const hours = Math.round(totalMinutes / 60);
        setPlannedHours(`${hours}h`);
      }

      // Get sessions this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('start_time', startOfWeek.toISOString());
      
      setWeekSessions(sessionsData?.length || 0);

      // Calculate completion rate
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('completed')
        .eq('user_id', user.id);
      
      if (allSessions && allSessions.length > 0) {
        const completed = allSessions.filter(s => s.completed).length;
        const rate = Math.round((completed / allSessions.length) * 100);
        setCompletionRate(`${rate}%`);
      }
    };

    loadStats();
  }, [user]);

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
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg text-foreground">
                {stat.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
