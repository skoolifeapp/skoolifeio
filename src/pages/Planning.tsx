import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ImportedEvent {
  summary: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

interface StudySession {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  exam_id: string | null;
}

const Planning = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load calendar events from Supabase
  useEffect(() => {
    if (!user) return;

    const loadCalendarEvents = async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error loading calendar events:', error);
        return;
      }

      if (data) {
        const events: ImportedEvent[] = data.map(event => ({
          summary: event.summary,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location || '',
          description: event.description || '',
        }));
        setImportedEvents(events);
      }
    };

    loadCalendarEvents();
  }, [user]);

  // Load study sessions from Supabase
  useEffect(() => {
    if (!user) return;

    const loadStudySessions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading study sessions:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setStudySessions(data);
      }
      setLoading(false);
    };

    loadStudySessions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('study-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadStudySessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Get sessions for selected day
  const daySessions = studySessions.filter(session => 
    isSameDay(new Date(session.start_time), selectedDate)
  );

  // Get events for selected day
  const dayEvents = importedEvents.filter(event => 
    isSameDay(new Date(event.startDate), selectedDate)
  );

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to get event position and height
  const getEventStyle = (event: ImportedEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    const topPercent = ((startHour + startMinute / 60) / 24) * 100;
    const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    const heightPercent = (durationHours / 24) * 100;
    
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  // Helper to get session position and height
  const getSessionStyle = (session: StudySession) => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    const topPercent = ((startHour + startMinute / 60) / 24) * 100;
    const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    const heightPercent = (durationHours / 24) * 100;
    
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  return (
    <div className="min-h-screen safe-area-inset-bottom px-safe pt-safe">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Planning</h1>
          {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day View with Time Grid */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="relative">
          {/* Time Grid */}
          <div className="flex">
            {/* Hours Column */}
            <div className="w-16 flex-shrink-0 pr-2">
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-start justify-end text-xs text-muted-foreground border-t border-border first:border-t-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Events Column */}
            <div className="flex-1 relative border-l border-border">
              {/* Hour Lines */}
              {hours.map(hour => (
                <div key={hour} className="h-16 border-t border-border first:border-t-0" />
              ))}

              {/* Events & Sessions */}
              <div className="absolute inset-0 px-2">
                {/* Calendar Events (School schedule) */}
                {dayEvents.map((event, index) => {
                  const style = getEventStyle(event);
                  const start = new Date(event.startDate);
                  const end = new Date(event.endDate);
                  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;

                  return (
                    <div
                      key={`event-${index}`}
                      className="absolute left-2 right-2 bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md"
                      style={style}
                    >
                      <div className="text-xs font-semibold truncate">{event.summary}</div>
                      <div className="text-xs opacity-90">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')} ({duration}h)
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-80 truncate mt-1">{event.location}</div>
                      )}
                    </div>
                  );
                })}

                {/* Study Sessions (Generated by AI) */}
                {daySessions.map((session) => {
                  const style = getSessionStyle(session);
                  const start = new Date(session.start_time);
                  const end = new Date(session.end_time);
                  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;

                  return (
                    <div
                      key={`session-${session.id}`}
                      className="absolute left-2 right-2 bg-secondary border-2 border-primary rounded-lg p-2 overflow-hidden shadow-md"
                      style={style}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <div className="text-xs font-semibold truncate text-foreground">{session.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')} ({duration}h)
                      </div>
                      {session.completed && (
                        <div className="text-xs text-primary mt-1">✓ Complété</div>
                      )}
                    </div>
                  );
                })}

                {/* Empty state */}
                {dayEvents.length === 0 && daySessions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm italic">Aucun événement ni session</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Planning;
