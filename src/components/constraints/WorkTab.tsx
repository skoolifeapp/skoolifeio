import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  hasAlternance: boolean;
  hasJob: boolean;
  onAlternanceChange: (value: boolean) => void;
  onJobChange: (value: boolean) => void;
  workSchedules: WorkSchedule[];
  onWorkSchedulesChange: (schedules: WorkSchedule[]) => void;
}

export const WorkTab = ({
  hasAlternance,
  hasJob,
  onAlternanceChange,
  onJobChange,
  workSchedules,
  onWorkSchedulesChange,
}: WorkTabProps) => {
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
            <Switch checked={hasAlternance} onCheckedChange={onAlternanceChange} />
          </div>

          {hasAlternance && (
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

              <Button
                onClick={() => addSchedule('alternance')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un planning d'alternance
              </Button>
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
            <Switch checked={hasJob} onCheckedChange={onJobChange} />
          </div>

          {hasJob && (
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

              <Button
                onClick={() => addSchedule('job')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un job
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autres engagements */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Autres engagements réguliers</Label>
            <Button onClick={() => addSchedule('other')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
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
  );
};
