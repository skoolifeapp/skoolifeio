import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Calendar as CalendarIcon, Trash2, Bell, BellOff, Upload, Plus } from "lucide-react";
import ICAL from "ical.js";
import { toast } from "sonner";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useNavigationState } from "@/contexts/NavigationStateContext";
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
  const { refetchAll } = useData();
  const { state, setPlanningDate } = useNavigationState();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(state.planning.selectedDate);
  const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);
  const [allCalendarEvents, setAllCalendarEvents] = useState<any[]>([]);
  const [revisionSessions, setRevisionSessions] = useState<RevisionSession[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intensity, setIntensity] = useState<IntensityLevel>('standard');
  const [examsCount, setExamsCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    type: 'calendar' | 'revision' | 'work' | 'exam' | 'activity' | 'routine' | 'planned';
    data: any;
    occurrenceDate?: string; // Date de l'occurrence pour les événements récurrents
    isRecurring?: boolean; // Indique si l'événement parent est récurrent
  } | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  const [plannedEvents, setPlannedEvents] = useState<any[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newManualEvent, setNewManualEvent] = useState<{
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    source: 'school' | 'work' | 'sport' | 'other';
    is_recurring: boolean;
    days_of_week: number[];
  }>({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    source: 'other',
    is_recurring: false,
    days_of_week: []
  });

  useEffect(() => {
    // Check if running on native platform
    setIsNative(Capacitor.isNativePlatform());
    
    if (user) {
      loadCalendarEvents();
      loadPlannedEvents();
      checkNotificationStatus();
      cleanCancelledEvents();
    }
  }, [user]);

  const cleanCancelledEvents = async () => {
    if (!user) return;
    
    // Nettoyer les anciens événements "Annulé"
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .or('summary.ilike.%Annulé%,summary.ilike.%❌%');
    
    if (error) {
      console.error('Error cleaning cancelled events:', error);
    }
  };


  const loadPlannedEvents = async () => {
    if (!user) return;

    // Planned events feature removed - using calendar_events instead
    setPlannedEvents([]);
  };

  const loadCalendarEvents = async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading calendar events:', error);
      return;
    }

    // Stocker tous les événements
    setAllCalendarEvents(data || []);

    // Séparer les événements .ics (source='school') pour compatibilité
    const icsEvents = (data || [])
      .filter(event => event.source === 'school')
      .map(event => ({
        summary: event.summary,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location || '',
        description: event.description || '',
      }));

    setImportedEvents(icsEvents);
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
      await loadCalendarEvents();
      
      toast.success(`${result.count} sessions générées !`, {
        description: result.metadata?.warnings?.length 
          ? `Note : ${result.metadata.warnings[0]}` 
          : `${result.metadata?.total_hours.toFixed(1)}h de révision planifiées`,
      });
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
    await loadCalendarEvents();
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
          source: 'school' as const,
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

  // Get planned events for selected day
  const dayPlannedEvents = plannedEvents.filter(event => 
    isSameDay(new Date(event.start_time), selectedDate)
  );

  // Get work schedules for selected day, en excluant les exceptions
  const selectedDayName = format(selectedDate, 'EEEE', { locale: fr }).toLowerCase();
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Filtrer les événements pour la date sélectionnée (allCalendarEvents contient TOUT)
  const dayWorkSchedules = allCalendarEvents
    .filter(e => e.source === 'work' && format(new Date(e.start_date), 'yyyy-MM-dd') === selectedDateStr);
  
  const dayActivities = allCalendarEvents
    .filter(e => e.source === 'sport' && format(new Date(e.start_date), 'yyyy-MM-dd') === selectedDateStr);

  const dayRoutineMoments = allCalendarEvents
    .filter(e => e.source === 'other' && format(new Date(e.start_date), 'yyyy-MM-dd') === selectedDateStr);

  // Generate hours (7-23, then 0 for midnight)
  const hours = [...Array.from({ length: 17 }, (_, i) => i + 7), 0];
  const DISPLAY_HOURS = 18; // Total hours displayed
  const START_HOUR = 7; // Start at 7am

  // Helper to get event position and height
  const getEventStyle = (event: ImportedEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    // Adjust hours relative to 7am start
    const adjustedStartHour = startHour >= START_HOUR ? startHour - START_HOUR : startHour + 24 - START_HOUR;
    const adjustedEndHour = endHour >= START_HOUR ? endHour - START_HOUR : endHour + 24 - START_HOUR;
    
    const topPercent = ((adjustedStartHour + startMinute / 60) / DISPLAY_HOURS) * 100;
    const durationHours = (adjustedEndHour + endMinute / 60) - (adjustedStartHour + startMinute / 60);
    const heightPercent = (durationHours / DISPLAY_HOURS) * 100;
    
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  const handleUpdateEvent = async () => {
    const updateAll = applyToAll;
    if (!editingEvent || !user) return;

    try {
      if (editingEvent.type === 'calendar') {
        const { error } = await supabase
          .from('calendar_events')
          .update({
            summary: editingEvent.data.summary,
            start_date: editingEvent.data.start_date,
            end_date: editingEvent.data.end_date,
            location: editingEvent.data.location,
            description: editingEvent.data.description,
          })
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        await loadCalendarEvents();
      } else if (editingEvent.type === 'revision') {
        const { error } = await supabase
          .from('revision_sessions')
          .update({
            subject: editingEvent.data.subject,
            start_time: editingEvent.data.start_time,
            end_time: editingEvent.data.end_time,
          })
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        await loadRevisionSessions();
      } else if (editingEvent.type === 'work' || editingEvent.type === 'activity' || editingEvent.type === 'routine') {
        if (updateAll && editingEvent.isRecurring && editingEvent.data.parent_recurring_id) {
          // Modifier toutes les occurrences
          const parentId = String(editingEvent.data.parent_recurring_id);
          const title = String(editingEvent.data.title);
          const location = editingEvent.data.location ? String(editingEvent.data.location) : null;
          const startTime = editingEvent.data.start_time ? String(editingEvent.data.start_time) : null;
          const endTime = editingEvent.data.end_time ? String(editingEvent.data.end_time) : null;
          
          const { error: updateErr } = await (supabase as any)
            .from('calendar_events')
            .update({
              title,
              summary: title,
              location,
              start_time: startTime,
              end_time: endTime,
            })
            .eq('parent_recurring_id', parentId);
          
          if (updateErr) console.error('Error updating all:', updateErr);
        } else {
          // Modifier uniquement cette occurrence
          const id = String(editingEvent.data.id);
          const title = String(editingEvent.data.title);
          const location = editingEvent.data.location ? String(editingEvent.data.location) : null;
          const startTime = editingEvent.data.start_time ? String(editingEvent.data.start_time) : null;
          const endTime = editingEvent.data.end_time ? String(editingEvent.data.end_time) : null;
          
          const { error: updateErr } = await (supabase as any)
            .from('calendar_events')
            .update({
              title,
              summary: title,
              location,
              start_time: startTime,
              end_time: endTime,
            })
            .eq('id', id);
          
          if (updateErr) console.error('Error updating one:', updateErr);
        }
      } else if (editingEvent.type === 'exam') {
        const { error } = await supabase
          .from('exams')
          .update({
            subject: editingEvent.data.subject,
            date: editingEvent.data.date,
            type: editingEvent.data.type,
            location: editingEvent.data.location,
          })
          .eq('id', editingEvent.data.id);

        if (error) throw error;
      }

      await loadCalendarEvents();
      setEditingEvent(null);
      setApplyToAll(false);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    const deleteAll = applyToAll;
    if (!editingEvent || !user) return;

    try {
      if (editingEvent.type === 'calendar' || editingEvent.type === 'work' || editingEvent.type === 'activity' || editingEvent.type === 'routine') {
        if (deleteAll && editingEvent.isRecurring && editingEvent.data.parent_recurring_id) {
          // Supprimer toutes les occurrences
          const parentId = String(editingEvent.data.parent_recurring_id);
          
          const { error: deleteErr } = await (supabase as any)
            .from('calendar_events')
            .delete()
            .eq('parent_recurring_id', parentId);

          if (deleteErr) console.error('Error deleting all:', deleteErr);
        } else {
          // Supprimer uniquement cette occurrence
          const id = String(editingEvent.data.id);
          
          const { error: deleteErr } = await (supabase as any)
            .from('calendar_events')
            .delete()
            .eq('id', id);
          
          if (deleteErr) console.error('Error deleting one:', deleteErr);
        }
      } else if (editingEvent.type === 'revision') {
        const { error } = await supabase
          .from('revision_sessions')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
      } else if (editingEvent.type === 'exam') {
        const { error } = await supabase
          .from('exams')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
      }

      await loadCalendarEvents();
      setEditingEvent(null);
      setApplyToAll(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const goToPreviousDay = () => {
    const newDate = addDays(selectedDate, -1);
    setSelectedDate(newDate);
    setPlanningDate(newDate);
  }

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    setPlanningDate(newDate);
  };

  const handleAddManualEvent = async () => {
    if (!user || !newManualEvent.title || !newManualEvent.start_date || !newManualEvent.end_date) {
      toast.error("Remplis tous les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: user.id,
          title: newManualEvent.title,
          summary: newManualEvent.title,
          description: newManualEvent.description,
          start_date: newManualEvent.start_date,
          end_date: newManualEvent.end_date,
          location: newManualEvent.location,
          source: newManualEvent.source,
          is_recurring: newManualEvent.is_recurring,
          days_of_week: newManualEvent.days_of_week.length > 0 ? newManualEvent.days_of_week : null,
        }]);

      if (error) throw error;

      await loadCalendarEvents();
      setIsAddingEvent(false);
      setNewManualEvent({
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        source: 'other',
        is_recurring: false,
        days_of_week: []
      });
      toast.success("Événement ajouté");
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col">
      {/* Fixed Header Section */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background border-b px-safe pt-safe pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Mon planning</h1>
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAddingEvent(true)}
              title="Ajouter un événement"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {revisionSessions.length > 0 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={async () => {
                  if (!user) return;
                  
                  const { error } = await supabase
                    .from('revision_sessions')
                    .delete()
                    .eq('user_id', user.id);
                  
                  if (error) {
                    toast.error("Erreur lors de la suppression");
                    return;
                  }
                  
                  await loadRevisionSessions();
                  await loadCalendarEvents();
                  toast.success("Toutes les sessions supprimées");
                }}
                title="Supprimer toutes les sessions de révisions"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="hero"
              size="icon"
              onClick={() => setSheetOpen(true)}
              disabled={isGenerating}
              title="Générer un planning IA"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2">
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
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setPlanningDate(date);
                  }
                }}
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

      {/* Scrollable Day View with Time Grid - with top padding for fixed header */}
      <div className="flex-1 overflow-auto pt-[140px] pb-[calc(5rem+env(safe-area-inset-bottom))] px-safe">
        <div className="relative">
          {/* Exams Section - Above the time grid */}
          {dayExams.length > 0 && (
            <div className="mb-4 space-y-2 px-2 py-3">
              {dayExams.map((exam: { id: string; subject: string; type: string; location: string; date: string }) => (
                <div
                  key={exam.id}
                  className="bg-primary/10 border-l-4 border-primary rounded px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    setEditingEvent({
                      type: 'exam',
                      data: { ...exam }
                    });
                  }}
                >
                  <span className="text-sm"></span>
                  <span className="text-sm font-semibold truncate">{exam.subject}</span>
                  {exam.type && <span className="text-xs text-muted-foreground">({exam.type})</span>}
                </div>
              ))}
            </div>
          )}

          {/* Time Grid */}
          <div className="flex">
            {/* Hours Column */}
            <div className="w-12 flex-shrink-0 pr-1">
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

              {/* Events, Work Schedules, Activities, Routines & Revision Sessions */}
              <div className="absolute inset-0 px-2">
                {dayEvents.length === 0 && dayRevisionSessions.length === 0 && dayWorkSchedules.length === 0 && dayActivities.length === 0 && dayRoutineMoments.length === 0 && dayPlannedEvents.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm italic">Aucun événement</p>
                  </div>
                ) : (
                  <>
                    {/* All events with overlap detection */}
                    {(() => {
                      // Collect all events with their time info
                      const allEvents: Array<{
                        type: 'calendar' | 'revision' | 'work' | 'activity' | 'routine' | 'planned';
                        data: any;
                        startMinutes: number;
                        endMinutes: number;
                        index: number;
                      }> = [];

                      // Add calendar events
                      dayEvents.forEach((event, index) => {
                        const start = new Date(event.startDate);
                        const end = new Date(event.endDate);
                        const startHour = start.getHours();
                        const startMinute = start.getMinutes();
                        const endHour = end.getHours();
                        const endMinute = end.getMinutes();
                        
                        const adjustedStartHour = startHour >= START_HOUR ? startHour - START_HOUR : startHour + 24 - START_HOUR;
                        const adjustedEndHour = endHour >= START_HOUR ? endHour - START_HOUR : endHour + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'calendar',
                          data: event,
                          startMinutes: (adjustedStartHour * 60) + startMinute,
                          endMinutes: (adjustedEndHour * 60) + endMinute,
                          index
                        });
                      });

                      // Add work schedules
                      dayWorkSchedules.forEach((schedule, index) => {
                        const start = new Date(schedule.start_date);
                        const end = new Date(schedule.end_date);
                        const startHours = start.getHours();
                        const startMinutes = start.getMinutes();
                        const endHours = end.getHours();
                        const endMinutes = end.getMinutes();
                        
                        const adjustedStartHour = startHours >= START_HOUR ? startHours - START_HOUR : startHours + 24 - START_HOUR;
                        const adjustedEndHour = endHours >= START_HOUR ? endHours - START_HOUR : endHours + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'work',
                          data: schedule,
                          startMinutes: (adjustedStartHour * 60) + startMinutes,
                          endMinutes: (adjustedEndHour * 60) + endMinutes,
                          index
                        });
                      });

                      // Add activities
                      dayActivities.forEach((activity, index) => {
                        const start = new Date(activity.start_date);
                        const end = new Date(activity.end_date);
                        const startHours = start.getHours();
                        const startMinutes = start.getMinutes();
                        const endHours = end.getHours();
                        const endMinutes = end.getMinutes();
                        
                        const adjustedStartHour = startHours >= START_HOUR ? startHours - START_HOUR : startHours + 24 - START_HOUR;
                        const adjustedEndHour = endHours >= START_HOUR ? endHours - START_HOUR : endHours + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'activity',
                          data: activity,
                          startMinutes: (adjustedStartHour * 60) + startMinutes,
                          endMinutes: (adjustedEndHour * 60) + endMinutes,
                          index
                        });
                      });

                      // Add routine moments
                      dayRoutineMoments.forEach((routine, index) => {
                        const start = new Date(routine.start_date);
                        const end = new Date(routine.end_date);
                        const startHours = start.getHours();
                        const startMinutes = start.getMinutes();
                        const endHours = end.getHours();
                        const endMinutes = end.getMinutes();
                        
                        const adjustedStartHour = startHours >= START_HOUR ? startHours - START_HOUR : startHours + 24 - START_HOUR;
                        const adjustedEndHour = endHours >= START_HOUR ? endHours - START_HOUR : endHours + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'routine',
                          data: routine,
                          startMinutes: (adjustedStartHour * 60) + startMinutes,
                          endMinutes: (adjustedEndHour * 60) + endMinutes,
                          index
                        });
                      });

                      // Add revision sessions
                      dayRevisionSessions.forEach((session) => {
                        const start = new Date(session.start_time);
                        const end = new Date(session.end_time);
                        const startHour = start.getHours();
                        const startMinute = start.getMinutes();
                        const endHour = end.getHours();
                        const endMinute = end.getMinutes();
                        
                        const adjustedStartHour = startHour >= START_HOUR ? startHour - START_HOUR : startHour + 24 - START_HOUR;
                        const adjustedEndHour = endHour >= START_HOUR ? endHour - START_HOUR : endHour + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'revision',
                          data: session,
                          startMinutes: (adjustedStartHour * 60) + startMinute,
                          endMinutes: (adjustedEndHour * 60) + endMinute,
                          index: 0
                        });
                      });

                      // Add planned events
                      dayPlannedEvents.forEach((event) => {
                        const start = new Date(event.start_time);
                        const end = new Date(event.end_time);
                        const startHour = start.getHours();
                        const startMinute = start.getMinutes();
                        const endHour = end.getHours();
                        const endMinute = end.getMinutes();
                        
                        const adjustedStartHour = startHour >= START_HOUR ? startHour - START_HOUR : startHour + 24 - START_HOUR;
                        const adjustedEndHour = endHour >= START_HOUR ? endHour - START_HOUR : endHour + 24 - START_HOUR;
                        
                        allEvents.push({
                          type: 'planned',
                          data: event,
                          startMinutes: (adjustedStartHour * 60) + startMinute,
                          endMinutes: (adjustedEndHour * 60) + endMinute,
                          index: 0
                        });
                      });

                      // Sort events by start time
                      allEvents.sort((a, b) => a.startMinutes - b.startMinutes);

                      // Detect overlaps and assign columns properly
                      const columnAssignments: number[] = []; // Store column for each event by index
                      
                      allEvents.forEach((event, eventIdx) => {
                        // Find which columns are occupied by overlapping earlier events
                        const occupiedColumns = new Set<number>();
                        
                        for (let i = 0; i < eventIdx; i++) {
                          const other = allEvents[i];
                          // Check if they overlap
                          if (other.startMinutes < event.endMinutes && other.endMinutes > event.startMinutes) {
                            occupiedColumns.add(columnAssignments[i]);
                          }
                        }
                        
                        // Find first available column
                        let targetColumn = 0;
                        while (occupiedColumns.has(targetColumn)) {
                          targetColumn++;
                        }
                        
                        columnAssignments[eventIdx] = targetColumn;
                      });

                      // Build final events with columns and calculate totalColumns
                      const finalEventsWithColumns = allEvents.map((event, eventIdx) => {
                        const column = columnAssignments[eventIdx];
                        
                        // Find all overlapping events to determine totalColumns
                        const overlappingColumns = new Set<number>();
                        overlappingColumns.add(column);
                        
                        allEvents.forEach((other, otherIdx) => {
                          if (eventIdx !== otherIdx && 
                              event.startMinutes < other.endMinutes && 
                              event.endMinutes > other.startMinutes) {
                            overlappingColumns.add(columnAssignments[otherIdx]);
                          }
                        });
                        
                        const totalColumns = overlappingColumns.size;
                        
                        return { event, column, totalColumns };
                      });

                      // Render all events
                      return finalEventsWithColumns.map(({ event, column, totalColumns }, idx) => {
                        const topPercent = (event.startMinutes / (DISPLAY_HOURS * 60)) * 100;
                        const heightPercent = ((event.endMinutes - event.startMinutes) / (DISPLAY_HOURS * 60)) * 100;
                        
                        const widthPercent = 100 / totalColumns;
                        const leftPercent = (column * widthPercent);

                        const style = {
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        };

                        // Render based on type
                        if (event.type === 'calendar') {
                          const evt = event.data;
                          const start = new Date(evt.startDate);
                          const end = new Date(evt.endDate);
                          const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;

                          return (
                            <div
                              key={`event-${event.index}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={async () => {
                                const { data } = await supabase
                                  .from('calendar_events')
                                  .select('*')
                                  .eq('user_id', user?.id)
                                  .eq('summary', evt.summary)
                                  .eq('start_date', evt.startDate)
                                  .maybeSingle();

                                if (data) {
                                  setEditingEvent({
                                    type: 'calendar',
                                    data: { ...data }
                                  });
                                }
                              }}
                            >
                              <div className="text-xs font-semibold truncate">{evt.summary}</div>
                              <div className="text-xs opacity-90">
                                {format(start, 'HH:mm')} - {format(end, 'HH:mm')} ({duration}h)
                              </div>
                              {evt.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{evt.location}</div>
                              )}
                            </div>
                          );
                        }

                        if (event.type === 'work') {
                          // Utiliser editingEvent si c'est l'événement en cours d'édition
                          const isEditing = editingEvent?.type === 'work' && editingEvent?.data?.id === event.data.id;
                          const schedule = isEditing ? editingEvent.data : event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`work-${schedule.id}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md border-2 border-primary/80 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                const occurrenceDate = format(selectedDate, 'yyyy-MM-dd');
                                setEditingEvent({
                                  type: 'work',
                                  data: { 
                                    ...event.data,
                                    parentEventId: event.data.id,
                                    start_time: format(new Date(event.data.start_date), 'HH:mm'),
                                    end_time: format(new Date(event.data.end_date), 'HH:mm'),
                                  },
                                  occurrenceDate,
                                  isRecurring: event.data.is_recurring || false,
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                {schedule.title || 'Travail'}
                              </div>
                              <div className="text-xs opacity-90">
                                {format(new Date(schedule.start_date), 'HH:mm')} - {format(new Date(schedule.end_date), 'HH:mm')} ({duration} min)
                              </div>
                              {schedule.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{schedule.location}</div>
                              )}
                            </div>
                          );
                        }

                        if (event.type === 'activity') {
                          // Utiliser editingEvent si c'est l'événement en cours d'édition
                          const isEditing = editingEvent?.type === 'activity' && editingEvent?.data?.id === event.data.id;
                          const activity = isEditing ? editingEvent.data : event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`activity-${activity.id}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md border-2 border-primary/80 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                const occurrenceDate = format(selectedDate, 'yyyy-MM-dd');
                                setEditingEvent({
                                  type: 'activity',
                                  data: { 
                                    ...event.data,
                                    parentEventId: event.data.id,
                                    start_time: format(new Date(event.data.start_date), 'HH:mm'),
                                    end_time: format(new Date(event.data.end_date), 'HH:mm'),
                                  },
                                  occurrenceDate,
                                  isRecurring: event.data.is_recurring || false,
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                {activity.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {format(new Date(activity.start_date), 'HH:mm')} - {format(new Date(activity.end_date), 'HH:mm')} ({duration} min)
                              </div>
                              {activity.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{activity.location}</div>
                              )}
                            </div>
                          );
                        }

                        if (event.type === 'routine') {
                          // Utiliser editingEvent si c'est l'événement en cours d'édition
                          const isEditing = editingEvent?.type === 'routine' && editingEvent?.data?.id === event.data.id;
                          const routine = isEditing ? editingEvent.data : event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`routine-${routine.id}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md border-2 border-primary/80 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                const occurrenceDate = format(selectedDate, 'yyyy-MM-dd');
                                setEditingEvent({
                                  type: 'routine',
                                  data: { 
                                    ...event.data,
                                    parentEventId: event.data.id,
                                    start_time: format(new Date(event.data.start_date), 'HH:mm'),
                                    end_time: format(new Date(event.data.end_date), 'HH:mm'),
                                  },
                                  occurrenceDate,
                                  isRecurring: event.data.is_recurring || false,
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                {routine.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {format(new Date(routine.start_date), 'HH:mm')} - {format(new Date(routine.end_date), 'HH:mm')} ({duration} min)
                              </div>
                            </div>
                          );
                        }

                        if (event.type === 'revision') {
                          const session = event.data;
                          const start = new Date(session.start_time);
                          const end = new Date(session.end_time);
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`session-${session.id}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md border-2 border-primary/80 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                setEditingEvent({
                                  type: 'revision',
                                  data: { ...session }
                                });
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold truncate">{session.subject}</div>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRevisionSession(session.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        if (event.type === 'planned') {
                          const plannedEvent = event.data;
                          const start = new Date(plannedEvent.start_time);
                          const end = new Date(plannedEvent.end_time);
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`planned-${plannedEvent.id}-${idx}`}
                              className="absolute bg-primary text-primary-foreground rounded-lg p-2 overflow-hidden shadow-md border-2 border-primary/80 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                setEditingEvent({
                                  type: 'planned',
                                  data: { ...plannedEvent }
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                📅 {plannedEvent.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {format(start, 'HH:mm')} - {format(end, 'HH:mm')} ({duration} min)
                              </div>
                              {plannedEvent.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{plannedEvent.location}</div>
                              )}
                            </div>
                          );
                        }

                        return null;
                      });
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer pour ajouter un événement manuel */}
      <Drawer open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ajouter un événement</DrawerTitle>
            <DrawerDescription>
              Crée un nouvel événement dans ton calendrier
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label htmlFor="new-title">Titre *</Label>
              <Input
                id="new-title"
                value={newManualEvent.title}
                onChange={(e) => setNewManualEvent({ ...newManualEvent, title: e.target.value })}
                placeholder="Titre de l'événement"
              />
            </div>
            
            <div>
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                value={newManualEvent.description}
                onChange={(e) => setNewManualEvent({ ...newManualEvent, description: e.target.value })}
                placeholder="Description (optionnel)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="new-start">Début *</Label>
                <Input
                  id="new-start"
                  type="datetime-local"
                  value={newManualEvent.start_date}
                  onChange={(e) => setNewManualEvent({ ...newManualEvent, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new-end">Fin *</Label>
                <Input
                  id="new-end"
                  type="datetime-local"
                  value={newManualEvent.end_date}
                  onChange={(e) => setNewManualEvent({ ...newManualEvent, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-location">Lieu</Label>
              <Input
                id="new-location"
                value={newManualEvent.location}
                onChange={(e) => setNewManualEvent({ ...newManualEvent, location: e.target.value })}
                placeholder="Lieu (optionnel)"
              />
            </div>

            <div>
              <Label htmlFor="new-source">Type d'événement *</Label>
              <select
                id="new-source"
                value={newManualEvent.source}
                onChange={(e) => setNewManualEvent({ ...newManualEvent, source: e.target.value as 'school' | 'work' | 'sport' | 'other' })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="other">Autre</option>
                <option value="school">École</option>
                <option value="work">Travail</option>
                <option value="sport">Sport/Activité</option>
              </select>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAddManualEvent}>Ajouter</Button>
            <DrawerClose asChild>
              <Button variant="outline">Annuler</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer pour éditer les événements */}
      <Drawer open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingEvent?.type === 'calendar' && 'Modifier l\'événement'}
              {editingEvent?.type === 'revision' && 'Modifier la session de révision'}
              {editingEvent?.type === 'work' && 'Modifier l\'horaire de travail'}
              {editingEvent?.type === 'exam' && 'Modifier l\'examen'}
              {editingEvent?.type === 'activity' && 'Modifier l\'activité'}
              {editingEvent?.type === 'routine' && 'Modifier le moment de routine'}
              {editingEvent?.type === 'planned' && 'Modifier l\'événement'}
            </DrawerTitle>
            <DrawerDescription>
              Modifie les informations de cet événement
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            {/* Formulaires de modification */}

            {editingEvent?.type === 'calendar' && (
              <>
                <div>
                  <Label htmlFor="edit-summary">Titre</Label>
                  <Input
                    id="edit-summary"
                    value={editingEvent.data.summary || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, summary: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-start">Début</Label>
                    <Input
                      id="edit-start"
                      type="datetime-local"
                      value={editingEvent.data.start_date ? format(new Date(editingEvent.data.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, start_date: new Date(e.target.value).toISOString() }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end">Fin</Label>
                    <Input
                      id="edit-end"
                      type="datetime-local"
                      value={editingEvent.data.end_date ? format(new Date(editingEvent.data.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, end_date: new Date(e.target.value).toISOString() }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-location">Lieu</Label>
                  <Input
                    id="edit-location"
                    value={editingEvent.data.location || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, location: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            {editingEvent?.type === 'revision' && (
              <>
                <div>
                  <Label htmlFor="edit-subject">Matière</Label>
                  <Input
                    id="edit-subject"
                    value={editingEvent.data.subject || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, subject: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-start-time">Début</Label>
                    <Input
                      id="edit-start-time"
                      type="datetime-local"
                      value={editingEvent.data.start_time ? format(new Date(editingEvent.data.start_time), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, start_time: new Date(e.target.value).toISOString() }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-time">Fin</Label>
                    <Input
                      id="edit-end-time"
                      type="datetime-local"
                      value={editingEvent.data.end_time ? format(new Date(editingEvent.data.end_time), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, end_time: new Date(e.target.value).toISOString() }
                      })}
                    />
                  </div>
                </div>
              </>
            )}

            {editingEvent?.type === 'work' && (
              <>
                <div>
                  <Label htmlFor="edit-work-title">Titre</Label>
                  <Input
                    id="edit-work-title"
                    value={editingEvent.data.title || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, title: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-work-start">Début</Label>
                    <Input
                      id="edit-work-start"
                      type="datetime-local"
                      value={editingEvent.data.start_date ? format(new Date(editingEvent.data.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          start_date: new Date(e.target.value).toISOString(),
                          start_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-work-end">Fin</Label>
                    <Input
                      id="edit-work-end"
                      type="datetime-local"
                      value={editingEvent.data.end_date ? format(new Date(editingEvent.data.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          end_date: new Date(e.target.value).toISOString(),
                          end_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-work-location">Lieu</Label>
                  <Input
                    id="edit-work-location"
                    value={editingEvent.data.location || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, location: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            {editingEvent?.type === 'exam' && (
              <>
                <div>
                  <Label htmlFor="edit-exam-subject">Matière</Label>
                  <Input
                    id="edit-exam-subject"
                    value={editingEvent.data.subject || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, subject: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-exam-date">Date</Label>
                  <Input
                    id="edit-exam-date"
                    type="date"
                    value={editingEvent.data.date || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, date: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-exam-type">Type</Label>
                  <Input
                    id="edit-exam-type"
                    value={editingEvent.data.type || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, type: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-exam-location">Lieu</Label>
                  <Input
                    id="edit-exam-location"
                    value={editingEvent.data.location || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, location: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            {editingEvent?.type === 'activity' && (
              <>
                <div>
                  <Label htmlFor="edit-activity-title">Titre</Label>
                  <Input
                    id="edit-activity-title"
                    value={editingEvent.data.title || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, title: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-activity-start">Début</Label>
                    <Input
                      id="edit-activity-start"
                      type="datetime-local"
                      value={editingEvent.data.start_date ? format(new Date(editingEvent.data.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          start_date: new Date(e.target.value).toISOString(),
                          start_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-activity-end">Fin</Label>
                    <Input
                      id="edit-activity-end"
                      type="datetime-local"
                      value={editingEvent.data.end_date ? format(new Date(editingEvent.data.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          end_date: new Date(e.target.value).toISOString(),
                          end_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-activity-location">Lieu</Label>
                  <Input
                    id="edit-activity-location"
                    value={editingEvent.data.location || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, location: e.target.value }
                    })}
                  />
                </div>
              </>
            )}

            {editingEvent?.type === 'routine' && (
              <>
                <div>
                  <Label htmlFor="edit-routine-title">Titre</Label>
                  <Input
                    id="edit-routine-title"
                    value={editingEvent.data.title || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      data: { ...editingEvent.data, title: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-routine-start">Début</Label>
                    <Input
                      id="edit-routine-start"
                      type="datetime-local"
                      value={editingEvent.data.start_date ? format(new Date(editingEvent.data.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          start_date: new Date(e.target.value).toISOString(),
                          start_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-routine-end">Fin</Label>
                    <Input
                      id="edit-routine-end"
                      type="datetime-local"
                      value={editingEvent.data.end_date ? format(new Date(editingEvent.data.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { 
                          ...editingEvent.data, 
                          end_date: new Date(e.target.value).toISOString(),
                          end_time: format(new Date(e.target.value), 'HH:mm')
                        }
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DrawerFooter>
            {/* Afficher les options pour événements récurrents */}
            {editingEvent?.isRecurring && (
              <div className="mb-4 space-y-3">
                <p className="text-sm font-medium">Est-ce que cela concerne :</p>
                <RadioGroup 
                  value={applyToAll ? "all" : "single"} 
                  onValueChange={(value) => setApplyToAll(value === "all")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="font-normal cursor-pointer">
                      Cette occurrence
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">
                      Toutes les occurrences
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-2 w-full">
              <Button 
                variant="destructive" 
                onClick={handleDeleteEvent}
                className="flex-1"
              >
                Supprimer
              </Button>
              <Button 
                onClick={handleUpdateEvent}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>

            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Annuler</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer pour générer le planning IA */}
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Génération du planning IA</DrawerTitle>
            <DrawerDescription>
              L'IA va générer ton planning en RESPECTANT STRICTEMENT tous tes critères : intensité choisie, horaires disponibles, et ZÉRO chevauchement avec tes événements existants. Les sessions seront placées UNIQUEMENT sur des créneaux totalement libres.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-6">
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
                    Léger (max 1 session/jour, 45-60 min)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="font-normal">
                    Standard (max 2 sessions/jour, 60-90 min)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intensif" id="intensif" />
                  <Label htmlFor="intensif" className="font-normal">
                    Intensif (max 3 sessions/jour, 75-120 min)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DrawerFooter>
            <Button 
              onClick={handleGeneratePlanning} 
              disabled={isGenerating || examsCount === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Génération...' : 'Lancer la génération'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">
                Annuler
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Planning;
