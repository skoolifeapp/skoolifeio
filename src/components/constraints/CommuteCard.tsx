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
  name: string;
  duration_minutes: number;
}

interface CommuteCardProps {
  commutes: Commute[];
  onSave: (commutes: Commute[]) => void;
}

export const CommuteCard = ({
  commutes,
  onSave,
}: CommuteCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newCommute, setNewCommute] = useState<Commute>({
    name: '',
    duration_minutes: 0,
  });

  const constraintCount = commutes.length;

  const handleAdd = () => {
    if (!newCommute.name.trim()) {
      toast.error("Le nom du trajet est requis");
      return;
    }
    
    if (!newCommute.duration_minutes || newCommute.duration_minutes <= 0) {
      toast.error("Indique une durée valide");
      return;
    }

    const updatedCommutes = [...commutes, newCommute];
    onSave(updatedCommutes);
    setNewCommute({ name: '', duration_minutes: 0 });
    setIsDrawerOpen(false);
    setIsOpen(true);
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </Button>
                </CollapsibleTrigger>
                <div>
                  <h3 className="font-semibold">Temps de trajet</h3>
                  <p className="text-xs text-muted-foreground">
                    {constraintCount === 0 ? 'Aucun trajet défini' : `${constraintCount} trajet${constraintCount > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <Button
                onClick={openDrawer}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            <CollapsibleContent>
              {commutes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun trajet configuré
                </p>
              ) : (
                <div className="space-y-2">
                  {commutes.map((commute, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{commute.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {commute.duration_minutes} min
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
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
              <Label htmlFor="commute-name">Destination</Label>
              <Select
                value={newCommute.name}
                onValueChange={(value) => setNewCommute({ ...newCommute, name: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionne une destination" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Domicile ↔ École">Domicile ↔ École</SelectItem>
                  <SelectItem value="Domicile ↔ Alternance">Domicile ↔ Alternance</SelectItem>
                  <SelectItem value="Domicile ↔ Job">Domicile ↔ Job</SelectItem>
                  <SelectItem value="Domicile ↔ Activité principale">Domicile ↔ Activité principale</SelectItem>
                  <SelectItem value="Domicile ↔ Salle de sport">Domicile ↔ Salle de sport</SelectItem>
                  <SelectItem value="École ↔ Alternance">École ↔ Alternance</SelectItem>
                  <SelectItem value="École ↔ Job">École ↔ Job</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="commute-duration">Durée (minutes)</Label>
              <Input
                id="commute-duration"
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
