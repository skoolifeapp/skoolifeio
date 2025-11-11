import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface RoutineMoment {
  id?: string;
  title: string;
  days: string[];
  start_time: string;
  end_time: string;
}

interface RoutineTabProps {
  routineMoments: RoutineMoment[];
  onRoutineMomentsChange: (moments: RoutineMoment[]) => void;
}

export const RoutineTab = ({
  routineMoments,
  onRoutineMomentsChange,
}: RoutineTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMomentsOpen, setIsMomentsOpen] = useState(false);
  const [newMoment, setNewMoment] = useState<Partial<RoutineMoment>>({
    title: '',
    days: [],
    start_time: '12:00',
    end_time: '13:00',
  });

  const addRoutineMoment = async () => {
    const moment: RoutineMoment = {
      title: newMoment.title || '',
      days: newMoment.days || [],
      start_time: newMoment.start_time || '12:00',
      end_time: newMoment.end_time || '13:00',
    };
    onRoutineMomentsChange([...routineMoments, moment]);
    setIsDialogOpen(false);
    setNewMoment({ title: '', days: [], start_time: '12:00', end_time: '13:00' });
  };

  const updateRoutineMoment = (index: number, updates: Partial<RoutineMoment>) => {
    const newMoments = [...routineMoments];
    newMoments[index] = { ...newMoments[index], ...updates };
    onRoutineMomentsChange(newMoments);
  };

  const removeRoutineMoment = (index: number) => {
    onRoutineMomentsChange(routineMoments.filter((_, i) => i !== index));
  };

  const toggleNewDay = (day: string) => {
    const days = newMoment.days?.includes(day)
      ? newMoment.days.filter(d => d !== day)
      : [...(newMoment.days || []), day];
    setNewMoment({ ...newMoment, days });
  };

  const toggleDay = (momentIndex: number, day: string) => {
    const moment = routineMoments[momentIndex];
    const days = moment.days.includes(day)
      ? moment.days.filter(d => d !== day)
      : [...moment.days, day];
    updateRoutineMoment(momentIndex, { days });
  };

  return (
    <>
    <div className="space-y-6">
      {/* Moments réguliers importants */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isMomentsOpen} onOpenChange={setIsMomentsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">Moments réguliers importants ({routineMoments.length})</Label>
                  <p className="text-xs text-muted-foreground">Famille, couple, religion, etc.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDialogOpen(true);
                    }}
                    size="icon" 
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isMomentsOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>

            {routineMoments.length > 0 && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
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
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>
    </div>

      {/* Drawer Routine */}
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Ajouter un moment important</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div>
              <Label className="text-sm">Nom</Label>
              <Input
                value={newMoment.title || ''}
                onChange={(e) => setNewMoment({ ...newMoment, title: e.target.value })}
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
                    onClick={() => toggleNewDay(day.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      newMoment.days?.includes(day.key)
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
                  value={newMoment.start_time}
                  onChange={(e) => setNewMoment({ ...newMoment, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newMoment.end_time}
                  onChange={(e) => setNewMoment({ ...newMoment, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button onClick={addRoutineMoment} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le moment
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};