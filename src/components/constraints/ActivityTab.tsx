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

interface Activity {
  id?: string;
  type: 'sport' | 'asso' | 'cours' | 'projet' | 'autre';
  title: string;
  days: string[];
  start_time: string;
  end_time: string;
  location?: string;
}

interface ActivityTabProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
}

export const ActivityTab = ({ activities, onActivitiesChange }: ActivityTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'sport',
    title: '',
    days: [],
    start_time: '18:00',
    end_time: '20:00',
    location: '',
  });

  const addActivity = async () => {
    const activity: Activity = {
      type: newActivity.type as Activity['type'],
      title: newActivity.title || '',
      days: newActivity.days || [],
      start_time: newActivity.start_time || '18:00',
      end_time: newActivity.end_time || '20:00',
      location: newActivity.location,
    };
    onActivitiesChange([...activities, activity]);
    setIsDialogOpen(false);
    setNewActivity({ type: 'sport', title: '', days: [], start_time: '18:00', end_time: '20:00', location: '' });
  };

  const updateActivity = (index: number, updates: Partial<Activity>) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], ...updates };
    onActivitiesChange(newActivities);
  };

  const removeActivity = (index: number) => {
    onActivitiesChange(activities.filter((_, i) => i !== index));
  };

  const toggleNewDay = (day: string) => {
    const days = newActivity.days?.includes(day)
      ? newActivity.days.filter(d => d !== day)
      : [...(newActivity.days || []), day];
    setNewActivity({ ...newActivity, days });
  };

  const toggleDay = (activityIndex: number, day: string) => {
    const activity = activities[activityIndex];
    const days = activity.days.includes(day)
      ? activity.days.filter(d => d !== day)
      : [...activity.days, day];
    updateActivity(activityIndex, { days });
  };

  return (
    <>
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">As-tu des activités régulières ?</Label>
            <p className="text-xs text-muted-foreground">Sport, assos, cours, projets perso...</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="icon" 
            className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune activité ajoutée
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Type</Label>
                    <Select
                      value={activity.type}
                      onValueChange={(value: Activity['type']) => updateActivity(index, { type: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sport">Sport</SelectItem>
                        <SelectItem value="asso">Asso</SelectItem>
                        <SelectItem value="cours">Cours</SelectItem>
                        <SelectItem value="projet">Projet</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Nom</Label>
                    <Input
                      value={activity.title}
                      onChange={(e) => updateActivity(index, { title: e.target.value })}
                      placeholder="Ex: Football, Bureau des élèves..."
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Jours</Label>
                  <div className="flex gap-1 mt-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.key}
                        onClick={() => toggleDay(index, day.key)}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          activity.days.includes(day.key)
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
                      value={activity.start_time}
                      onChange={(e) => updateActivity(index, { start_time: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Fin</Label>
                    <Input
                      type="time"
                      value={activity.end_time}
                      onChange={(e) => updateActivity(index, { end_time: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Lieu</Label>
                  <Input
                    value={activity.location || ''}
                    onChange={(e) => updateActivity(index, { location: e.target.value })}
                    placeholder="Optionnel"
                    className="mt-1.5"
                  />
                </div>

                <Button
                  onClick={() => removeActivity(index)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer cette activité
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      {/* Drawer Activité */}
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Ajouter une activité</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Type</Label>
                <Select
                  value={newActivity.type}
                  onValueChange={(value: Activity['type']) => setNewActivity({ ...newActivity, type: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sport">Sport</SelectItem>
                    <SelectItem value="asso">Asso</SelectItem>
                    <SelectItem value="cours">Cours</SelectItem>
                    <SelectItem value="projet">Projet</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Nom</Label>
                <Input
                  value={newActivity.title || ''}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="Ex: Football..."
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Jours</Label>
              <div className="flex gap-1 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleNewDay(day.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      newActivity.days?.includes(day.key)
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
                  value={newActivity.start_time}
                  onChange={(e) => setNewActivity({ ...newActivity, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newActivity.end_time}
                  onChange={(e) => setNewActivity({ ...newActivity, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Lieu (optionnel)</Label>
              <Input
                value={newActivity.location || ''}
                onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                placeholder="Optionnel"
                className="mt-1.5"
              />
            </div>

            <Button onClick={addActivity} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter l'activité
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
