import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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

  const [newAlternance, setNewAlternance] = useState<Partial<WorkSchedule>>({
    days: [],
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    frequency: 'weekly',
  });

  const [newJob, setNewJob] = useState<Partial<WorkSchedule>>({
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
    const schedule: WorkSchedule = {
      type: 'alternance',
      days: newAlternance.days || [],
      start_time: newAlternance.start_time || '09:00',
      end_time: newAlternance.end_time || '17:00',
      location: newAlternance.location,
      frequency: newAlternance.frequency || 'weekly',
    };
    onWorkSchedulesChange([...workSchedules, schedule]);
    setIsAlternanceDialogOpen(false);
    setNewAlternance({ days: [], start_time: '09:00', end_time: '17:00', location: '', frequency: 'weekly' });
  };

  const addJob = async () => {
    const schedule: WorkSchedule = {
      type: 'job',
      days: newJob.days || [],
      start_time: newJob.start_time || '09:00',
      end_time: newJob.end_time || '17:00',
      location: newJob.location,
      hours_per_week: newJob.hours_per_week || 0,
    };
    onWorkSchedulesChange([...workSchedules, schedule]);
    setIsJobDialogOpen(false);
    setNewJob({ days: [], start_time: '09:00', end_time: '17:00', location: '', hours_per_week: 0 });
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
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">As-tu une alternance ?</Label>
              <p className="text-xs text-muted-foreground">École + entreprise</p>
            </div>
            <Button 
              onClick={() => setIsAlternanceDialogOpen(true)}
              size="icon" 
              className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {alternanceSchedules.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              {alternanceSchedules.map((schedule, idx) => {
                const globalIdx = workSchedules.indexOf(schedule);
                return (
                  <div key={globalIdx} className="space-y-3 p-4 border rounded-lg">
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

                    {alternanceSchedules.length > 1 && (
                      <Button
                        onClick={() => removeSchedule(globalIdx)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job étudiant */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">As-tu un job étudiant ?</Label>
              <p className="text-xs text-muted-foreground">En parallèle de tes études</p>
            </div>
            <Button 
              onClick={() => setIsJobDialogOpen(true)}
              size="icon" 
              className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {jobSchedules.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              {jobSchedules.map((schedule, idx) => {
                const globalIdx = workSchedules.indexOf(schedule);
                return (
                  <div key={globalIdx} className="space-y-3 p-4 border rounded-lg">
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

                    {jobSchedules.length > 1 && (
                      <Button
                        onClick={() => removeSchedule(globalIdx)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autres engagements */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Autres engagements réguliers</Label>
            <Button 
              onClick={() => setIsOtherDialogOpen(true)}
              size="icon" 
              className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {otherSchedules.length > 0 && (
            <div className="space-y-3">
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
            </div>
          )}
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

            <Button onClick={addAlternance} className="w-full">
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

            <Button onClick={addJob} className="w-full">
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
