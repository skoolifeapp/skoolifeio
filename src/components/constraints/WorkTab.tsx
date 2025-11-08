import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const alternanceSchedules = workSchedules.filter(s => s.type === 'alternance');
  const jobSchedules = workSchedules.filter(s => s.type === 'job');
  const otherSchedules = workSchedules.filter(s => s.type === 'other');

  const addSchedule = (type: 'alternance' | 'job' | 'other') => {
    const newSchedule: WorkSchedule = {
      type,
      days: [],
      start_time: '09:00',
      end_time: '17:00',
      location: '',
      ...(type === 'alternance' && { frequency: 'weekly' as const }),
      ...(type === 'job' && { hours_per_week: 0 }),
    };
    onWorkSchedulesChange([...workSchedules, newSchedule]);
    
    if (type === 'alternance') setIsAlternanceDialogOpen(false);
    else if (type === 'job') setIsJobDialogOpen(false);
    else setIsOtherDialogOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Alternance */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">As-tu une alternance ?</Label>
              <p className="text-xs text-muted-foreground">École + entreprise</p>
            </div>
            <Dialog open={isAlternanceDialogOpen} onOpenChange={setIsAlternanceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une alternance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Une alternance sera ajoutée. Tu pourras ensuite la configurer ci-dessous.
                  </p>
                  <Button onClick={() => addSchedule('alternance')} className="w-full">
                    Confirmer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
            <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un job étudiant</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Un job étudiant sera ajouté. Tu pourras ensuite le configurer ci-dessous.
                  </p>
                  <Button onClick={() => addSchedule('job')} className="w-full">
                    Confirmer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
            <Dialog open={isOtherDialogOpen} onOpenChange={setIsOtherDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un engagement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Un engagement sera ajouté. Tu pourras ensuite le configurer ci-dessous.
                  </p>
                  <Button onClick={() => addSchedule('other')} className="w-full">
                    Confirmer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
  );
};
