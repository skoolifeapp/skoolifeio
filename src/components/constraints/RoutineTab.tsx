import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const DAYS = [
  { key: 'lundi', label: 'L' },
  { key: 'mardi', label: 'M' },
  { key: 'mercredi', label: 'M' },
  { key: 'jeudi', label: 'J' },
  { key: 'vendredi', label: 'V' },
  { key: 'samedi', label: 'S' },
  { key: 'dimanche', label: 'D' },
];

interface RoutineMoment {
  id?: string;
  title: string;
  days: string[];
  start_time: string;
  end_time: string;
}

interface RoutineTabProps {
  wakeUpTime: string;
  noStudyAfter: string;
  sleepHoursNeeded: number;
  minPersonalTimePerWeek: number;
  otherConstraintsNotes: string;
  routineMoments: RoutineMoment[];
  onWakeUpTimeChange: (value: string) => void;
  onNoStudyAfterChange: (value: string) => void;
  onSleepHoursNeededChange: (value: number) => void;
  onMinPersonalTimePerWeekChange: (value: number) => void;
  onOtherConstraintsNotesChange: (value: string) => void;
  onRoutineMomentsChange: (moments: RoutineMoment[]) => void;
}

export const RoutineTab = ({
  wakeUpTime,
  noStudyAfter,
  sleepHoursNeeded,
  minPersonalTimePerWeek,
  otherConstraintsNotes,
  routineMoments,
  onWakeUpTimeChange,
  onNoStudyAfterChange,
  onSleepHoursNeededChange,
  onMinPersonalTimePerWeekChange,
  onOtherConstraintsNotesChange,
  onRoutineMomentsChange,
}: RoutineTabProps) => {
  const addRoutineMoment = () => {
    const newMoment: RoutineMoment = {
      title: '',
      days: [],
      start_time: '12:00',
      end_time: '13:00',
    };
    onRoutineMomentsChange([...routineMoments, newMoment]);
  };

  const updateRoutineMoment = (index: number, updates: Partial<RoutineMoment>) => {
    const newMoments = [...routineMoments];
    newMoments[index] = { ...newMoments[index], ...updates };
    onRoutineMomentsChange(newMoments);
  };

  const removeRoutineMoment = (index: number) => {
    onRoutineMomentsChange(routineMoments.filter((_, i) => i !== index));
  };

  const toggleDay = (momentIndex: number, day: string) => {
    const moment = routineMoments[momentIndex];
    const days = moment.days.includes(day)
      ? moment.days.filter(d => d !== day)
      : [...moment.days, day];
    updateRoutineMoment(momentIndex, { days });
  };

  return (
    <div className="space-y-6">
      {/* Rythme de base */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Ton rythme de base</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Heure de lever habituelle</Label>
              <Input
                type="time"
                value={wakeUpTime}
                onChange={(e) => onWakeUpTimeChange(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Ne plus réviser après</Label>
              <Input
                type="time"
                value={noStudyAfter}
                onChange={(e) => onNoStudyAfterChange(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Heures de sommeil souhaitées : {sleepHoursNeeded}h</Label>
            <Slider
              value={[sleepHoursNeeded]}
              onValueChange={([value]) => onSleepHoursNeededChange(value)}
              min={5}
              max={12}
              step={0.5}
              className="mt-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Moments réguliers importants */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Moments réguliers importants</Label>
              <p className="text-xs text-muted-foreground">Famille, couple, religion, etc.</p>
            </div>
            <Button onClick={addRoutineMoment} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {routineMoments.length > 0 && (
            <div className="space-y-3">
              {routineMoments.map((moment, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm">Nom</Label>
                    <Input
                      value={moment.title}
                      onChange={(e) => updateRoutineMoment(index, { title: e.target.value })}
                      placeholder="Ex: Repas famille, Prière..."
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Jours</Label>
                    <div className="flex gap-1 mt-2">
                      {DAYS.map((day) => (
                        <button
                          key={day.key}
                          onClick={() => toggleDay(index, day.key)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                            moment.days.includes(day.key)
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
                        value={moment.start_time}
                        onChange={(e) => updateRoutineMoment(index, { start_time: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Fin</Label>
                      <Input
                        type="time"
                        value={moment.end_time}
                        onChange={(e) => updateRoutineMoment(index, { end_time: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => removeRoutineMoment(index)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temps perso minimum */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-base">Temps perso minimum sans révisions par semaine : {minPersonalTimePerWeek}h</Label>
            <Slider
              value={[minPersonalTimePerWeek]}
              onValueChange={([value]) => onMinPersonalTimePerWeekChange(value)}
              min={0}
              max={20}
              step={1}
              className="mt-3"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Pour souffler, voir des potes, sortir...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Autres contraintes */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-base">Autres contraintes</Label>
            <p className="text-xs text-muted-foreground mb-2">Tout ce qu'on devrait savoir d'autre</p>
            <Textarea
              value={otherConstraintsNotes}
              onChange={(e) => onOtherConstraintsNotesChange(e.target.value)}
              placeholder="Ex: Je dois m'occuper de mon petit frère le mercredi après-midi..."
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
