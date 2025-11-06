import { useState, useEffect } from "react";
import { Plus, Trash2, Save, User, Briefcase, MapPin, Zap, Clock, Utensils } from "lucide-react";
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
    <div className="min-h-[100dvh] flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Mes contraintes</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure tes préférences et disponibilités</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-[88px] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="px-4 pt-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Statut & rythme de vie */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Statut & rythme de vie</CardTitle>
                  <CardDescription className="text-xs">Définis ton profil étudiant</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label htmlFor="alternant" className="cursor-pointer">Alternant ?</Label>
                <Switch
                  id="alternant"
                  checked={profile.is_alternant}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, is_alternant: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label htmlFor="job" className="cursor-pointer">Job étudiant ?</Label>
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

          {/* Contraintes fixes */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Contraintes fixes</CardTitle>
                  <CardDescription className="text-xs">
                    Ces créneaux seront bloqués dans ton planning
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {constraintEvents.map((event, index) => (
                <div key={index} className="p-3 border border-border/50 rounded-lg space-y-3 bg-card">
                  <div className="flex justify-between items-center gap-2">
                    <Select
                      value={event.type}
                      onValueChange={(value: any) =>
                        updateConstraintEvent(index, 'type', value)
                      }
                    >
                      <SelectTrigger className="flex-1">
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
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Titre (ex: Cours de sport)"
                    value={event.title}
                    onChange={(e) =>
                      updateConstraintEvent(index, 'title', e.target.value)
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Début</Label>
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
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fin</Label>
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
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addConstraintEvent} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une contrainte
              </Button>
            </CardContent>
          </Card>

          {/* Trajets */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Temps de trajet</CardTitle>
                  <CardDescription className="text-xs">En minutes (aller simple)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Domicile ↔ École</Label>
                <Input
                  type="number"
                  value={profile.commute_home_school}
                  onChange={(e) =>
                    setProfile({ ...profile, commute_home_school: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
              {profile.has_student_job && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Domicile ↔ Job</Label>
                  <Input
                    type="number"
                    value={profile.commute_home_job}
                    onChange={(e) =>
                      setProfile({ ...profile, commute_home_job: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm">Domicile ↔ Sport</Label>
                <Input
                  type="number"
                  value={profile.commute_home_sport}
                  onChange={(e) =>
                    setProfile({ ...profile, commute_home_sport: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Productivité */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Moments de productivité</CardTitle>
                  <CardDescription className="text-xs">Quand es-tu le plus efficace ?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.preferred_productivity}
                onValueChange={(value) =>
                  setProfile({ ...profile, preferred_productivity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Matin (7h-12h)</SelectItem>
                  <SelectItem value="afternoon">Après-midi (12h-18h)</SelectItem>
                  <SelectItem value="evening">Soir (18h-22h)</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Limites */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Limites & plafonds</CardTitle>
                  <CardDescription className="text-xs">Protège ton bien-être</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm">Heures de révision max / jour : {profile.max_daily_revision_hours}h</Label>
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
              <div className="space-y-2">
                <Label className="text-sm">Heures de révision max / semaine : {profile.max_weekly_revision_hours}h</Label>
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pas avant</Label>
                  <Input
                    type="time"
                    value={profile.no_study_before}
                    onChange={(e) =>
                      setProfile({ ...profile, no_study_before: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pas après</Label>
                  <Input
                    type="time"
                    value={profile.no_study_after}
                    onChange={(e) =>
                      setProfile({ ...profile, no_study_after: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jours sans révision</Label>
                <div className="grid grid-cols-2 gap-2.5">
                  {days.map((day) => (
                    <div key={day} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={day}
                        checked={profile.no_study_days.includes(day)}
                        onCheckedChange={() => toggleNoStudyDay(day)}
                      />
                      <label htmlFor={day} className="text-sm capitalize cursor-pointer flex-1">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rituels */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Rituels & zones de confort</CardTitle>
                  <CardDescription className="text-xs">Préserve tes habitudes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label className="cursor-pointer">Respecter les heures de repas</Label>
                <Switch
                  checked={profile.respect_meal_times}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, respect_meal_times: checked })
                  }
                />
              </div>
              {profile.respect_meal_times && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Déjeuner début</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_start}
                        onChange={(e) =>
                          setProfile({ ...profile, lunch_break_start: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Déjeuner fin</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_end}
                        onChange={(e) =>
                          setProfile({ ...profile, lunch_break_end: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Dîner début</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_start}
                        onChange={(e) =>
                          setProfile({ ...profile, dinner_break_start: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Dîner fin</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_end}
                        onChange={(e) =>
                          setProfile({ ...profile, dinner_break_end: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2 pt-1">
                <Label className="text-sm">Soirées libres min / semaine : {profile.min_free_evenings_per_week}</Label>
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
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={loading} className="w-full sticky bottom-4" size="lg">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer mes contraintes"}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Constraints;
