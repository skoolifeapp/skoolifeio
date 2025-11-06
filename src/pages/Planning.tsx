import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon, Trash2, Bell, BellOff, Upload } from "lucide-react";
import ICAL from "ical.js";
import { toast } from "sonner";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateRevisionPlanning, IntensityLevel } from "@/services/aiRevisionPlanner";
import { notificationService } from "@/services/notificationService";
import { Capacitor } from "@capacitor/core";

interface ImportedEvent {
  summary: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

interface RevisionSession {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  difficulty: string | null;
  weight: number;
  exam_id: string | null;
}

const Planning = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);
  const [revisionSessions, setRevisionSessions] = useState<RevisionSession[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intensity, setIntensity] = useState<IntensityLevel>('standard');
  const [examsCount, setExamsCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if running on native platform
    setIsNative(Capacitor.isNativePlatform());
    
    if (user) {
      loadCalendarEvents();
      checkNotificationStatus();
    }
  }, [user]);

  const loadCalendarEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading calendar events:', error);
      return;
    }

    // Transform Supabase data to match the expected format
    const events = (data || []).map(event => ({
      summary: event.summary,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location || '',
      description: event.description || '',
    }));

    setImportedEvents(events);
  };

  useEffect(() => {
    if (user) {
      loadRevisionSessions();
      loadExamsCount();
    }
  }, [user]);

  const loadRevisionSessions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('revision_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading revision sessions:', error);
      return;
    }

    const sessions = data || [];
    setRevisionSessions(sessions);
    
    // Schedule notifications for all upcoming sessions
    if (isNative && notificationsEnabled) {
      await notificationService.scheduleSessionReminders(sessions);
    }
  };

  const checkNotificationStatus = async () => {
    if (!isNative) return;
    
    const permission = await notificationService.checkPermissions();
    setNotificationsEnabled(permission === 'granted');
  };

  const toggleNotifications = async () => {
    if (!isNative) {
      toast.error("Les notifications ne fonctionnent que sur l'app native");
      return;
    }

    if (notificationsEnabled) {
      // Disable notifications
      await notificationService.cancelAllNotifications();
      setNotificationsEnabled(false);
      toast.error("Notifications désactivées");
    } else {
      // Enable notifications
      const success = await notificationService.initialize();
      if (success) {
        await notificationService.scheduleSessionReminders(revisionSessions);
        setNotificationsEnabled(true);
        toast.error("Notifications activées - Tu seras rappelé 15 min avant chaque session");
      } else {
        toast.error("Impossible d'activer les notifications");
      }
    }
  };

  const loadExamsCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!error && count !== null) {
      setExamsCount(count);
    }
  };

  const handleGeneratePlanning = async () => {
    if (examsCount === 0) {
      toast.error("Aucun examen", {
        description: "Ajoute d'abord tes examens pour générer ton planning IA.",
      });
      return;
    }

    setIsGenerating(true);
    setSheetOpen(false);

    toast.loading("Skoolife prépare ton planning de révision personnalisé…", {
      id: 'generating-plan',
    });

    const result = await generateRevisionPlanning({ intensity });

    toast.dismiss('generating-plan');
    setIsGenerating(false);

    if (result.success) {
      await loadRevisionSessions();
    } else {
      toast.error("Erreur", {
        description: result.error || "Impossible de générer le planning.",
      });
    }
  };

  const deleteRevisionSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('revision_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    await loadRevisionSessions();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const events = vevents.map((vevent: any) => {
          const event = new ICAL.Event(vevent);
          return {
            summary: event.summary,
            startDate: event.startDate.toJSDate().toISOString(),
            endDate: event.endDate.toJSDate().toISOString(),
            location: event.location || '',
            description: event.description || '',
          };
        });

        // Delete existing calendar events
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user.id);

        // Insert new events
        const eventsToInsert = events.map(event => ({
          user_id: user.id,
          summary: event.summary,
          start_date: event.startDate,
          end_date: event.endDate,
          location: event.location,
          description: event.description,
        }));

        const { error } = await supabase
          .from('calendar_events')
          .insert(eventsToInsert);

        if (error) throw error;

        await loadCalendarEvents();
      } catch (error) {
        console.error('Error importing calendar:', error);
        toast.error("Erreur lors de l'import du fichier");
      }
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get exams for selected day from Supabase (not localStorage)
  const [dayExams, setDayExams] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDayExams();
    }
  }, [user, selectedDate]);

  const loadDayExams = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading exams:', error);
      return;
    }

    const filtered = (data || []).filter((exam: { date: string }) => 
      isSameDay(new Date(exam.date), selectedDate)
    );
    setDayExams(filtered);
  };

  // Get events for selected day
  const dayEvents = importedEvents.filter(event => 
    isSameDay(new Date(event.startDate), selectedDate)
  );

  // Get revision sessions for selected day
  const dayRevisionSessions = revisionSessions.filter(session => 
    isSameDay(new Date(session.start_time), selectedDate)
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
    <div className="min-h-[100dvh] flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] px-safe pt-safe overflow-y-auto scroll-smooth">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Planning IA</h1>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Importer un fichier .ics"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="hero" size="sm" disabled={isGenerating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Génération du planning IA</SheetTitle>
                  <SheetDescription>
                    Skoolife va créer un planning de révision personnalisé basé sur tes examens, ton emploi du temps et tes contraintes.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Examens trouvés : {examsCount}</h3>
                    {examsCount === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Ajoute d'abord tes examens dans l'onglet Examens pour générer un planning.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Intensité de révision</Label>
                    <RadioGroup value={intensity} onValueChange={(v) => setIntensity(v as IntensityLevel)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="leger" id="leger" />
                        <Label htmlFor="leger" className="font-normal">
                          Léger (1 session/jour, 45-60 min)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard" className="font-normal">
                          Standard (2 sessions/jour, 60-90 min)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intensif" id="intensif" />
                        <Label htmlFor="intensif" className="font-normal">
                          Intensif (3 sessions/jour, 75-120 min)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    onClick={handleGeneratePlanning} 
                    className="w-full"
                    disabled={isGenerating || examsCount === 0}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Génération...' : 'Lancer la génération'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
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

              {/* Events & Revision Sessions */}
              <div className="absolute inset-0 px-2">
                {dayEvents.length === 0 && dayRevisionSessions.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm italic">Aucun événement</p>
                  </div>
                ) : (
                  <>
                    {/* Calendar Events */}
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

                    {/* Revision Sessions */}
                    {dayRevisionSessions.map((session) => {
                      const start = new Date(session.start_time);
                      const end = new Date(session.end_time);
                      const startHour = start.getHours();
                      const startMinute = start.getMinutes();
                      const endHour = end.getHours();
                      const endMinute = end.getMinutes();
                      
                      const topPercent = ((startHour + startMinute / 60) / 24) * 100;
                      const durationHours = (endHour + endMinute / 60) - (startHour + startMinute / 60);
                      const heightPercent = (durationHours / 24) * 100;
                      const duration = Math.round(durationHours * 60);

                      const style = {
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                      };

                      return (
                        <div
                          key={`session-${session.id}`}
                          className="absolute left-2 right-2 bg-yellow-500/90 text-yellow-950 rounded-lg p-2 overflow-hidden shadow-md border-2 border-yellow-600"
                          style={style}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate">📚 {session.subject}</div>
                              <div className="text-xs opacity-90">
                                {format(start, 'HH:mm')} - {format(end, 'HH:mm')} ({duration} min)
                              </div>
                              {session.difficulty && (
                                <div className="text-xs opacity-80 mt-1">
                                  Niveau: {session.difficulty}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => deleteRevisionSession(session.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </>
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
