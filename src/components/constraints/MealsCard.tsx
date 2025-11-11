import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Meal {
  type: string;
  start_time: string;
  end_time: string;
}

interface MealsCardProps {
  meals: Meal[];
  onSave: (meals: Meal[]) => void;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Goûter' },
  { value: 'dinner', label: 'Dîner' },
];

export const MealsCard = ({ meals, onSave }: MealsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newMeal, setNewMeal] = useState<Meal>({
    type: '',
    start_time: '',
    end_time: '',
  });

  const constraintCount = meals.length;

  const handleAdd = () => {
    if (!newMeal.type) {
      toast.error("Sélectionne un type de repas");
      return;
    }

    if (!newMeal.start_time || !newMeal.end_time) {
      toast.error("Indique les horaires");
      return;
    }

    const updatedMeals = [...meals, newMeal];
    onSave(updatedMeals);
    setNewMeal({ type: '', start_time: '', end_time: '' });
    setIsDrawerOpen(false);
    setIsOpen(true);
    toast.success("Repas ajouté");
  };

  const handleDelete = (index: number) => {
    const updatedMeals = meals.filter((_, i) => i !== index);
    onSave(updatedMeals);
    toast.success("Repas supprimé");
  };

  const getMealLabel = (type: string) => {
    return MEAL_TYPES.find(m => m.value === type)?.label || type;
  };

  return (
    <Card className="p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Repas</h3>
              {constraintCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {constraintCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Définis tes tranches horaires de repas
            </p>
          </div>

          <div className="flex gap-2">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Ajouter un repas</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type de repas</label>
                    <Select
                      value={newMeal.type}
                      onValueChange={(value) => setNewMeal({ ...newMeal, type: value })}
                    >
                      <SelectTrigger>
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
                      <label className="text-sm font-medium mb-2 block">Début</label>
                      <Input
                        type="time"
                        value={newMeal.start_time}
                        onChange={(e) => setNewMeal({ ...newMeal, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fin</label>
                      <Input
                        type="time"
                        value={newMeal.end_time}
                        onChange={(e) => setNewMeal({ ...newMeal, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAdd} className="flex-1">
                      Enregistrer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            {constraintCount > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {meals.length > 0 && (
          <CollapsibleContent className="space-y-3 pt-4 animate-accordion-down">
            {meals.map((meal, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{getMealLabel(meal.type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {meal.start_time} - {meal.end_time}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
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
    </Card>
  );
};
