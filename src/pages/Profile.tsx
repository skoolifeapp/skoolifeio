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
    <div className="h-[100dvh] flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] px-safe pt-safe overflow-y-auto scroll-smooth">
      <div className="w-full max-w-md mx-auto">
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
          </div>

          <Button
            variant="default"
            className="w-full mt-6"
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
      </div>
    </div>
  );
};

export default Profile;
