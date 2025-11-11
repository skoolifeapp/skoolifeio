import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface CommuteCardProps {
  commuteHomeSchool: number;
  commuteHomeJob: number;
  commuteHomeActivity: number;
  onSave: (data: { commuteHomeSchool: number; commuteHomeJob: number; commuteHomeActivity: number }) => void;
}

export const CommuteCard = ({
  commuteHomeSchool,
  commuteHomeJob,
  commuteHomeActivity,
  onSave,
}: CommuteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editData, setEditData] = useState({
    commuteHomeSchool,
    commuteHomeJob,
    commuteHomeActivity,
  });

  const hasConstraints = commuteHomeSchool > 0 || commuteHomeJob > 0 || commuteHomeActivity > 0;
  const constraintCount = [commuteHomeSchool > 0, commuteHomeJob > 0, commuteHomeActivity > 0].filter(Boolean).length;

  const handleSave = () => {
    onSave(editData);
    setIsDrawerOpen(false);
    toast.success("Temps de trajet enregistré");
  };

  const openDrawer = () => {
    setEditData({ commuteHomeSchool, commuteHomeJob, commuteHomeActivity });
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
                  <Label className="text-base">Temps de trajet ({constraintCount})</Label>
                  <p className="text-xs text-muted-foreground">Pour bloquer les temps morts imposés</p>
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
                  {commuteHomeSchool > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Domicile ↔ École</span>
                      <span className="font-medium">{commuteHomeSchool} min</span>
                    </div>
                  )}
                  {commuteHomeJob > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Domicile ↔ Travail</span>
                      <span className="font-medium">{commuteHomeJob} min</span>
                    </div>
                  )}
                  {commuteHomeActivity > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Domicile ↔ Activité</span>
                      <span className="font-medium">{commuteHomeActivity} min</span>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Configurer les temps de trajet</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Domicile ↔ École (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={editData.commuteHomeSchool}
                onChange={(e) => setEditData({ ...editData, commuteHomeSchool: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Domicile ↔ Travail (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={editData.commuteHomeJob}
                onChange={(e) => setEditData({ ...editData, commuteHomeJob: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">Domicile ↔ Activité (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={editData.commuteHomeActivity}
                onChange={(e) => setEditData({ ...editData, commuteHomeActivity: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
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
