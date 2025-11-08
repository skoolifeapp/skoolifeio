import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommuteTabProps {
  commuteHomeSchool: number;
  commuteHomeJob: number;
  commuteHomeActivity: number;
  hasAlternance: boolean;
  hasJob: boolean;
  hasActivities: boolean;
  onCommuteHomeSchoolChange: (value: number) => void;
  onCommuteHomeJobChange: (value: number) => void;
  onCommuteHomeActivityChange: (value: number) => void;
}

export const CommuteTab = ({
  commuteHomeSchool,
  commuteHomeJob,
  commuteHomeActivity,
  hasAlternance,
  hasJob,
  hasActivities,
  onCommuteHomeSchoolChange,
  onCommuteHomeJobChange,
  onCommuteHomeActivityChange,
}: CommuteTabProps) => {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Temps de trajet</h3>
          <p className="text-xs text-muted-foreground">Pour bloquer les temps morts imposés</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Domicile ↔ École (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={commuteHomeSchool}
              onChange={(e) => onCommuteHomeSchoolChange(parseInt(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>

          {hasAlternance && (
            <div>
              <Label className="text-sm">Domicile ↔ Alternance (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={commuteHomeJob}
                onChange={(e) => onCommuteHomeJobChange(parseInt(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
          )}

          {hasJob && (
            <div>
              <Label className="text-sm">Domicile ↔ Job (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={commuteHomeJob}
                onChange={(e) => onCommuteHomeJobChange(parseInt(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
          )}

          {hasActivities && (
            <div>
              <Label className="text-sm">Domicile ↔ Activité principale (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={commuteHomeActivity}
                onChange={(e) => onCommuteHomeActivityChange(parseInt(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
