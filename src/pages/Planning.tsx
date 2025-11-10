import { useState, useEffect, useRef, useMemo } from "react";
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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
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
  const { refetchAll, workSchedules, activities, routineMoments, calendarEvents, exams, revisionSessions: contextRevisionSessions } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intensity, setIntensity] = useState<IntensityLevel>('standard');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    type: 'calendar' | 'revision' | 'work' | 'exam' | 'activity' | 'routine' | 'planned';
    data: any;
    isRecurring?: boolean;
    selectedDate?: Date;
  } | null>(null);
  const [recurrenceChoice, setRecurrenceChoice] = useState<'this' | 'all'>('this');
  const [eventExceptions, setEventExceptions] = useState<any[]>([]);
  const [plannedEvents, setPlannedEvents] = useState<any[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    color: '#3b82f6'
  });

  // Utiliser les données du contexte transformées
  const importedEvents = useMemo(() => {
    return (calendarEvents || []).map(event => ({
      summary: event.summary,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location || '',
      description: event.description || '',
    }));
  }, [calendarEvents]);

  const revisionSessions = useMemo(() => contextRevisionSessions || [], [contextRevisionSessions]);
  const examsCount = useMemo(() => (exams || []).length, [exams]);

  useEffect(() => {
    // Check if running on native platform
    setIsNative(Capacitor.isNativePlatform());
    
    if (user) {
      loadEventExceptions();
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

  const loadEventExceptions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('event_exceptions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading event exceptions:', error);
      return;
    }

    setEventExceptions(data || []);
  };

  const loadPlannedEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('planned_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading planned events:', error);
      return;
    }

    setPlannedEvents(data || []);
  };

  // Plus besoin de loadCalendarEvents, loadRevisionSessions, loadExamsCount

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
      // Recharger depuis Supabase
      refetchAll();
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

    // Recharger depuis Supabase
    refetchAll();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    toast.loading("Import du fichier en cours...", { id: 'import-ics' });

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

        // Supprimer les événements existants
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user.id);

        // Insérer les nouveaux événements
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

        toast.dismiss('import-ics');
        toast.success("Calendrier importé avec succès");

        // Recharger depuis Supabase
        refetchAll();
      } catch (error) {
        console.error('Error importing calendar:', error);
        toast.dismiss('import-ics');
        toast.error("Erreur lors de l'import du fichier");
      }
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get exams for selected day using memoized data
  const dayExams = useMemo(() => {
    return (exams || []).filter((exam: { date: string }) => 
      isSameDay(new Date(exam.date), selectedDate)
    );
  }, [exams, selectedDate]);

  // Get events for selected day - memoized
  const dayEvents = useMemo(() => 
    importedEvents.filter(event => 
      isSameDay(new Date(event.startDate), selectedDate)
    ), [importedEvents, selectedDate]);

  // Get revision sessions for selected day - memoized
  const dayRevisionSessions = useMemo(() => 
    revisionSessions.filter(session => 
      isSameDay(new Date(session.start_time), selectedDate)
    ), [revisionSessions, selectedDate]);

  // Get planned events for selected day - memoized
  const dayPlannedEvents = useMemo(() => 
    plannedEvents.filter(event => 
      isSameDay(new Date(event.start_time), selectedDate)
    ), [plannedEvents, selectedDate]);

  // Get work schedules for selected day - memoized
  const selectedDayName = useMemo(() => 
    format(selectedDate, 'EEEE', { locale: fr }).toLowerCase(), 
    [selectedDate]
  );
  
  const selectedDateStr = useMemo(() => 
    format(selectedDate, 'yyyy-MM-dd'), 
    [selectedDate]
  );
  
  const dayWorkSchedules = useMemo(() => {
    return (workSchedules || [])
      .filter(schedule => {
        const hasDay = schedule.days.includes(selectedDayName);
        if (!hasDay) return false;
        
        // Vérifier si cette occurrence a une exception "deleted"
        const hasException = eventExceptions.some(
          exc => exc.source_type === 'work_schedule' 
            && exc.source_id === schedule.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'deleted'
        );
        
        return !hasException;
      })
      .map(schedule => {
        // Vérifier si cette occurrence a une exception "modified"
        const exception = eventExceptions.find(
          exc => exc.source_type === 'work_schedule' 
            && exc.source_id === schedule.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'modified'
        );
        
        // Si une exception existe, utiliser les données modifiées
        if (exception && exception.modified_data) {
          return {
            ...schedule,
            ...exception.modified_data
          };
        }
        
        return schedule;
      });
  }, [workSchedules, selectedDayName, selectedDateStr, eventExceptions]);

  // Get activities for selected day - memoized
  const dayActivities = useMemo(() => {
    return (activities || [])
      .filter(activity => {
        const hasDay = activity.days.includes(selectedDayName);
        if (!hasDay) return false;
        
        const hasException = eventExceptions.some(
          exc => exc.source_type === 'activity' 
            && exc.source_id === activity.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'deleted'
        );
        
        return !hasException;
      })
      .map(activity => {
        const exception = eventExceptions.find(
          exc => exc.source_type === 'activity' 
            && exc.source_id === activity.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'modified'
        );
        
        if (exception && exception.modified_data) {
          return {
            ...activity,
            ...exception.modified_data
          };
        }
        
        return activity;
      });
  }, [activities, selectedDayName, selectedDateStr, eventExceptions]);

  // Get routine moments for selected day - memoized
  const dayRoutineMoments = useMemo(() => {
    return (routineMoments || [])
      .filter(routine => {
        const hasDay = routine.days.includes(selectedDayName);
        if (!hasDay) return false;
        
        const hasException = eventExceptions.some(
          exc => exc.source_type === 'routine_moment' 
            && exc.source_id === routine.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'deleted'
        );
        
        return !hasException;
      })
      .map(routine => {
        const exception = eventExceptions.find(
          exc => exc.source_type === 'routine_moment' 
            && exc.source_id === routine.id 
            && exc.exception_date === selectedDateStr
            && exc.exception_type === 'modified'
        );
        
        if (exception && exception.modified_data) {
          return {
            ...routine,
            ...exception.modified_data
          };
        }
        
        return routine;
      });
  }, [routineMoments, selectedDayName, selectedDateStr, eventExceptions]);

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
        refetchAll();
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
        refetchAll();
      } else if (editingEvent.type === 'work') {
        // Si c'est récurrent et qu'on modifie seulement cette occurrence
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          // Créer une exception de type "modified"
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'work_schedule',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'modified',
              modified_data: {
                title: editingEvent.data.title,
                start_time: editingEvent.data.start_time,
                end_time: editingEvent.data.end_time,
                location: editingEvent.data.location,
              }
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) throw error;
          await loadEventExceptions();
        } else {
          // Modifier toutes les occurrences
          const { error } = await supabase
            .from('work_schedules')
            .update({
              title: editingEvent.data.title,
              start_time: editingEvent.data.start_time,
              end_time: editingEvent.data.end_time,
              location: editingEvent.data.location,
            })
            .eq('id', editingEvent.data.id);

          if (error) throw error;
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
        refetchAll();
      } else if (editingEvent.type === 'planned') {
        const { error } = await supabase
          .from('planned_events')
          .update({
            title: editingEvent.data.title,
            start_time: editingEvent.data.start_time,
            end_time: editingEvent.data.end_time,
            location: editingEvent.data.location,
            description: editingEvent.data.description,
            color: editingEvent.data.color,
          })
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        await loadPlannedEvents();
      } else if (editingEvent.type === 'activity') {
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'activity',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'modified',
              modified_data: {
                title: editingEvent.data.title,
                start_time: editingEvent.data.start_time,
                end_time: editingEvent.data.end_time,
                location: editingEvent.data.location,
              }
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) throw error;
          await loadEventExceptions();
        } else {
          const { error } = await supabase
            .from('activities')
            .update({
              title: editingEvent.data.title,
              start_time: editingEvent.data.start_time,
              end_time: editingEvent.data.end_time,
              location: editingEvent.data.location,
            })
            .eq('id', editingEvent.data.id);

          if (error) throw error;
        }
      } else if (editingEvent.type === 'routine') {
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'routine_moment',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'modified',
              modified_data: {
                title: editingEvent.data.title,
                start_time: editingEvent.data.start_time,
                end_time: editingEvent.data.end_time,
              }
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) throw error;
          await loadEventExceptions();
        } else {
          const { error } = await supabase
            .from('routine_moments')
            .update({
              title: editingEvent.data.title,
              start_time: editingEvent.data.start_time,
              end_time: editingEvent.data.end_time,
            })
            .eq('id', editingEvent.data.id);

          if (error) throw error;
        }
      }

      refetchAll();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !user) return;

    try {
      if (editingEvent.type === 'calendar') {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        refetchAll();
      } else if (editingEvent.type === 'revision') {
        const { error } = await supabase
          .from('revision_sessions')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        refetchAll();
      } else if (editingEvent.type === 'work') {
        // Si c'est récurrent et qu'on supprime seulement cette occurrence
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          // Créer une exception de type "deleted" 
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'work_schedule',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'deleted',
              modified_data: null
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) {
            console.error('Error creating exception:', error);
            throw error;
          }
          
          console.log('Exception créée pour:', exceptionDate, editingEvent.data.id);
          await loadEventExceptions();
        } else {
          // Supprimer toutes les occurrences
          const { error } = await supabase
            .from('work_schedules')
            .delete()
            .eq('id', editingEvent.data.id);

          if (error) throw error;
        }
      } else if (editingEvent.type === 'exam') {
        const { error } = await supabase
          .from('exams')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        refetchAll();
      } else if (editingEvent.type === 'planned') {
        const { error } = await supabase
          .from('planned_events')
          .delete()
          .eq('id', editingEvent.data.id);

        if (error) throw error;
        await loadPlannedEvents();
      } else if (editingEvent.type === 'activity') {
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'activity',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'deleted',
              modified_data: null
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) throw error;
          await loadEventExceptions();
        } else {
          const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', editingEvent.data.id);

          if (error) throw error;
        }
      } else if (editingEvent.type === 'routine') {
        if (editingEvent.isRecurring && recurrenceChoice === 'this' && editingEvent.selectedDate) {
          const exceptionDate = format(editingEvent.selectedDate, 'yyyy-MM-dd');
          
          const { error } = await supabase
            .from('event_exceptions')
            .upsert({
              user_id: user.id,
              source_type: 'routine_moment',
              source_id: editingEvent.data.id,
              exception_date: exceptionDate,
              exception_type: 'deleted',
              modified_data: null
            }, {
              onConflict: 'user_id,source_type,source_id,exception_date'
            });

          if (error) throw error;
          await loadEventExceptions();
        } else {
          const { error } = await supabase
            .from('routine_moments')
            .delete()
            .eq('id', editingEvent.data.id);

          if (error) throw error;
        }
      }

      // Recharger toutes les données
      refetchAll();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  }

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !newEvent.start_time || !newEvent.end_time) {
      toast.error("Remplis tous les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase
        .from('planned_events')
        .insert({
          user_id: user.id,
          title: newEvent.title,
          description: newEvent.description,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          location: newEvent.location,
          color: newEvent.color,
        });

      if (error) throw error;

      await loadPlannedEvents();
      refetchAll();
      setIsAddingEvent(false);
      setNewEvent({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        color: '#3b82f6'
      });
      toast.error("Événement ajouté");
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
                  <span className="text-sm">📚</span>
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
                        const [startHours, startMinutes] = schedule.start_time.split(':').map(Number);
                        const [endHours, endMinutes] = schedule.end_time.split(':').map(Number);
                        
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
                        const [startHours, startMinutes] = activity.start_time.split(':').map(Number);
                        const [endHours, endMinutes] = activity.end_time.split(':').map(Number);
                        
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
                        const [startHours, startMinutes] = routine.start_time.split(':').map(Number);
                        const [endHours, endMinutes] = routine.end_time.split(':').map(Number);
                        
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
                          const schedule = event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));
                          const typeEmoji = schedule.type === 'alternance' ? '💼' : schedule.type === 'job' ? '🏢' : '📋';

                          return (
                            <div
                              key={`work-${schedule.id}-${idx}`}
                              className="absolute bg-blue-500/90 text-white rounded-lg p-2 overflow-hidden shadow-md border-2 border-blue-600 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                setEditingEvent({
                                  type: 'work',
                                  data: { ...schedule },
                                  isRecurring: true,
                                  selectedDate: selectedDate
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                {typeEmoji} {schedule.title || 'Travail'}
                              </div>
                              <div className="text-xs opacity-90">
                                {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)} ({duration} min)
                              </div>
                              {schedule.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{schedule.location}</div>
                              )}
                            </div>
                          );
                        }

                        if (event.type === 'activity') {
                          const activity = event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`activity-${activity.id}-${idx}`}
                              className="absolute bg-green-500/90 text-white rounded-lg p-2 overflow-hidden shadow-md border-2 border-green-600 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                setEditingEvent({
                                  type: 'activity',
                                  data: { ...activity },
                                  isRecurring: true,
                                  selectedDate: selectedDate
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                🏃 {activity.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {activity.start_time.substring(0, 5)} - {activity.end_time.substring(0, 5)} ({duration} min)
                              </div>
                              {activity.location && (
                                <div className="text-xs opacity-80 truncate mt-1">{activity.location}</div>
                              )}
                            </div>
                          );
                        }

                        if (event.type === 'routine') {
                          const routine = event.data;
                          const duration = Math.round(((event.endMinutes - event.startMinutes)));

                          return (
                            <div
                              key={`routine-${routine.id}-${idx}`}
                              className="absolute bg-purple-500/90 text-white rounded-lg p-2 overflow-hidden shadow-md border-2 border-purple-600 cursor-pointer hover:opacity-90 transition-opacity"
                              style={style}
                              onClick={() => {
                                setEditingEvent({
                                  type: 'routine',
                                  data: { ...routine },
                                  isRecurring: true,
                                  selectedDate: selectedDate
                                });
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                ⏰ {routine.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {routine.start_time.substring(0, 5)} - {routine.end_time.substring(0, 5)} ({duration} min)
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
                              className="absolute bg-indigo-500/90 text-white rounded-lg p-2 overflow-hidden shadow-md border-2 border-indigo-600 cursor-pointer hover:opacity-90 transition-opacity"
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
                              className="absolute text-white rounded-lg p-2 overflow-hidden shadow-md border-2 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                ...style,
                                backgroundColor: plannedEvent.color || '#3b82f6',
                                borderColor: plannedEvent.color || '#3b82f6',
                              }}
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

      {/* Drawer pour ajouter un événement */}
      <Drawer open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ajouter un événement</DrawerTitle>
            <DrawerDescription>
              Crée un nouvel événement dans ton planning
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label htmlFor="new-title">Titre *</Label>
              <Input
                id="new-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Titre de l'événement"
              />
            </div>
            
            <div>
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Description (optionnel)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="new-start">Début *</Label>
                <Input
                  id="new-start"
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new-end">Fin *</Label>
                <Input
                  id="new-end"
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-location">Lieu</Label>
              <Input
                id="new-location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Lieu (optionnel)"
              />
            </div>

            <div>
              <Label htmlFor="new-color">Couleur</Label>
              <Input
                id="new-color"
                type="color"
                value={newEvent.color}
                onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAddEvent}>Ajouter</Button>
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
            {/* Choix pour événements récurrents */}
            {editingEvent?.isRecurring && (editingEvent.type === 'work' || editingEvent.type === 'activity' || editingEvent.type === 'routine') && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <Label>Que veux-tu modifier ?</Label>
                <RadioGroup value={recurrenceChoice} onValueChange={(v) => setRecurrenceChoice(v as 'this' | 'all')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="this" id="this-occ" />
                    <Label htmlFor="this-occ" className="font-normal">
                      Cette occurrence ({format(editingEvent?.selectedDate || new Date(), 'd MMM', { locale: fr })})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all-occ" />
                    <Label htmlFor="all-occ" className="font-normal">
                      Toutes les occurrences
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

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
                      type="time"
                      value={editingEvent.data.start_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, start_time: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-work-end">Fin</Label>
                    <Input
                      id="edit-work-end"
                      type="time"
                      value={editingEvent.data.end_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, end_time: e.target.value }
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
                      type="time"
                      value={editingEvent.data.start_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, start_time: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-activity-end">Fin</Label>
                    <Input
                      id="edit-activity-end"
                      type="time"
                      value={editingEvent.data.end_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, end_time: e.target.value }
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
                      type="time"
                      value={editingEvent.data.start_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, start_time: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-routine-end">Fin</Label>
                    <Input
                      id="edit-routine-end"
                      type="time"
                      value={editingEvent.data.end_time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data: { ...editingEvent.data, end_time: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DrawerFooter>
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
              Skoolife va créer un planning de révision personnalisé basé sur tes examens, ton emploi du temps et tes contraintes.
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
