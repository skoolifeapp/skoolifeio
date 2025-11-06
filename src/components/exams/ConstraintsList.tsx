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
    <div className="h-full overflow-y-auto px-safe pt-safe pb-safe">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Mes contraintes</h1>
        <p className="text-sm text-muted-foreground">Tes disponibilités et contraintes</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Contraintes enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {constraints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-base">
              Aucune contrainte enregistrée. Ajoute ta première contrainte !
            </p>
          ) : (
            <div className="space-y-3">
              {constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <div className="flex-1 pr-3">
                    <h3 className="font-semibold text-base">{getConstraintLabel(constraint.type)}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConstraint(constraint.id)}
                    className="flex-shrink-0 min-h-[48px] min-w-[48px]"
                  >
                    <Trash2 className="h-5 w-5" />
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
