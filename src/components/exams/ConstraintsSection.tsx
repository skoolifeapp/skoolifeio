import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface Constraint {
  id: string;
  type: string;
  days: string[];
}

interface ConstraintsSectionProps {
  constraints: Constraint[];
  addConstraint: (type: string) => void;
  removeConstraint: (id: string) => void;
}

export const ConstraintsSection = ({ constraints, addConstraint, removeConstraint }: ConstraintsSectionProps) => {
  return (
    <div className="px-6 pt-6 pb-20 h-full overflow-y-auto">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mes contraintes</h1>
        <p className="text-muted-foreground mb-8">
          Ajoute tes disponibilités et contraintes
        </p>

        <Card className="p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold mb-4">Ajouter une contrainte</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("alternance")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Alternance
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("sport")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sport
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addConstraint("job")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Job étudiant
            </Button>
          </div>

          {constraints.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Contraintes ajoutées</h3>
              <div className="space-y-2">
                {constraints.map((constraint) => (
                  <div
                    key={constraint.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <p className="font-medium capitalize">{constraint.type}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConstraint(constraint.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
