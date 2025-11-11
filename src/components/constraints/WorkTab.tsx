import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DAYS = [
  { key: 'lundi', label: 'L' },
  { key: 'mardi', label: 'M' },
  { key: 'mercredi', label: 'M' },
  { key: 'jeudi', label: 'J' },
  { key: 'vendredi', label: 'V' },
  { key: 'samedi', label: 'S' },
  { key: 'dimanche', label: 'D' },
];

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

interface WorkTabProps {
  workSchedules: WorkSchedule[];
  onWorkSchedulesChange: (schedules: WorkSchedule[]) => void;
}

export const WorkTab = ({
  workSchedules,
  onWorkSchedulesChange,
}: WorkTabProps) => {
  const [isAlternanceDialogOpen, setIsAlternanceDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isOtherDialogOpen, setIsOtherDialogOpen] = useState(false);
  
  const [isAlternanceOpen, setIsAlternanceOpen] = useState(false);
  const [isJobOpen, setIsJobOpen] = useState(false);
  const [isOtherOpen, setIsOtherOpen] = useState(false);

  const [newAlternance, setNewAlternance] = useState<Partial<WorkSchedule>>({
    title: '',
    days: [],
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    frequency: 'weekly',
    alternance_rhythm: '1sem_1sem',
    start_date: '',
    company_name: '',
  });

  const [newJob, setNewJob] = useState<Partial<WorkSchedule>>({
    title: '',
    days: [],
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    hours_per_week: 0,
  });

  const [newOther, setNewOther] = useState<Partial<WorkSchedule>>({
    title: '',
    days: [],
    start_time: '09:00',
    end_time: '17:00',
  });
  const alternanceSchedules = workSchedules.filter(s => s.type === 'alternance');
  const jobSchedules = workSchedules.filter(s => s.type === 'job');
  const otherSchedules = workSchedules.filter(s => s.type === 'other');

  const addAlternance = async () => {
    if (!newAlternance.title?.trim()) {
      return; // Ne pas ajouter si pas de titre
    }
    const schedule: WorkSchedule = {
      type: 'alternance',
      title: newAlternance.title,
      days: newAlternance.days || [],
      start_time: newAlternance.start_time || '09:00',
      end_time: newAlternance.end_time || '17:00',
      location: newAlternance.location,
      frequency: newAlternance.frequency || 'weekly',
      alternance_rhythm: newAlternance.alternance_rhythm || '1sem_1sem',
      start_date: newAlternance.start_date,
      company_name: newAlternance.company_name,
    };
    onWorkSchedulesChange([...workSchedules, schedule]);
    setIsAlternanceDialogOpen(false);
    setNewAlternance({ title: '', days: [], start_time: '09:00', end_time: '17:00', location: '', frequency: 'weekly', alternance_rhythm: '1sem_1sem', start_date: '', company_name: '' });
  };

  const addJob = async () => {
    if (!newJob.title?.trim()) {
      return; // Ne pas ajouter si pas de titre
    }
    const schedule: WorkSchedule = {
      type: 'job',
      title: newJob.title,
      days: newJob.days || [],
      start_time: newJob.start_time || '09:00',
      end_time: newJob.end_time || '17:00',
      location: newJob.location,
      hours_per_week: newJob.hours_per_week || 0,
    };
    onWorkSchedulesChange([...workSchedules, schedule]);
    setIsJobDialogOpen(false);
    setNewJob({ title: '', days: [], start_time: '09:00', end_time: '17:00', location: '', hours_per_week: 0 });
  };

  const addOther = async () => {
    const schedule: WorkSchedule = {
      type: 'other',
      title: newOther.title,
      days: newOther.days || [],
      start_time: newOther.start_time || '09:00',
      end_time: newOther.end_time || '17:00',
    };
    onWorkSchedulesChange([...workSchedules, schedule]);
    setIsOtherDialogOpen(false);
    setNewOther({ title: '', days: [], start_time: '09:00', end_time: '17:00' });
  };

  const updateSchedule = (index: number, updates: Partial<WorkSchedule>) => {
    const newSchedules = [...workSchedules];
    newSchedules[index] = { ...newSchedules[index], ...updates };
    onWorkSchedulesChange(newSchedules);
  };

  const removeSchedule = (index: number) => {
    onWorkSchedulesChange(workSchedules.filter((_, i) => i !== index));
  };

  const toggleDay = (scheduleIndex: number, day: string) => {
    const schedule = workSchedules[scheduleIndex];
    const days = schedule.days.includes(day)
      ? schedule.days.filter(d => d !== day)
      : [...schedule.days, day];
    updateSchedule(scheduleIndex, { days });
  };

  const toggleNewDay = (type: 'alternance' | 'job' | 'other', day: string) => {
    if (type === 'alternance') {
      const days = newAlternance.days?.includes(day)
        ? newAlternance.days.filter(d => d !== day)
        : [...(newAlternance.days || []), day];
      setNewAlternance({ ...newAlternance, days });
    } else if (type === 'job') {
      const days = newJob.days?.includes(day)
        ? newJob.days.filter(d => d !== day)
        : [...(newJob.days || []), day];
      setNewJob({ ...newJob, days });
    } else {
      const days = newOther.days?.includes(day)
        ? newOther.days.filter(d => d !== day)
        : [...(newOther.days || []), day];
      setNewOther({ ...newOther, days });
    }
  };

  return (
    <>
    <div className="space-y-6">
      {/* Alternance */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isAlternanceOpen} onOpenChange={setIsAlternanceOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">As-tu une alternance ? ({alternanceSchedules.length})</Label>
                  <p className="text-xs text-muted-foreground">École + entreprise</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAlternanceDialogOpen(true);
                    }}
                    size="icon" 
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isAlternanceOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>

            {alternanceSchedules.length > 0 && (
              <CollapsibleContent className="space-y-4 pt-4 animate-accordion-down">
                {alternanceSchedules.map((schedule, idx) => {
                  const globalIdx = workSchedules.indexOf(schedule);
                  return (
                    <div key={globalIdx} className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Nom de l'alternance</Label>
                      <Input
                        value={schedule.title || ''}
                        onChange={(e) => updateSchedule(globalIdx, { title: e.target.value })}
                        placeholder="Nom de l'alternance"
                        className="mt-1.5"
                      />
                    </div>

                    {schedule.company_name && (
                      <div>
                        <Label className="text-sm">Entreprise</Label>
                        <Input
                          value={schedule.company_name || ''}
                          onChange={(e) => updateSchedule(globalIdx, { company_name: e.target.value })}
                          placeholder="Nom de l'entreprise"
                          className="mt-1.5"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm">Rythme d'alternance</Label>
                      <Select
                        value={schedule.alternance_rhythm || '1sem_1sem'}
                        onValueChange={(value: '2j_3j' | '3j_2j' | '1sem_1sem' | '1sem_2sem') => updateSchedule(globalIdx, { alternance_rhythm: value })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2j_3j">2j école / 3j entreprise</SelectItem>
                          <SelectItem value="3j_2j">3j école / 2j entreprise</SelectItem>
                          <SelectItem value="1sem_1sem">1 sem école / 1 sem entreprise</SelectItem>
                          <SelectItem value="1sem_2sem">1 sem école / 2 sem entreprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {schedule.start_date && (
                      <div>
                        <Label className="text-sm">Date de départ</Label>
                        <Input
                          type="date"
                          value={schedule.start_date || ''}
                          onChange={(e) => updateSchedule(globalIdx, { start_date: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm">Jours travaillés</Label>
                      <div className="flex gap-1 mt-2">
                        {DAYS.map((day) => (
                          <button
                            key={day.key}
                            onClick={() => toggleDay(globalIdx, day.key)}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              schedule.days.includes(day.key)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Début</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSchedule(globalIdx, { start_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fin</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSchedule(globalIdx, { end_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Lieu</Label>
                      <Input
                        value={schedule.location || ''}
                        onChange={(e) => updateSchedule(globalIdx, { location: e.target.value })}
                        placeholder="Ville ou 'télétravail'"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Fréquence</Label>
                      <Select
                        value={schedule.frequency || 'weekly'}
                        onValueChange={(value: 'weekly' | 'biweekly') => updateSchedule(globalIdx, { frequency: value })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Toutes les semaines</SelectItem>
                          <SelectItem value="biweekly">1 semaine sur 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => removeSchedule(globalIdx)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                );
              })}
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>

      {/* Job étudiant */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isJobOpen} onOpenChange={setIsJobOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">As-tu un job étudiant ? ({jobSchedules.length})</Label>
                  <p className="text-xs text-muted-foreground">En parallèle de tes études</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsJobDialogOpen(true);
                    }}
                    size="icon" 
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isJobOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>

            {jobSchedules.length > 0 && (
              <CollapsibleContent className="space-y-4 pt-4 animate-accordion-down">
                {jobSchedules.map((schedule, idx) => {
                  const globalIdx = workSchedules.indexOf(schedule);
                  return (
                    <div key={globalIdx} className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Nom du job</Label>
                      <Input
                        value={schedule.title || ''}
                        onChange={(e) => updateSchedule(globalIdx, { title: e.target.value })}
                        placeholder="Nom du job"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Jours</Label>
                      <div className="flex gap-1 mt-2">
                        {DAYS.map((day) => (
                          <button
                            key={day.key}
                            onClick={() => toggleDay(globalIdx, day.key)}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              schedule.days.includes(day.key)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Début</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSchedule(globalIdx, { start_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fin</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSchedule(globalIdx, { end_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Lieu</Label>
                      <Input
                        value={schedule.location || ''}
                        onChange={(e) => updateSchedule(globalIdx, { location: e.target.value })}
                        placeholder="Ville"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Heures moyennes / semaine</Label>
                      <Input
                        type="number"
                        min="0"
                        value={schedule.hours_per_week || 0}
                        onChange={(e) => updateSchedule(globalIdx, { hours_per_week: parseInt(e.target.value) || 0 })}
                        className="mt-1.5"
                      />
                    </div>

                    <Button
                      onClick={() => removeSchedule(globalIdx)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                );
              })}
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>

      {/* Autres engagements */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isOtherOpen} onOpenChange={setIsOtherOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">Autres engagements réguliers ({otherSchedules.length})</Label>
                  <p className="text-xs text-muted-foreground">Stage, mission, projet...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOtherDialogOpen(true);
                    }}
                    size="icon" 
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOtherOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>

            {otherSchedules.length > 0 && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                {otherSchedules.map((schedule, idx) => {
                  const globalIdx = workSchedules.indexOf(schedule);
                  return (
                    <div key={globalIdx} className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Nom</Label>
                      <Input
                        value={schedule.title || ''}
                        onChange={(e) => updateSchedule(globalIdx, { title: e.target.value })}
                        placeholder="Ex: Stage, mission..."
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Jours</Label>
                      <div className="flex gap-1 mt-2">
                        {DAYS.map((day) => (
                          <button
                            key={day.key}
                            onClick={() => toggleDay(globalIdx, day.key)}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              schedule.days.includes(day.key)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Début</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSchedule(globalIdx, { start_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Fin</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSchedule(globalIdx, { end_time: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => removeSchedule(globalIdx)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                );
              })}
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>
    </div>

      {/* Drawer Alternance */}
      <Drawer open={isAlternanceDialogOpen} onOpenChange={setIsAlternanceDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Ajouter une alternance</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div>
              <Label className="text-sm">Nom de l'alternance *</Label>
              <Input
                value={newAlternance.title || ''}
                onChange={(e) => setNewAlternance({ ...newAlternance, title: e.target.value })}
                placeholder="Ex: Alternance développeur chez Acme"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-sm">Jours travaillés</Label>
              <div className="flex gap-1 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleNewDay('alternance', day.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      newAlternance.days?.includes(day.key)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Début</Label>
                <Input
                  type="time"
                  value={newAlternance.start_time}
                  onChange={(e) => setNewAlternance({ ...newAlternance, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newAlternance.end_time}
                  onChange={(e) => setNewAlternance({ ...newAlternance, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Lieu</Label>
              <Input
                value={newAlternance.location || ''}
                onChange={(e) => setNewAlternance({ ...newAlternance, location: e.target.value })}
                placeholder="Ville ou 'télétravail'"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Rythme d'alternance</Label>
              <Select
                value={newAlternance.alternance_rhythm || '1sem_1sem'}
                onValueChange={(value: '2j_3j' | '3j_2j' | '1sem_1sem' | '1sem_2sem') => setNewAlternance({ ...newAlternance, alternance_rhythm: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2j_3j">2 jours école / 3 jours entreprise</SelectItem>
                  <SelectItem value="3j_2j">3 jours école / 2 jours entreprise</SelectItem>
                  <SelectItem value="1sem_1sem">1 semaine école / 1 semaine entreprise</SelectItem>
                  <SelectItem value="1sem_2sem">1 semaine école / 2 semaines entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Date de départ (optionnel)</Label>
                <Input
                  type="date"
                  value={newAlternance.start_date || ''}
                  onChange={(e) => setNewAlternance({ ...newAlternance, start_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Nom entreprise (optionnel)</Label>
                <Input
                  value={newAlternance.company_name || ''}
                  onChange={(e) => setNewAlternance({ ...newAlternance, company_name: e.target.value })}
                  placeholder="Ex: Acme Corp"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Fréquence</Label>
              <Select
                value={newAlternance.frequency || 'weekly'}
                onValueChange={(value: 'weekly' | 'biweekly') => setNewAlternance({ ...newAlternance, frequency: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Toutes les semaines</SelectItem>
                  <SelectItem value="biweekly">1 semaine sur 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={addAlternance} 
              className="w-full"
              disabled={!newAlternance.title?.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter l'alternance
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer Job */}
      <Drawer open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Ajouter un job étudiant</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div>
              <Label className="text-sm">Nom du job *</Label>
              <Input
                value={newJob.title || ''}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="Ex: Serveur chez McDo"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-sm">Jours</Label>
              <div className="flex gap-1 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleNewDay('job', day.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      newJob.days?.includes(day.key)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Début</Label>
                <Input
                  type="time"
                  value={newJob.start_time}
                  onChange={(e) => setNewJob({ ...newJob, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newJob.end_time}
                  onChange={(e) => setNewJob({ ...newJob, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Lieu</Label>
              <Input
                value={newJob.location || ''}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="Ville"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Heures moyennes / semaine</Label>
              <Input
                type="number"
                min="0"
                value={newJob.hours_per_week || 0}
                onChange={(e) => setNewJob({ ...newJob, hours_per_week: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>

            <Button 
              onClick={addJob} 
              className="w-full"
              disabled={!newJob.title?.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le job
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer Other */}
      <Drawer open={isOtherDialogOpen} onOpenChange={setIsOtherDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Ajouter un engagement régulier</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div>
              <Label className="text-sm">Titre</Label>
              <Input
                value={newOther.title || ''}
                onChange={(e) => setNewOther({ ...newOther, title: e.target.value })}
                placeholder="Ex: Bénévolat, engagement associatif..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Jours</Label>
              <div className="flex gap-1 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleNewDay('other', day.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      newOther.days?.includes(day.key)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Début</Label>
                <Input
                  type="time"
                  value={newOther.start_time}
                  onChange={(e) => setNewOther({ ...newOther, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newOther.end_time}
                  onChange={(e) => setNewOther({ ...newOther, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button onClick={addOther} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter l'engagement
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
