import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Meal {
  id?: string;
  meal_type: string;
  start_time: string;
  end_time: string;
}

interface MealsCardProps {
  meals: Meal[];
  onSave: (meal: Meal) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Goûter' },
  { value: 'dinner', label: 'Dîner' },
];

export const MealsCard = ({ meals, onSave, onDelete }: MealsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newMeal, setNewMeal] = useState<Meal>({
    meal_type: '',
    start_time: '',
    end_time: '',
  });

  const constraintCount = meals.length;

  const handleAdd = async () => {
    if (!newMeal.meal_type) {
      toast.error("Sélectionne un type de repas");
      return;
    }

    if (!newMeal.start_time || !newMeal.end_time) {
      toast.error("Indique les horaires");
      return;
    }

    await onSave(newMeal);
    setNewMeal({ meal_type: '', start_time: '', end_time: '' });
    setIsDrawerOpen(false);
    setIsOpen(true);
    toast.success("Repas ajouté");
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    toast.success("Repas supprimé");
  };

  const getMealLabel = (type: string) => {
    return MEAL_TYPES.find(m => m.value === type)?.label || type;
  };

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <Label className="text-base">Repas ({constraintCount})</Label>
                  <p className="text-xs text-muted-foreground">Définis tes tranches horaires de repas</p>
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

            {meals.length > 0 && (
              <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
                {meals.map((meal, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{getMealLabel(meal.meal_type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {meal.start_time} - {meal.end_time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => meal.id && handleDelete(meal.id)}
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
            <DrawerTitle>Ajouter un repas</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-6">
            <div>
              <Label className="text-sm">Type de repas</Label>
              <Select
                value={newMeal.meal_type}
                onValueChange={(value) => setNewMeal({ ...newMeal, meal_type: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionne un repas" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((meal) => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Début</Label>
                <Input
                  type="time"
                  value={newMeal.start_time}
                  onChange={(e) => setNewMeal({ ...newMeal, start_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm">Fin</Label>
                <Input
                  type="time"
                  value={newMeal.end_time}
                  onChange={(e) => setNewMeal({ ...newMeal, end_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
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
