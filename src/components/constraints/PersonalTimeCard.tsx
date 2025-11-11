import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface PersonalTimeCardProps {
  minPersonalTimePerWeek: number;
  onSave: (value: number) => Promise<void>;
}

export const PersonalTimeCard = ({
  minPersonalTimePerWeek,
  onSave,
}: PersonalTimeCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editValue, setEditValue] = useState(minPersonalTimePerWeek);

  const hasConstraint = minPersonalTimePerWeek > 0;
  const constraintCount = hasConstraint ? 1 : 0;

  const handleSave = async () => {
    await onSave(editValue);
    setIsDrawerOpen(false);
    setIsOpen(true);
    toast.success("Temps personnel enregistré");
  };

  const openDrawer = () => {
    setEditValue(minPersonalTimePerWeek);
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
                  <Label className="text-base">Temps personnel minimum ({constraintCount})</Label>
                  <p className="text-xs text-muted-foreground">Pour souffler, voir des potes, sortir...</p>
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

            {hasConstraint && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Heures par semaine</span>
                    <span className="font-medium">{minPersonalTimePerWeek}h</span>
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
            <DrawerTitle>Temps personnel minimum</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Heures sans révisions par semaine : {editValue}h</Label>
              <Slider
                value={[editValue]}
                onValueChange={([value]) => setEditValue(value)}
                min={0}
                max={20}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Pour souffler, voir des potes, sortir...
              </p>
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
