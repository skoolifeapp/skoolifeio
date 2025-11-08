import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  recurrence_rule: string;
}

interface UserProfile {
  is_alternant?: boolean;
  has_student_job?: boolean;
  commute_home_school?: number;
  commute_home_job?: number;
  commute_home_sport?: number;
  preferred_productivity?: string;
  max_daily_revision_hours?: number;
  max_weekly_revision_hours?: number;
  no_study_days?: string[];
  no_study_after?: string;
  no_study_before?: string;
  lunch_break_start?: string;
  lunch_break_end?: string;
  dinner_break_start?: string;
  dinner_break_end?: string;
  respect_meal_times?: boolean;
  min_free_evenings_per_week?: number;
}

const DAYS = [
  { key: 'lundi', label: 'LUN' },
  { key: 'mardi', label: 'MAR' },
  { key: 'mercredi', label: 'MER' },
  { key: 'jeudi', label: 'JEU' },
  { key: 'vendredi', label: 'VEN' },
  { key: 'samedi', label: 'SAM' },
  { key: 'dimanche', label: 'DIM' },
];

const Constraints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    is_alternant: false,
    has_student_job: false,
    commute_home_school: 0,
    commute_home_job: 0,
    commute_home_sport: 0,
    preferred_productivity: 'balanced',
    max_daily_revision_hours: 4,
    max_weekly_revision_hours: 25,
    no_study_days: [],
    no_study_after: '22:00',
    no_study_before: '08:00',
    lunch_break_start: '12:00',
    lunch_break_end: '14:00',
    dinner_break_start: '19:00',
    dinner_break_end: '20:30',
    respect_meal_times: true,
    min_free_evenings_per_week: 2,
  });
  const [events, setEvents] = useState<ConstraintEvent[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await supabase
      .from('user_constraints_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    const { data: eventsData } = await supabase
      .from('constraint_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (eventsData) {
      setEvents(eventsData);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error: profileError } = await supabase
        .from('user_constraints_profile')
        .upsert({
          user_id: user.id,
          ...profile,
        });

      if (profileError) throw profileError;

      await supabase
        .from('constraint_events')
        .delete()
        .eq('user_id', user.id);

      if (events.length > 0) {
        const eventsToInsert = events.map(e => ({
          user_id: user.id,
          type: e.type as 'alternance' | 'job' | 'sport' | 'rdv' | 'exception',
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

      loadData();
    } catch (error) {
      console.error('Error saving constraints:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const addEvent = () => {
    setEvents([
      ...events,
      {
        type: 'job',
        title: '',
        start_time: '09:00',
        end_time: '17:00',
        recurrence_rule: 'MO,TU,WE,TH,FR',
      },
    ]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof ConstraintEvent, value: any) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setEvents(newEvents);
  };

  const toggleNoStudyDay = (day: string) => {
    const current = profile.no_study_days || [];
    if (current.includes(day)) {
      setProfile({ ...profile, no_study_days: current.filter(d => d !== day) });
    } else {
      setProfile({ ...profile, no_study_days: [...current, day] });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
      {/* Header Sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 pt-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mes contraintes</h1>
            <p className="text-sm text-muted-foreground">Dis-nous comment tu vis. On protège ton temps, l'IA fait le reste.</p>
          </div>
          <Button
            onClick={handleSave}
            size="icon"
            className="rounded-full shadow-lg"
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Bloc 1 – Profil & rythme */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Profil & rythme</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Alternance (école + entreprise)</Label>
                    <p className="text-xs text-muted-foreground">Tu alternes entre l'école et l'entreprise</p>
                  </div>
                  <Switch
                    checked={profile.is_alternant}
                    onCheckedChange={(checked) => setProfile({ ...profile, is_alternant: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Job étudiant</Label>
                    <p className="text-xs text-muted-foreground">Tu as un job en parallèle de tes études</p>
                  </div>
                  <Switch
                    checked={profile.has_student_job}
                    onCheckedChange={(checked) => setProfile({ ...profile, has_student_job: checked })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">Trajet maison → école (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={profile.commute_home_school}
                      onChange={(e) => setProfile({ ...profile, commute_home_school: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Trajet maison → job (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={profile.commute_home_job}
                      onChange={(e) => setProfile({ ...profile, commute_home_job: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Trajet maison → sport (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={profile.commute_home_sport}
                      onChange={(e) => setProfile({ ...profile, commute_home_sport: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Moment de productivité préféré</Label>
                  <div className="flex gap-2">
                    {[
                      { key: 'morning', label: 'Matin' },
                      { key: 'evening', label: 'Soir' },
                      { key: 'balanced', label: 'Équilibré' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setProfile({ ...profile, preferred_productivity: option.key })}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          profile.preferred_productivity === option.key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Révisions max par jour : {profile.max_daily_revision_hours}h</Label>
                  <Slider
                    value={[profile.max_daily_revision_hours || 4]}
                    onValueChange={([value]) => setProfile({ ...profile, max_daily_revision_hours: value })}
                    min={1}
                    max={8}
                    step={0.5}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    L'IA ne planifiera jamais plus de {profile.max_daily_revision_hours}h de révisions par jour.
                  </p>
                </div>

                <div>
                  <Label className="text-base">Révisions max par semaine : {profile.max_weekly_revision_hours}h</Label>
                  <Slider
                    value={[profile.max_weekly_revision_hours || 25]}
                    onValueChange={([value]) => setProfile({ ...profile, max_weekly_revision_hours: value })}
                    min={5}
                    max={60}
                    step={1}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Limite hebdomadaire pour éviter le burn-out.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 2 – Jours & plages protégées */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Jours & plages protégées</h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block">Jours sans révisions</Label>
                  <div className="flex gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.key}
                        onClick={() => toggleNoStudyDay(day.key)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          profile.no_study_days?.includes(day.key)
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ces jours seront totalement libres de révisions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Pas avant</Label>
                    <Input
                      type="time"
                      value={profile.no_study_before}
                      onChange={(e) => setProfile({ ...profile, no_study_before: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Pas après</Label>
                    <Input
                      type="time"
                      value={profile.no_study_after}
                      onChange={(e) => setProfile({ ...profile, no_study_after: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Plages repas</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Pause déj début</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_start}
                        onChange={(e) => setProfile({ ...profile, lunch_break_start: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Pause déj fin</Label>
                      <Input
                        type="time"
                        value={profile.lunch_break_end}
                        onChange={(e) => setProfile({ ...profile, lunch_break_end: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Dîner début</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_start}
                        onChange={(e) => setProfile({ ...profile, dinner_break_start: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Dîner fin</Label>
                      <Input
                        type="time"
                        value={profile.dinner_break_end}
                        onChange={(e) => setProfile({ ...profile, dinner_break_end: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="respect_meals"
                    checked={profile.respect_meal_times}
                    onCheckedChange={(checked) => setProfile({ ...profile, respect_meal_times: !!checked })}
                  />
                  <Label htmlFor="respect_meals" className="text-sm cursor-pointer">
                    Ne jamais planifier de révisions pendant les repas définis ci-dessus
                  </Label>
                </div>

                <div>
                  <Label className="text-base">Soirées libres par semaine : {profile.min_free_evenings_per_week}</Label>
                  <Slider
                    value={[profile.min_free_evenings_per_week || 2]}
                    onValueChange={([value]) => setProfile({ ...profile, min_free_evenings_per_week: value })}
                    min={0}
                    max={7}
                    step={1}
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    L'IA gardera au moins {profile.min_free_evenings_per_week} soirée(s) sans révisions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 3 – Créneaux fixes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Créneaux fixes</h2>
              <Button onClick={addEvent} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun créneau fixe. Ajoute tes cours, job, sport, etc.
                </p>
              ) : (
                events.map((event, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Type</Label>
                            <Select
                              value={event.type}
                              onValueChange={(value: any) => updateEvent(index, 'type', value)}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alternance">Alternance</SelectItem>
                                <SelectItem value="job">Job</SelectItem>
                                <SelectItem value="sport">Sport</SelectItem>
                                <SelectItem value="rdv">Rendez-vous</SelectItem>
                                <SelectItem value="exception">Exception</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Récurrence</Label>
                            <Select
                              value={event.recurrence_rule}
                              onValueChange={(value) => updateEvent(index, 'recurrence_rule', value)}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MO,TU,WE,TH,FR">Lun–Ven</SelectItem>
                                <SelectItem value="SA,SU">Week-end</SelectItem>
                                <SelectItem value="MO,WE,FR">Lun/Mer/Ven</SelectItem>
                                <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Titre</Label>
                          <Input
                            value={event.title}
                            onChange={(e) => updateEvent(index, 'title', e.target.value)}
                            placeholder="Ex: Cours de marketing, Entraînement foot..."
                            className="mt-1.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Début</Label>
                            <Input
                              type="time"
                              value={event.start_time}
                              onChange={(e) => updateEvent(index, 'start_time', e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Fin</Label>
                            <Input
                              type="time"
                              value={event.end_time}
                              onChange={(e) => updateEvent(index, 'end_time', e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={() => removeEvent(index)}
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer ce créneau
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Constraints;
