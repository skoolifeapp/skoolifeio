import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, GraduationCap, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { signOut, user } = useAuth();
  
  const handleSave = () => {
    console.log('Profile saved');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-[100dvh] safe-area-inset-bottom px-safe pt-safe py-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-1">Profil</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Gère tes informations personnelles
        </p>

        {/* Profile Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[var(--shadow-medium)]">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        {/* Profile Information */}
        <Card className="p-4 mb-4 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
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
                value={user?.email || ''}
                disabled
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
            className="w-full mt-4"
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>

        {/* Statistics Card */}
        <Card className="p-4 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold mb-3">Statistiques</h2>
          
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
