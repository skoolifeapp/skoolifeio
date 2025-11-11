import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface SleepConstraintCardProps {
  wakeUpTime: string;
  noStudyAfter: string;
  sleepHoursNeeded: number;
  onSave: (data: { wakeUpTime: string; noStudyAfter: string; sleepHoursNeeded: number }) => void;
}

export const SleepConstraintCard = ({
  wakeUpTime,
  noStudyAfter,
  sleepHoursNeeded,
  onSave,
}: SleepConstraintCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editData, setEditData] = useState({
    wakeUpTime,
    noStudyAfter,
    sleepHoursNeeded,
  });

  const hasConstraints = wakeUpTime !== '07:00' || noStudyAfter !== '22:00' || sleepHoursNeeded !== 8;
  const constraintCount = hasConstraints ? 1 : 0;

  const handleSave = async () => {
    await onSave(editData);
    setIsDrawerOpen(false);
    setIsOpen(true);
    toast.success("Rythme de sommeil enregistré");
  };

  const openDrawer = () => {
    setEditData({ wakeUpTime, noStudyAfter, sleepHoursNeeded });
    setIsDrawerOpen(true);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">Rythme de sommeil ({constraintCount})</Label>
                  <p className="text-xs text-muted-foreground">Heure de lever et de coucher</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openDrawer();
                    }}
                    size="icon" 
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>

            {hasConstraints && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Heure de lever</span>
                    <span className="font-medium">{wakeUpTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ne plus réviser après</span>
                    <span className="font-medium">{noStudyAfter}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Heures de sommeil</span>
                    <span className="font-medium">{sleepHoursNeeded}h</span>
                  </div>
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Configurer ton rythme de sommeil</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Heure de lever habituelle</Label>
                <Input
                  type="time"
                  value={editData.wakeUpTime}
                  onChange={(e) => setEditData({ ...editData, wakeUpTime: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm">Ne plus réviser après</Label>
                <Input
                  type="time"
                  value={editData.noStudyAfter}
                  onChange={(e) => setEditData({ ...editData, noStudyAfter: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Heures de sommeil souhaitées : {editData.sleepHoursNeeded}h</Label>
              <Slider
                value={[editData.sleepHoursNeeded]}
                onValueChange={([value]) => setEditData({ ...editData, sleepHoursNeeded: value })}
                min={5}
                max={12}
                step={0.5}
                className="mt-3"
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleSave} className="w-full">
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
