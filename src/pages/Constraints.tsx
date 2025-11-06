import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConstraintEvent {
  id?: string;
  type: 'alternance' | 'job' | 'sport' | 'rdv' | 'exception';
  title: string;
  start_time: string;
  end_time: string;
  recurrence_rule?: string;
}

interface UserProfile {
  is_alternant: boolean;
  has_student_job: boolean;
  commute_home_school: number;
  commute_home_job: number;
  commute_home_sport: number;
  preferred_productivity: string;
  max_daily_revision_hours: number;
  max_weekly_revision_hours: number;
  no_study_days: string[];
  no_study_after: string;
  no_study_before: string;
  lunch_break_start: string;
  lunch_break_end: string;
  dinner_break_start: string;
  dinner_break_end: string;
  respect_meal_times: boolean;
  min_free_evenings_per_week: number;
}

const Constraints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [constraintEvents, setConstraintEvents] = useState<ConstraintEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    is_alternant: false,
    has_student_job: false,
    commute_home_school: 0,
    commute_home_job: 0,
    commute_home_sport: 0,
    preferred_productivity: 'mixed',
    max_daily_revision_hours: 8,
    max_weekly_revision_hours: 40,
    no_study_days: [],
    no_study_after: '22:00',
    no_study_before: '08:00',
    lunch_break_start: '12:00',
    lunch_break_end: '14:00',
    dinner_break_start: '19:00',
    dinner_break_end: '20:30',
    respect_meal_times: true,
    min_free_evenings_per_week: 1,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [eventsRes, profileRes] = await Promise.all([
      supabase.from('constraint_events').select('*').eq('user_id', user.id),
      supabase.from('user_constraints_profile').select('*').eq('user_id', user.id).single(),
    ]);

    if (eventsRes.data) {
      setConstraintEvents(eventsRes.data as any);
    }

    if (profileRes.data) {
      setProfile(profileRes.data as UserProfile);
    }
  };

  const addConstraintEvent = () => {
    setConstraintEvents([
      ...constraintEvents,
      {
        type: 'alternance',
        title: '',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      },
    ]);
  };

  const updateConstraintEvent = (index: number, field: keyof ConstraintEvent, value: any) => {
    const updated = [...constraintEvents];
    updated[index] = { ...updated[index], [field]: value };
    setConstraintEvents(updated);
  };

  const removeConstraintEvent = (index: number) => {
    setConstraintEvents(constraintEvents.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Delete all existing constraint events
      await supabase.from('constraint_events').delete().eq('user_id', user.id);

      // Insert new constraint events
      if (constraintEvents.length > 0) {
        const eventsToInsert = constraintEvents.map(e => ({
          user_id: user.id,
          type: e.type,
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          recurrence_rule: e.recurrence_rule,
        }));

        const { error: eventsError } = await supabase
          .from('constraint_events')
          .insert(eventsToInsert);

        if (eventsError) throw eventsError;
      }

      // Upsert profile
      const { error: profileError } = await supabase
        .from('user_constraints_profile')
        .upsert({
          user_id: user.id,
          ...profile,
        });

      if (profileError) throw profileError;
    } catch (error) {
      console.error('Error saving constraints:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const toggleNoStudyDay = (day: string) => {
    if (profile.no_study_days.includes(day)) {
      setProfile({
        ...profile,
        no_study_days: profile.no_study_days.filter(d => d !== day),
      });
    } else {
      setProfile({
        ...profile,
        no_study_days: [...profile.no_study_days, day],
      });
    }
  };

  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  return (
    <div className="min-h-screen bg-[#FCFCFC] pb-24">
      <div className="sticky top-0 z-10 bg-[#FCFCFC] px-5 pt-6 pb-4 border-b">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mes contraintes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure ton profil de vie. Skoolife IA utilisera ces informations
          pour placer tes révisions intelligemment dans ton planning.
        </p>
      </div>

      <div className="px-5 mt-4 space-y-4 overflow-y-auto pb-24">
        {/* Étape 1 : Statut & rythme */}
        <Card className="border-none rounded-2xl bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-bold text-black">
                1
              </span>
              Statut & rythme de vie
            </CardTitle>
            <CardDescription>
              Dis-nous comment tu jongles entre études, alternance et job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="alternant">Alternant ?</Label>
              <Switch
                id="alternant"
                checked={profile.is_alternant}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, is_alternant: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="job">Job étudiant ?</Label>
              <Switch
                id="job"
                checked={profile.has_student_job}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, has_student_job: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Étape 2 : Contraintes fixes */}
        <Card className="border-none rounded-2xl bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-bold text-black">
                2
              </span>
              Contraintes fixes (bloquées au planning)
            </CardTitle>
            <CardDescription>
              Alternance, job, sport, rendez-vous réguliers : ces créneaux seront
              affichés comme indisponibles dans ton planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {constraintEvents.map((event, index) => (
              <div key={index} className="p-3 border rounded-xl space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <Select
                    value={event.type}
                    onValueChange={(value: any) =>
                      updateConstraintEvent(index, 'type', value)
                    }
                  >
                    <SelectTrigger className="w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alternance">Alternance</SelectItem>
                      <SelectItem value="job">Job étudiant</SelectItem>
                      <SelectItem value="sport">Sport</SelectItem>
                      <SelectItem value="rdv">Rendez-vous</SelectItem>
                      <SelectItem value="exception">Exception</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConstraintEvent(index)}
                    className="hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <Input
                  placeholder="Titre (ex: Cours de sport)"
                  value={event.title}
                  onChange={(e) =>
                    updateConstraintEvent(index, 'title', e.target.value)
                  }
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Début</Label>
                    <Input
                      type="datetime-local"
                      value={event.start_time.slice(0, 16)}
                      onChange={(e) =>
                        updateConstraintEvent(
                          index,
                          'start_time',
                          new Date(e.target.value).toISOString()
                        )
                      }
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="datetime-local"
                      value={event.end_time.slice(0, 16)}
                      onChange={(e) =>
                        updateConstraintEvent(
                          index,
                          'end_time',
                          new Date(e.target.value).toISOString()
                        )
                      }
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              onClick={addConstraintEvent} 
              variant="outline" 
              className="w-full rounded-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une contrainte
            </Button>
          </CardContent>
        </Card>

        {/* Étape 3 : Profil IA */}
        <Card className="border-none rounded-2xl bg-[#111827] text-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-bold text-black">
                3
              </span>
              Profil IA Skoolife
            </CardTitle>
            <CardDescription className="text-xs text-gray-300">
              Ces paramètres ne s'affichent pas dans ton planning, mais guident
              l'algorithme pour adapter tes sessions de révision à ta vraie vie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trajets */}
            <div className="space-y-3">
              <Label className="text-sm text-gray-200">🚗 Temps de trajet (min)</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-300">Domicile ↔ École</Label>
                  <Input
                    type="number"
                    value={profile.commute_home_school}
                    onChange={(e) =>
                      setProfile({ ...profile, commute_home_school: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                {profile.has_student_job && (
                  <div>
                    <Label className="text-xs text-gray-300">Domicile ↔ Job</Label>
                    <Input
                      type="number"
                      value={profile.commute_home_job}
                      onChange={(e) =>
                        setProfile({ ...profile, commute_home_job: parseInt(e.target.value) || 0 })
                      }
                      className="mt-1 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-300">Domicile ↔ Sport</Label>
                  <Input
                    type="number"
                    value={profile.commute_home_sport}
                    onChange={(e) =>
                      setProfile({ ...profile, commute_home_sport: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Productivité */}
            <div>
              <Label className="text-sm text-gray-200">⚡ Moments de productivité</Label>
              <Select
                value={profile.preferred_productivity}
                onValueChange={(value) =>
                  setProfile({ ...profile, preferred_productivity: value })
                }
              >
                <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Matin (7h-12h)</SelectItem>
                  <SelectItem value="afternoon">Après-midi (12h-18h)</SelectItem>
                  <SelectItem value="evening">Soir (18h-22h)</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limites */}
            <div className="space-y-3">
              <Label className="text-sm text-gray-200">⏱️ Limites & plafonds</Label>
              <div>
                <Label className="text-xs text-gray-300">
                  Heures de révision max / jour : {profile.max_daily_revision_hours}h
                </Label>
                <Slider
                  value={[profile.max_daily_revision_hours]}
                  onValueChange={([value]) =>
                    setProfile({ ...profile, max_daily_revision_hours: value })
                  }
                  min={1}
                  max={12}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300">
                  Heures de révision max / semaine : {profile.max_weekly_revision_hours}h
                </Label>
                <Slider
                  value={[profile.max_weekly_revision_hours]}
                  onValueChange={([value]) =>
                    setProfile({ ...profile, max_weekly_revision_hours: value })
                  }
                  min={5}
                  max={60}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-300">Pas avant</Label>
                  <Input
                    type="time"
                    value={profile.no_study_before}
                    onChange={(e) =>
                      setProfile({ ...profile, no_study_before: e.target.value })
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-300">Pas après</Label>
                  <Input
                    type="time"
                    value={profile.no_study_after}
                    onChange={(e) =>
                      setProfile({ ...profile, no_study_after: e.target.value })
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-2 block">Jours sans révision</Label>
                <div className="grid grid-cols-2 gap-2">
                  {days.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={profile.no_study_days.includes(day)}
                        onCheckedChange={() => toggleNoStudyDay(day)}
                        className="border-white/30"
                      />
                      <label htmlFor={day} className="text-xs capitalize cursor-pointer text-gray-300">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rituels */}
            <div className="space-y-3">
              <Label className="text-sm text-gray-200">🍽️ Rituels & zones de confort</Label>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-300">Respecter les heures de repas</Label>
                <Switch
                  checked={profile.respect_meal_times}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, respect_meal_times: checked })
                  }
                />
              </div>
              {profile.respect_meal_times && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-300">Déjeuner début</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_start}
                        onChange={(e) =>
                          setProfile({ ...profile, lunch_break_start: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-300">Déjeuner fin</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_end}
                        onChange={(e) =>
                          setProfile({ ...profile, lunch_break_end: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-300">Dîner début</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_start}
                        onChange={(e) =>
                          setProfile({ ...profile, dinner_break_start: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-300">Dîner fin</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_end}
                        onChange={(e) =>
                          setProfile({ ...profile, dinner_break_end: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs text-gray-300">
                  Soirées libres min / semaine : {profile.min_free_evenings_per_week}
                </Label>
                <Slider
                  value={[profile.min_free_evenings_per_week]}
                  onValueChange={([value]) =>
                    setProfile({ ...profile, min_free_evenings_per_week: value })
                  }
                  min={0}
                  max={7}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full mt-2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold shadow-md sticky bottom-20 z-10"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Enregistrement..." : "Enregistrer mes contraintes IA"}
        </Button>
      </div>
    </div>
  );
};

export default Constraints;