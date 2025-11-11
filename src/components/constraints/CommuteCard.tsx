import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Commute {
  id?: string;
  destination: string;
  duration_minutes: number;
}

interface CommuteCardProps {
  commutes: Commute[];
  onSave: (commute: Commute) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  availableDestinations: string[];
}

export const CommuteCard = ({
  commutes,
  onSave,
  onDelete,
  availableDestinations,
}: CommuteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newCommute, setNewCommute] = useState<Commute>({
    destination: '',
    duration_minutes: 0,
  });

  const constraintCount = commutes.length;

  const handleAdd = async () => {
    if (!newCommute.destination || newCommute.destination === 'no-destinations') {
      toast.error("Sélectionne une destination");
      return;
    }
    
    if (!newCommute.duration_minutes || newCommute.duration_minutes <= 0) {
      toast.error("Indique une durée valide");
      return;
    }

    await onSave(newCommute);
    setNewCommute({ destination: '', duration_minutes: 0 });
    setIsDrawerOpen(false);
    setIsOpen(true);
    toast.success("Trajet ajouté");
  };

  const handleRemove = async (id: string) => {
    await onDelete(id);
    toast.success("Trajet supprimé");
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
                      setIsDrawerOpen(true);
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
                        <p className="font-medium">{commute.destination}</p>
                        <p className="text-sm text-muted-foreground">
                          {commute.duration_minutes} min
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => commute.id && handleRemove(commute.id)}
                        className="text-destructive hover:text-destructive"
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
              <Label className="text-sm">Destination</Label>
              <Select
                value={newCommute.destination}
                onValueChange={(value) => setNewCommute({ ...newCommute, destination: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionne une destination" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {availableDestinations.length > 0 ? (
                    availableDestinations.map((destination, index) => (
                      <SelectItem key={index} value={destination}>
                        {destination}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-destinations" disabled>
                      Configure d'abord ton travail/activités
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Configure d'abord tes activités dans les onglets Travail et Activité
              </p>
            </div>
            <div>
              <Label className="text-sm">Durée (minutes)</Label>
              <Input
                type="number"
                min="1"
                placeholder="30"
                value={newCommute.duration_minutes || ""}
                onChange={(e) => setNewCommute({ ...newCommute, duration_minutes: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAdd} className="w-full">
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
