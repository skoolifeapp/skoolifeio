import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  selectedDate: Date;
  allCalendarEvents: any[];
  onDayClick: (date: Date) => void;
}

export const MonthView = ({ selectedDate, allCalendarEvents, onDayClick }: MonthViewProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getEventsForDay = (day: Date) => {
    return allCalendarEvents.filter(event => {
      if (!event.start_date) return false;
      const eventDate = new Date(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  const getRevisionSessionsForDay = (day: Date) => {
    return allCalendarEvents.filter(event => {
      if (!event.start_date || event.source !== 'ai_revision') return false;
      const eventDate = new Date(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="bg-card rounded-lg border">
      {/* Header with weekday names */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const revisionSessions = getRevisionSessionsForDay(day);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Card
              key={idx}
              className={cn(
                "min-h-[100px] p-2 rounded-none border-b border-r cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isToday && "bg-primary/5",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
              onClick={() => onDayClick(day)}
            >
              <div className="flex flex-col h-full">
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Revision sessions indicators */}
                {revisionSessions.length > 0 && (
                  <div className="space-y-0.5">
                    {revisionSessions.slice(0, 3).map((session, i) => (
                      <div
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate border-l-2 border-primary"
                        title={session.title || session.summary}
                      >
                        {format(new Date(session.start_date), 'HH:mm')} - {session.title || session.summary}
                      </div>
                    ))}
                    {revisionSessions.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{revisionSessions.length - 3} autres
                      </div>
                    )}
                  </div>
                )}

                {/* Other events indicators (non-revision) */}
                {dayEvents.filter(e => e.source !== 'ai_revision').length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {dayEvents.filter(e => e.source !== 'ai_revision').length} événement{dayEvents.filter(e => e.source !== 'ai_revision').length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
