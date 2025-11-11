import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface RevisionTabProps {
  maxSessionsPerDay: number | null;
  maxSessionDurationMinutes: number | null;
  weeklyHoursGoal: number | null;
  onSave: (data: { maxSessionsPerDay?: number; maxSessionDurationMinutes?: number; weeklyHoursGoal?: number }) => void;
}

export const RevisionTab = ({
  maxSessionsPerDay,
  maxSessionDurationMinutes,
  weeklyHoursGoal,
  onSave,
}: RevisionTabProps) => {
  // Sessions per day
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);
  const [tempMaxSessions, setTempMaxSessions] = useState(maxSessionsPerDay ?? 2);

  // Duration per session
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [isDurationDrawerOpen, setIsDurationDrawerOpen] = useState(false);
  const [tempMaxDuration, setTempMaxDuration] = useState(maxSessionDurationMinutes ?? 90);

  // Weekly goal
  const [isWeeklyGoalOpen, setIsWeeklyGoalOpen] = useState(false);
  const [isWeeklyGoalDrawerOpen, setIsWeeklyGoalDrawerOpen] = useState(false);
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(weeklyHoursGoal ?? 10);

  const hasSessionsConstraint = maxSessionsPerDay !== null;
  const hasDurationConstraint = maxSessionDurationMinutes !== null;
  const hasWeeklyGoalConstraint = weeklyHoursGoal !== null;

  const handleSessionsSave = async () => {
    onSave({ maxSessionsPerDay: tempMaxSessions });
    setIsSessionsDrawerOpen(false);
    setIsSessionsOpen(true);
    toast.success("Sessions par jour enregistrées");
  };

  const handleDurationSave = async () => {
    onSave({ maxSessionDurationMinutes: tempMaxDuration });
    setIsDurationDrawerOpen(false);
    setIsDurationOpen(true);
    toast.success("Durée par session enregistrée");
  };

  const handleWeeklyGoalSave = async () => {
    onSave({ weeklyHoursGoal: tempWeeklyGoal });
    setIsWeeklyGoalDrawerOpen(false);
    setIsWeeklyGoalOpen(true);
    toast.success("Objectif hebdomadaire enregistré");
  };

  const openSessionsDrawer = () => {
    setTempMaxSessions(maxSessionsPerDay ?? 2);
    setIsSessionsDrawerOpen(true);
  };

  const openDurationDrawer = () => {
    setTempMaxDuration(maxSessionDurationMinutes ?? 90);
    setIsDurationDrawerOpen(true);
  };

  const openWeeklyGoalDrawer = () => {
    setTempWeeklyGoal(weeklyHoursGoal ?? 10);
    setIsWeeklyGoalDrawerOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Sessions par jour */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Collapsible open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <Label className="text-base">Sessions par jour</Label>
                    <p className="text-xs text-muted-foreground">Nombre maximum de sessions de révision par jour</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openSessionsDrawer();
                      }}
                      size="icon" 
                      className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isSessionsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>

              {hasSessionsConstraint && (
                <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Maximum de sessions</span>
                      <span className="font-medium">{maxSessionsPerDay} {maxSessionsPerDay! > 1 ? 'sessions' : 'session'}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </CardContent>
        </Card>

        {/* Durée par session */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Collapsible open={isDurationOpen} onOpenChange={setIsDurationOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <Label className="text-base">Durée par session</Label>
                    <p className="text-xs text-muted-foreground">Durée maximum d'une session de révision</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDurationDrawer();
                      }}
                      size="icon" 
                      className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isDurationOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>

              {hasDurationConstraint && (
                <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Durée maximale</span>
                      <span className="font-medium">{maxSessionDurationMinutes} minutes</span>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </CardContent>
        </Card>

        {/* Objectif hebdomadaire */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Collapsible open={isWeeklyGoalOpen} onOpenChange={setIsWeeklyGoalOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <Label className="text-base">Objectif hebdomadaire</Label>
                    <p className="text-xs text-muted-foreground">Nombre d'heures de révision par semaine</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openWeeklyGoalDrawer();
                      }}
                      size="icon" 
                      className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isWeeklyGoalOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>

              {hasWeeklyGoalConstraint && (
                <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Objectif par semaine</span>
                      <span className="font-medium">{weeklyHoursGoal}h</span>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      {/* Drawer Sessions par jour */}
      <Drawer open={isSessionsDrawerOpen} onOpenChange={setIsSessionsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Sessions par jour</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Nombre maximum de sessions : {tempMaxSessions}</Label>
              <Slider
                value={[tempMaxSessions]}
                onValueChange={([value]) => setTempMaxSessions(value)}
                min={1}
                max={3}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Limite le nombre de sessions de révision par jour (1 à 3)
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSessionsSave} className="w-full">
              Enregistrer
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer Durée par session */}
      <Drawer open={isDurationDrawerOpen} onOpenChange={setIsDurationDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Durée par session</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Durée maximum : {tempMaxDuration} minutes</Label>
              <Slider
                value={[tempMaxDuration]}
                onValueChange={([value]) => setTempMaxDuration(value)}
                min={30}
                max={180}
                step={15}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Durée maximale d'une session de révision (30 à 180 minutes)
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleDurationSave} className="w-full">
              Enregistrer
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer Objectif hebdomadaire */}
      <Drawer open={isWeeklyGoalDrawerOpen} onOpenChange={setIsWeeklyGoalDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Objectif hebdomadaire</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Objectif : {tempWeeklyGoal} heures par semaine</Label>
              <Slider
                value={[tempWeeklyGoal]}
                onValueChange={([value]) => setTempWeeklyGoal(value)}
                min={1}
                max={40}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Objectif d'heures de révision par semaine (1 à 40 heures)
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleWeeklyGoalSave} className="w-full">
              Enregistrer
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
