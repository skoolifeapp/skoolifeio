import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Work data
  const [hasAlternance, setHasAlternance] = useState(false);
  const [hasJob, setHasJob] = useState(false);
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

  // Auto-save when data changes
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [workSchedules, activities, routineMoments, wakeUpTime, noStudyAfter, sleepHoursNeeded, minPersonalTimePerWeek, commuteHomeSchool, commuteHomeJob, commuteHomeActivity]);

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
      setHasAlternance(profileData.is_alternant || false);
      setHasJob(profileData.has_student_job || false);
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

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      // Save profile
      const { error: profileError } = await supabase
        .from('user_constraints_profile')
        .upsert({
          user_id: user.id,
          is_alternant: hasAlternance,
          has_student_job: hasJob,
          wake_up_time: wakeUpTime,
          no_study_after: noStudyAfter,
          sleep_hours_needed: sleepHoursNeeded,
          min_personal_time_per_week: minPersonalTimePerWeek,
          commute_home_school: commuteHomeSchool,
          commute_home_job: commuteHomeJob,
          commute_home_activity: commuteHomeActivity,
        });

      if (profileError) throw profileError;

      // Save work schedules
      await supabase.from('work_schedules').delete().eq('user_id', user.id);
      if (workSchedules.length > 0) {
        const { error } = await supabase.from('work_schedules').insert(
          workSchedules.map(s => ({ ...s, user_id: user.id, id: undefined }))
        );
        if (error) throw error;
      }

      // Save activities
      await supabase.from('activities').delete().eq('user_id', user.id);
      if (activities.length > 0) {
        const { error } = await supabase.from('activities').insert(
          activities.map(a => ({ ...a, user_id: user.id, id: undefined }))
        );
        if (error) throw error;
      }

      // Save routine moments
      await supabase.from('routine_moments').delete().eq('user_id', user.id);
      if (routineMoments.length > 0) {
        const { error } = await supabase.from('routine_moments').insert(
          routineMoments.map(m => ({ ...m, user_id: user.id, id: undefined }))
        );
        if (error) throw error;
      }

      console.log("Contraintes sauvegardées automatiquement");
    } catch (error) {
      console.error('Error saving constraints:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 pt-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mes contraintes</h1>
            <p className="text-sm text-muted-foreground">Dis-nous comment tu vis. On protège ton temps, l'IA fait le reste.</p>
          </div>
          <Button 
            onClick={() => {
              handleSave();
              toast.success("Contraintes enregistrées");
            }} 
            size="icon" 
            className="rounded-full shadow-lg"
            disabled={isSaving}
          >
            <Save className="h-5 w-5" />
          </Button>
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
            onWorkSchedulesChange={setWorkSchedules}
          />
        )}

        {activeTab === 'activite' && (
          <ActivityTab activities={activities} onActivitiesChange={setActivities} />
        )}

        {activeTab === 'routine' && (
          <RoutineTab
            wakeUpTime={wakeUpTime}
            noStudyAfter={noStudyAfter}
            sleepHoursNeeded={sleepHoursNeeded}
            minPersonalTimePerWeek={minPersonalTimePerWeek}
            routineMoments={routineMoments}
            onWakeUpTimeChange={setWakeUpTime}
            onNoStudyAfterChange={setNoStudyAfter}
            onSleepHoursNeededChange={setSleepHoursNeeded}
            onMinPersonalTimePerWeekChange={setMinPersonalTimePerWeek}
            onRoutineMomentsChange={setRoutineMoments}
          />
        )}

        {activeTab === 'trajet' && (
          <CommuteTab
            commuteHomeSchool={commuteHomeSchool}
            commuteHomeJob={commuteHomeJob}
            commuteHomeActivity={commuteHomeActivity}
            hasAlternance={hasAlternance}
            hasJob={hasJob}
            hasActivities={activities.length > 0}
            onCommuteHomeSchoolChange={setCommuteHomeSchool}
            onCommuteHomeJobChange={setCommuteHomeJob}
            onCommuteHomeActivityChange={setCommuteHomeActivity}
          />
        )}
      </div>
    </div>
  );
};

export default Constraints;
