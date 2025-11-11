import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useNavigationState } from "@/contexts/NavigationStateContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkTab } from "@/components/constraints/WorkTab";
import { ActivityTab } from "@/components/constraints/ActivityTab";
import { RoutineTab } from "@/components/constraints/RoutineTab";
import { CommuteTab } from "@/components/constraints/CommuteTab";

interface WorkSchedule {
  id?: string;
  type: 'alternance' | 'job' | 'other';
  title?: string;
  days: string[];
  start_time: string;
  end_time: string;
  location?: string;
  frequency?: 'weekly' | 'biweekly';
  hours_per_week?: number;
  alternance_rhythm?: '2j_3j' | '3j_2j' | '1sem_1sem' | '1sem_2sem';
  start_date?: string;
  company_name?: string;
}

interface Activity {
  id?: string;
  type: 'sport' | 'asso' | 'cours' | 'projet' | 'autre';
  title: string;
  days: string[];
  start_time: string;
  end_time: string;
  location?: string;
}

interface RoutineMoment {
  id?: string;
  title: string;
  days: string[];
  start_time: string;
  end_time: string;
}

const Constraints = () => {
  const { 
    constraintsProfile, 
    calendarEvents,
    refetchAll
  } = useData();
  const { state, setConstraintsTab } = useNavigationState();
  
  const [activeTab, setActiveTab] = useState<'travail' | 'activite' | 'routine' | 'trajet'>(state.constraints.activeTab);
  
  // Work data
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  
  // Activity data
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Routine data
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [noStudyAfter, setNoStudyAfter] = useState('22:00');
  const [sleepHoursNeeded, setSleepHoursNeeded] = useState(8);
  const [minPersonalTimePerWeek, setMinPersonalTimePerWeek] = useState(5);
  const [routineMoments, setRoutineMoments] = useState<RoutineMoment[]>([]);
  
  // Commute data
  const [commuteHomeSchool, setCommuteHomeSchool] = useState(0);
  const [commuteHomeJob, setCommuteHomeJob] = useState(0);
  const [commuteHomeActivity, setCommuteHomeActivity] = useState(0);

  // Filtrer les calendar_events par type et mapper vers les anciennes structures
  useEffect(() => {
    if (calendarEvents) {
      // Filtrer les événements de type 'work'
      const workEvents = calendarEvents
        .filter(event => event.type === 'work')
        .map(event => ({
          id: event.id,
          type: event.metadata?.work_type || 'other',
          title: event.title,
          days: event.days || [],
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          frequency: event.metadata?.frequency,
          hours_per_week: event.metadata?.hours_per_week,
          alternance_rhythm: event.metadata?.alternance_rhythm,
          start_date: event.metadata?.start_date,
          company_name: event.metadata?.company_name,
        }));
      setWorkSchedules(workEvents);

      // Filtrer les événements de type 'sport'
      const sportEvents = calendarEvents
        .filter(event => event.type === 'sport')
        .map(event => ({
          id: event.id,
          type: event.metadata?.activity_type || 'sport',
          title: event.title,
          days: event.days || [],
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
        }));
      setActivities(sportEvents);

      // Filtrer les événements de type 'others'
      const otherEvents = calendarEvents
        .filter(event => event.type === 'others')
        .map(event => ({
          id: event.id,
          title: event.title,
          days: event.days || [],
          start_time: event.start_time,
          end_time: event.end_time,
        }));
      setRoutineMoments(otherEvents);
    }
  }, [calendarEvents]);

  useEffect(() => {
    if (constraintsProfile) {
      setWakeUpTime(constraintsProfile.wake_up_time || '07:00');
      setNoStudyAfter(constraintsProfile.no_study_after || '22:00');
      setSleepHoursNeeded(constraintsProfile.sleep_hours_needed || 8);
      setMinPersonalTimePerWeek(constraintsProfile.min_personal_time_per_week || 5);
      setCommuteHomeSchool(constraintsProfile.commute_home_school || 0);
      setCommuteHomeJob(constraintsProfile.commute_home_job || 0);
      setCommuteHomeActivity(constraintsProfile.commute_home_activity || 0);
    }
  }, [constraintsProfile]);


  const saveWorkSchedules = async (schedules: WorkSchedule[]) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      // Supprimer tous les événements de type 'work'
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'work');
      
      if (deleteError) {
        console.error('Error deleting work schedules:', deleteError);
        toast.error("Erreur lors de l'enregistrement du travail");
        return;
      }
      
      // Insérer les nouveaux horaires de travail
      if (schedules.length > 0) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(schedules.map(s => ({
            user_id: userId,
            type: 'work',
            is_recurring: true,
            days: s.days,
            start_time: s.start_time,
            end_time: s.end_time,
            title: s.title,
            summary: s.title,
            location: s.location || null,
            metadata: {
              work_type: s.type,
              company_name: s.company_name,
              alternance_rhythm: s.alternance_rhythm,
              frequency: s.frequency,
              hours_per_week: s.hours_per_week,
              start_date: s.start_date,
            }
          })));
        
        if (error) {
          console.error('Error inserting work schedules:', error);
          toast.error("Erreur lors de l'enregistrement du travail");
          return;
        }
      }
      
      refetchAll();
    } catch (error) {
      console.error('Error saving work schedules:', error);
      toast.error("Erreur lors de l'enregistrement du travail");
    }
  };

  const saveActivities = async (acts: Activity[]) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      // Supprimer tous les événements de type 'sport'
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'sport');
      
      if (deleteError) {
        console.error('Error deleting activities:', deleteError);
        toast.error("Erreur lors de l'enregistrement des activités");
        return;
      }
      
      if (acts.length > 0) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(acts.map(a => ({
            user_id: userId,
            type: 'sport',
            is_recurring: true,
            days: a.days,
            start_time: a.start_time,
            end_time: a.end_time,
            title: a.title,
            summary: a.title,
            location: a.location || null,
            metadata: {
              activity_type: a.type
            }
          })));
        
        if (error) {
          console.error('Error inserting activities:', error);
          toast.error("Erreur lors de l'enregistrement des activités");
          return;
        }
      }
      
      refetchAll();
    } catch (error) {
      console.error('Error saving activities:', error);
      toast.error("Erreur lors de l'enregistrement des activités");
    }
  };

  const saveRoutineMoments = async (moments: RoutineMoment[]) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      // Supprimer tous les événements de type 'others'
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'others');
      
      if (deleteError) {
        console.error('Error deleting routine moments:', deleteError);
        toast.error("Erreur lors de l'enregistrement de la routine");
        return;
      }
      
      if (moments.length > 0) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(moments.map(m => ({
            user_id: userId,
            type: 'others',
            is_recurring: true,
            days: m.days,
            start_time: m.start_time,
            end_time: m.end_time,
            title: m.title,
            summary: m.title,
            metadata: {}
          })));
        
        if (error) {
          console.error('Error inserting routine moments:', error);
          toast.error("Erreur lors de l'enregistrement de la routine");
          return;
        }
      }
      
      refetchAll();
    } catch (error) {
      console.error('Error saving routine moments:', error);
      toast.error("Erreur lors de l'enregistrement de la routine");
    }
  };

  const saveProfile = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      const { error } = await supabase
        .from('user_constraints_profile')
        .upsert({
          user_id: userId,
          wake_up_time: wakeUpTime,
          no_study_after: noStudyAfter,
          sleep_hours_needed: sleepHoursNeeded,
          min_personal_time_per_week: minPersonalTimePerWeek,
          commute_home_school: commuteHomeSchool,
          commute_home_job: commuteHomeJob,
          commute_home_activity: commuteHomeActivity,
        });
      
      if (error) {
        console.error('Error saving profile:', error);
        toast.error("Erreur lors de l'enregistrement du profil");
        return;
      }
      
      refetchAll();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Erreur lors de l'enregistrement du profil");
    }
  };

  const handleWorkSchedulesChange = async (schedules: WorkSchedule[]) => {
    setWorkSchedules(schedules);
    await saveWorkSchedules(schedules);
  };

  const handleActivitiesChange = async (acts: Activity[]) => {
    setActivities(acts);
    await saveActivities(acts);
  };

  const handleRoutineMomentsChange = async (moments: RoutineMoment[]) => {
    setRoutineMoments(moments);
    await saveRoutineMoments(moments);
  };

  const handleWakeUpTimeChange = async (time: string) => {
    setWakeUpTime(time);
    await saveProfile();
  };

  const handleNoStudyAfterChange = async (time: string) => {
    setNoStudyAfter(time);
    await saveProfile();
  };

  const handleSleepHoursChange = async (hours: number) => {
    setSleepHoursNeeded(hours);
    await saveProfile();
  };

  const handleMinPersonalTimeChange = async (hours: number) => {
    setMinPersonalTimePerWeek(hours);
    await saveProfile();
  };

  const handleCommuteHomeSchoolChange = async (minutes: number) => {
    setCommuteHomeSchool(minutes);
    await saveProfile();
  };

  const handleCommuteHomeJobChange = async (minutes: number) => {
    setCommuteHomeJob(minutes);
    await saveProfile();
  };

  const handleCommuteHomeActivityChange = async (minutes: number) => {
    setCommuteHomeActivity(minutes);
    await saveProfile();
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 pt-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Mes contraintes</h1>
          <p className="text-sm text-muted-foreground">Dis-nous comment tu vis. On protège ton temps, l'IA fait le reste.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex justify-center gap-2 overflow-x-auto pb-2">
          {[
            { key: 'travail', label: 'Travail' },
            { key: 'activite', label: 'Activité' },
            { key: 'routine', label: 'Routine' },
            { key: 'trajet', label: 'Trajet' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                const tabKey = tab.key as 'travail' | 'activite' | 'routine' | 'trajet';
                setActiveTab(tabKey);
                setConstraintsTab(tabKey);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'travail' && (
          <WorkTab
            workSchedules={workSchedules}
            onWorkSchedulesChange={handleWorkSchedulesChange}
          />
        )}

        {activeTab === 'activite' && (
          <ActivityTab activities={activities} onActivitiesChange={handleActivitiesChange} />
        )}

        {activeTab === 'routine' && (
          <RoutineTab
            wakeUpTime={wakeUpTime}
            noStudyAfter={noStudyAfter}
            sleepHoursNeeded={sleepHoursNeeded}
            minPersonalTimePerWeek={minPersonalTimePerWeek}
            routineMoments={routineMoments}
            onWakeUpTimeChange={handleWakeUpTimeChange}
            onNoStudyAfterChange={handleNoStudyAfterChange}
            onSleepHoursNeededChange={handleSleepHoursChange}
            onMinPersonalTimePerWeekChange={handleMinPersonalTimeChange}
            onRoutineMomentsChange={handleRoutineMomentsChange}
          />
        )}

        {activeTab === 'trajet' && (
          <CommuteTab
            commuteHomeSchool={commuteHomeSchool}
            commuteHomeJob={commuteHomeJob}
            commuteHomeActivity={commuteHomeActivity}
            hasAlternance={workSchedules.some(s => s.type === 'alternance')}
            hasJob={workSchedules.some(s => s.type === 'job')}
            hasActivities={activities.length > 0}
            onCommuteHomeSchoolChange={handleCommuteHomeSchoolChange}
            onCommuteHomeJobChange={handleCommuteHomeJobChange}
            onCommuteHomeActivityChange={handleCommuteHomeActivityChange}
          />
        )}
      </div>
    </div>
  );
};

export default Constraints;
