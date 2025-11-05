import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportedEvent {
  summary: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem('importedEvents');
    if (storedEvents) {
      setImportedEvents(JSON.parse(storedEvents));
    }
  }, []);

  const generatePlanning = () => {
    toast.success("Planning généré par l'IA !", {
      description: "Tes examens sont maintenant visibles dans le planning.",
    });
  };

  // Get exams for selected day
  const storedExams = localStorage.getItem('exams');
  const allExams = storedExams ? JSON.parse(storedExams) : [];
  const dayExams = allExams.filter((exam: { date: string }) => 
    isSameDay(new Date(exam.date), selectedDate)
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

  const goToPreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="safe-area-top" />
      <div 
        className="flex-1 container-responsive py-4"
        style={{ paddingBottom: `calc(5rem + env(safe-area-inset-bottom))` }}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-fluid-2xl font-bold">Planning</h1>
            <Button variant="hero" size="sm" onClick={generatePlanning}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer
            </Button>
          </div>

      {/* Exams Header */}
      {dayExams.length > 0 && (
        <div className="mb-4 space-y-2">
          {dayExams.map((exam: { id: string; subject: string; priority: string }) => (
            <div
              key={exam.id}
              className="bg-primary/10 border border-primary/20 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <div>
                    <h3 className="font-semibold">{exam.subject}</h3>
                    <p className="text-xs text-muted-foreground">Priorité: {exam.priority}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

              {/* Events */}
              <div className="absolute inset-0 px-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event, index) => {
                    const style = getEventStyle(event);
                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;

                    return (
                      <div
                        key={index}
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
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm italic">Aucun événement</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

        <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Conseils IA
          </h3>
          <p className="text-xs text-muted-foreground">
            Ton planning est optimisé en fonction de tes examens et contraintes. N'oublie pas de prendre des pauses régulières !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Planning;
