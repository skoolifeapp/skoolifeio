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
    workSchedules: dataWorkSchedules, 
    activities: dataActivities, 
    routineMoments: dataRoutineMoments,
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

  // Synchroniser les états locaux avec les données du DataContext
  useEffect(() => {
    if (dataWorkSchedules) {
      setWorkSchedules(dataWorkSchedules);
    }
  }, [dataWorkSchedules]);

  useEffect(() => {
    if (dataActivities) {
      setActivities(dataActivities);
    }
  }, [dataActivities]);

  useEffect(() => {
    if (dataRoutineMoments) {
      setRoutineMoments(dataRoutineMoments);
    }
  }, [dataRoutineMoments]);

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
      const { error: deleteError } = await supabase
        .from('work_schedules')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (deleteError) {
        console.error('Error deleting work schedules:', deleteError);
        toast.error("Erreur lors de l'enregistrement du travail");
        return;
      }
      
      // Insert new schedules if any
      if (schedules.length > 0) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;
        
        const { error } = await supabase
          .from('work_schedules')
          .insert(schedules.map(s => ({
            type: s.type,
            title: s.title,
            days: s.days,
            start_time: s.start_time,
            end_time: s.end_time,
            location: s.location || null,
            frequency: s.frequency,
            hours_per_week: s.hours_per_week,
            user_id: userId,
          })));
        
        if (error) {
          console.error('Error inserting work schedules:', error);
          toast.error("Erreur lors de l'enregistrement du travail");
          return;
        }
      }
      
      // Recharger les données depuis Supabase
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
      
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting activities:', deleteError);
        toast.error("Erreur lors de l'enregistrement des activités");
        return;
      }
      
      if (acts.length > 0) {
        const { error } = await supabase
          .from('activities')
          .insert(acts.map(a => ({
            type: a.type,
            title: a.title,
            days: a.days,
            start_time: a.start_time,
            end_time: a.end_time,
            location: a.location || null,
            user_id: userId,
          })));
        
        if (error) {
          console.error('Error inserting activities:', error);
          toast.error("Erreur lors de l'enregistrement des activités");
          return;
        }
      }
      
      // Recharger les données depuis Supabase
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
      
      const { error: deleteError } = await supabase
        .from('routine_moments')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting routine moments:', deleteError);
        toast.error("Erreur lors de l'enregistrement de la routine");
        return;
      }
      
      if (moments.length > 0) {
        const { error } = await supabase
          .from('routine_moments')
          .insert(moments.map(m => ({
            title: m.title,
            days: m.days,
            start_time: m.start_time,
            end_time: m.end_time,
            user_id: userId,
          })));
        
        if (error) {
          console.error('Error inserting routine moments:', error);
          toast.error("Erreur lors de l'enregistrement de la routine");
          return;
        }
      }
      
      // Recharger les données depuis Supabase
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
      
      // Recharger les données depuis Supabase
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
      <div className="max-w-6xl mx-auto space-y-6">
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
