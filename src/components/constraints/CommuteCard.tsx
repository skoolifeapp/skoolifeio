import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface Commute {
  name: string;
  duration_minutes: number;
}

interface CommuteCardProps {
  commutes: Commute[];
  onSave: (commutes: Commute[]) => void;
  availableActivities: string[]; // Titres des activités déjà configurées
}

export const CommuteCard = ({
  commutes,
  onSave,
  availableActivities,
}: CommuteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newCommute, setNewCommute] = useState<Commute>({
    name: '',
    duration_minutes: 0,
  });

  const constraintCount = commutes.length;

  const handleAdd = () => {
    console.log('Tentative d\'ajout:', newCommute);
    
    if (!newCommute.name || newCommute.name === 'no-activities') {
      toast.error("Sélectionne une activité");
      return;
    }
    
    if (!newCommute.duration_minutes || newCommute.duration_minutes <= 0) {
      toast.error("Indique une durée valide");
      return;
    }

    const updatedCommutes = [...commutes, newCommute];
    console.log('Trajets mis à jour:', updatedCommutes);
    onSave(updatedCommutes);
    setNewCommute({ name: '', duration_minutes: 0 });
    setIsDrawerOpen(false);
    setIsOpen(true); // Ouvrir automatiquement la liste
    toast.success("Trajet ajouté");
  };

  const handleRemove = (index: number) => {
    onSave(commutes.filter((_, i) => i !== index));
    toast.success("Trajet supprimé");
  };

  const openDrawer = () => {
    setNewCommute({ name: '', duration_minutes: 0 });
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

            {commutes.length > 0 && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                {commutes.map((commute, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{commute.name}</span>
                          <span className="text-muted-foreground">{commute.duration_minutes} min</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemove(index)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ajouter un trajet</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Activité / Lieu</Label>
              <Select 
                value={newCommute.name} 
                onValueChange={(value) => setNewCommute({ ...newCommute, name: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionne une activité..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {availableActivities.length > 0 ? (
                    availableActivities.map((activity, index) => (
                      <SelectItem key={index} value={activity}>
                        {activity}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-activities" disabled>
                      Aucune activité configurée
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Configure d'abord tes activités dans les autres onglets
              </p>
            </div>

            <div>
              <Label className="text-sm">Durée (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={newCommute.duration_minutes || ''}
                onChange={(e) => setNewCommute({ ...newCommute, duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="Temps de trajet en minutes"
                className="mt-1.5"
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAdd} className="w-full">
              Ajouter
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
