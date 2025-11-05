import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, GraduationCap, Camera, BookOpen, Clock, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";

const Profile = () => {
  const [name, setName] = useState("Jean Dupont");
  const [email, setEmail] = useState("jean.dupont@university.fr");
  const [university, setUniversity] = useState("Université Paris-Saclay");
  const [year, setYear] = useState("L2 Informatique");

  const handleSave = () => {
    toast.success("Profil sauvegardé !");
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profil</h1>
        <p className="text-muted-foreground">
          Personnalise ton compte Skoolife
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6 mb-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src="" alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl">
                {name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-[var(--shadow-medium)]">
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground">{year}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{university}</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Examens</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">45h</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Révisions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">8</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Semaines</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">95%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Assiduité</p>
          </div>
        </div>
      </Card>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Total révisions"
          value="45h"
          subtitle="ce mois-ci"
          icon={Clock}
          gradient="from-primary/10 via-primary/5 to-transparent"
          iconColor="text-primary"
        />
        
        <StatCard
          title="Objectif"
          value="80%"
          subtitle="atteint"
          icon={Target}
          gradient="from-green-500/10 via-green-500/5 to-transparent"
          iconColor="text-green-500"
        />
        
        <StatCard
          title="Progression"
          value="+12%"
          subtitle="vs mois dernier"
          icon={TrendingUp}
          gradient="from-blue-500/10 via-blue-500/5 to-transparent"
          iconColor="text-blue-500"
        />
        
        <StatCard
          title="Matières"
          value="6"
          subtitle="actives"
          icon={BookOpen}
          gradient="from-purple-500/10 via-purple-500/5 to-transparent"
          iconColor="text-purple-500"
        />
      </div>

      {/* Profile Information */}
      <Card className="p-6 shadow-[var(--shadow-soft)]">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Informations personnelles</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <User className="h-4 w-4 text-primary" />
              Nom complet
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label htmlFor="university" className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />
              Université
            </Label>
            <Input
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>

          <div>
            <Label htmlFor="year" className="text-sm font-medium text-foreground mb-1.5">
              Année d'études
            </Label>
            <Input
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
        </div>

        <Button
          variant="default"
          className="w-full mt-6 font-semibold"
          onClick={handleSave}
        >
          Enregistrer les modifications
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
