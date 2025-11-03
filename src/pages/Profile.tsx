import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, GraduationCap, Settings } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const handleSave = () => {
    toast.success("Profil sauvegardé !");
  };

  return (
    <div className="min-h-screen pb-20 px-6 pt-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Profil</h1>
        <p className="text-muted-foreground mb-8">
          Gère tes informations personnelles
        </p>

        {/* Profile Avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[var(--shadow-medium)]">
            <User className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>

        {/* Profile Information */}
        <Card className="p-6 mb-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Informations
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom complet
              </Label>
              <Input
                id="name"
                placeholder="Jean Dupont"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@university.fr"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="university" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Université
              </Label>
              <Input
                id="university"
                placeholder="Université Paris-Saclay"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="year">Année d'études</Label>
              <Input
                id="year"
                placeholder="L2 Informatique"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            variant="default"
            className="w-full mt-6"
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </Card>

        {/* Statistics Card */}
        <Card className="p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-secondary rounded-xl">
              <p className="text-3xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground mt-1">Examens</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-xl">
              <p className="text-3xl font-bold text-primary">45h</p>
              <p className="text-xs text-muted-foreground mt-1">Révisions</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-xl">
              <p className="text-3xl font-bold text-primary">8</p>
              <p className="text-xs text-muted-foreground mt-1">Semaines</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-xl">
              <p className="text-3xl font-bold text-primary">95%</p>
              <p className="text-xs text-muted-foreground mt-1">Assiduité</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
