import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";

interface RevisionTabProps {
  maxSessionsPerDay: number;
  maxSessionDurationMinutes: number;
  weeklyHoursGoal: number;
  onSave: (data: { maxSessionsPerDay?: number; maxSessionDurationMinutes?: number; weeklyHoursGoal?: number }) => void;
}

export const RevisionTab = ({
  maxSessionsPerDay,
  maxSessionDurationMinutes,
  weeklyHoursGoal,
  onSave,
}: RevisionTabProps) => {
  const [sessionPerDayDrawerOpen, setSessionPerDayDrawerOpen] = useState(false);
  const [durationDrawerOpen, setDurationDrawerOpen] = useState(false);
  const [weeklyGoalDrawerOpen, setWeeklyGoalDrawerOpen] = useState(false);

  const [tempMaxSessions, setTempMaxSessions] = useState(maxSessionsPerDay);
  const [tempMaxDuration, setTempMaxDuration] = useState(maxSessionDurationMinutes);
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(weeklyHoursGoal);

  const handleSessionsPerDaySave = () => {
    onSave({ maxSessionsPerDay: tempMaxSessions });
    setSessionPerDayDrawerOpen(false);
  };

  const handleDurationSave = () => {
    onSave({ maxSessionDurationMinutes: tempMaxDuration });
    setDurationDrawerOpen(false);
  };

  const handleWeeklyGoalSave = () => {
    onSave({ weeklyHoursGoal: tempWeeklyGoal });
    setWeeklyGoalDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sessions par jour */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Sessions par jour</CardTitle>
            <CardDescription>Nombre maximum de sessions de révision par jour</CardDescription>
          </div>
          <Drawer open={sessionPerDayDrawerOpen} onOpenChange={setSessionPerDayDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Sessions par jour</DrawerTitle>
              </DrawerHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label>Nombre maximum de sessions : {tempMaxSessions}</Label>
                  <Slider
                    value={[tempMaxSessions]}
                    onValueChange={(value) => setTempMaxSessions(value[0])}
                    min={1}
                    max={3}
                    step={1}
                  />
                  <p className="text-sm text-muted-foreground">
                    Limite le nombre de sessions de révision par jour (1 à 3)
                  </p>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleSessionsPerDaySave}>Enregistrer</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maxSessionsPerDay} {maxSessionsPerDay > 1 ? 'sessions' : 'session'}</div>
        </CardContent>
      </Card>

      {/* Durée max par session */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Durée par session</CardTitle>
            <CardDescription>Durée maximum d'une session de révision</CardDescription>
          </div>
          <Drawer open={durationDrawerOpen} onOpenChange={setDurationDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Durée par session</DrawerTitle>
              </DrawerHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label>Durée maximum : {tempMaxDuration} minutes</Label>
                  <Slider
                    value={[tempMaxDuration]}
                    onValueChange={(value) => setTempMaxDuration(value[0])}
                    min={30}
                    max={180}
                    step={15}
                  />
                  <p className="text-sm text-muted-foreground">
                    Durée maximale d'une session de révision (30 à 180 minutes)
                  </p>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleDurationSave}>Enregistrer</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maxSessionDurationMinutes} minutes</div>
        </CardContent>
      </Card>

      {/* Objectif hebdomadaire */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Objectif hebdomadaire</CardTitle>
            <CardDescription>Nombre d'heures de révision par semaine</CardDescription>
          </div>
          <Drawer open={weeklyGoalDrawerOpen} onOpenChange={setWeeklyGoalDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Objectif hebdomadaire</DrawerTitle>
              </DrawerHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label>Objectif : {tempWeeklyGoal} heures par semaine</Label>
                  <Slider
                    value={[tempWeeklyGoal]}
                    onValueChange={(value) => setTempWeeklyGoal(value[0])}
                    min={1}
                    max={40}
                    step={1}
                  />
                  <p className="text-sm text-muted-foreground">
                    Objectif d'heures de révision par semaine (1 à 40 heures)
                  </p>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleWeeklyGoalSave}>Enregistrer</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{weeklyHoursGoal}h / semaine</div>
        </CardContent>
      </Card>
    </div>
  );
};
