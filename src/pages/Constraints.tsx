import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'travail' | 'activite' | 'routine' | 'trajet'>('travail');
  
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

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Load profile
    const { data: profileData } = await supabase
      .from('user_constraints_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setWakeUpTime(profileData.wake_up_time || '07:00');
      setNoStudyAfter(profileData.no_study_after || '22:00');
      setSleepHoursNeeded(profileData.sleep_hours_needed || 8);
      setMinPersonalTimePerWeek(profileData.min_personal_time_per_week || 5);
      setCommuteHomeSchool(profileData.commute_home_school || 0);
      setCommuteHomeJob(profileData.commute_home_job || 0);
      setCommuteHomeActivity(profileData.commute_home_activity || 0);
    }

    // Load work schedules
    const { data: workData } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', user.id);
    if (workData) setWorkSchedules(workData as WorkSchedule[]);

    // Load activities
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id);
    if (activitiesData) setActivities(activitiesData as Activity[]);

    // Load routine moments
    const { data: routineData } = await supabase
      .from('routine_moments')
      .select('*')
      .eq('user_id', user.id);
    if (routineData) setRoutineMoments(routineData);

    setLoading(false);
  };

  const saveWorkSchedules = async (schedules: WorkSchedule[]) => {
    if (!user) return;
    try {
      // Delete existing schedules
      await supabase
        .from('work_schedules')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new schedules if any
      if (schedules.length > 0) {
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
            user_id: user.id,
          })));
        
        if (error) {
          console.error('Error inserting work schedules:', error);
          toast.error("Erreur lors de l'enregistrement du travail");
          return;
        }
      }
      
      toast.success("Contrainte de travail enregistrée");
      loadData();
    } catch (error) {
      console.error('Error saving work schedules:', error);
      toast.error("Erreur lors de l'enregistrement du travail");
    }
  };

  const saveActivities = async (acts: Activity[]) => {
    if (!user) return;
    try {
      await supabase
        .from('activities')
        .delete()
        .eq('user_id', user.id);
      
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
            user_id: user.id,
          })));
        
        if (error) {
          console.error('Error inserting activities:', error);
          toast.error("Erreur lors de l'enregistrement des activités");
          return;
        }
      }
      
      toast.success("Activité enregistrée");
      loadData();
    } catch (error) {
      console.error('Error saving activities:', error);
      toast.error("Erreur lors de l'enregistrement des activités");
    }
  };

  const saveRoutineMoments = async (moments: RoutineMoment[]) => {
    if (!user) return;
    try {
      await supabase
        .from('routine_moments')
        .delete()
        .eq('user_id', user.id);
      
      if (moments.length > 0) {
        const { error } = await supabase
          .from('routine_moments')
          .insert(moments.map(m => ({
            title: m.title,
            days: m.days,
            start_time: m.start_time,
            end_time: m.end_time,
            user_id: user.id,
          })));
        
        if (error) {
          console.error('Error inserting routine moments:', error);
          toast.error("Erreur lors de l'enregistrement de la routine");
          return;
        }
      }
      
      toast.success("Routine enregistrée");
      loadData();
    } catch (error) {
      console.error('Error saving routine moments:', error);
      toast.error("Erreur lors de l'enregistrement de la routine");
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      await supabase
        .from('user_constraints_profile')
        .upsert({
          user_id: user.id,
          wake_up_time: wakeUpTime,
          no_study_after: noStudyAfter,
          sleep_hours_needed: sleepHoursNeeded,
          min_personal_time_per_week: minPersonalTimePerWeek,
          commute_home_school: commuteHomeSchool,
          commute_home_job: commuteHomeJob,
          commute_home_activity: commuteHomeActivity,
        });
      console.log("Profile saved");
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
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
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
              onClick={() => setActiveTab(tab.key as any)}
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
