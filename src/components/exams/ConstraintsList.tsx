import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Constraint {
  id: string;
  type: string;
  days: string[];
}

interface ConstraintsListProps {
  constraints: Constraint[];
  removeConstraint: (id: string) => void;
}

const getConstraintLabel = (type: string) => {
  switch (type) {
    case "alternance":
      return "Alternance";
    case "sport":
      return "Sport";
    case "job":
      return "Job étudiant";
    default:
      return type;
  }
};

export const ConstraintsList = ({ constraints, removeConstraint }: ConstraintsListProps) => {
  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes contraintes</h1>
        <p className="text-muted-foreground text-sm">Tes disponibilités et contraintes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contraintes enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {constraints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune contrainte enregistrée. Ajoute ta première contrainte !
            </p>
          ) : (
            <div className="space-y-3">
              {constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{getConstraintLabel(constraint.type)}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConstraint(constraint.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
