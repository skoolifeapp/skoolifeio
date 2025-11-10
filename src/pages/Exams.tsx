import { useState, useEffect } from "react";
import { Plus, Calendar, AlertTriangle, TrendingUp, CheckCircle2, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigationState } from "@/contexts/NavigationStateContext";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isFuture, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: number;
  type?: string;
  location?: string;
  coefficient?: number;
  difficulty?: number;
  notes?: string;
  is_done?: boolean;
}

const Exams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { state, setExamsFilter } = useNavigationState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'all' | 'past' | 'high'>(state.exams.activeFilter);
  const [newExam, setNewExam] = useState({
    subject: "",
    date: "",
    priority: 3,
    type: "partiel",
    location: "",
    coefficient: "",
    difficulty: 3,
    notes: "",
  });

  // Charger les examens directement avec React Query
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error('Error loading exams:', error);
        toast.error("Erreur lors du chargement des examens");
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });

  const refetchExams = () => {
    queryClient.invalidateQueries({ queryKey: ["exams", user?.id] });
  };

  const removeExam = async (id: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    refetchExams();
  };

  const toggleDone = async (exam: Exam) => {
    const { error } = await supabase
      .from('exams')
      .update({ is_done: !exam.is_done })
      .eq('id', exam.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    refetchExams();
  };

  const handleAddExam = async () => {
    if (!user || !newExam.subject || !newExam.date) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const { error } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        subject: newExam.subject,
        date: newExam.date,
        priority: newExam.priority,
        type: newExam.type,
        location: newExam.location || null,
        coefficient: newExam.coefficient ? parseFloat(newExam.coefficient) : null,
        difficulty: newExam.difficulty,
        notes: newExam.notes || null,
      });

    if (error) {
      console.error('Error adding exam:', error);
      toast.error("Erreur lors de l'ajout de l'examen");
      return;
    }

    setIsDialogOpen(false);
    setNewExam({
      subject: "",
      date: "",
      priority: 3,
      type: "partiel",
      location: "",
      coefficient: "",
      difficulty: 3,
      notes: "",
    });
    
    refetchExams();
  };

  const getCountdown = (dateStr: string) => {
    const examDate = new Date(dateStr);
    if (isToday(examDate)) return "Aujourd'hui";
    if (isPast(examDate)) return "Terminé";
    const days = differenceInDays(examDate, new Date());
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  };

  const getUrgencyScore = (exam: Exam) => {
    const priority = exam.priority || 3;
    const difficulty = exam.difficulty || 3;
    return (priority + difficulty) / 2;
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 4) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (score >= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 4.5) return 'Très urgent';
    if (score >= 3.5) return 'Urgent';
    if (score >= 2.5) return 'Modéré';
    if (score >= 1.5) return 'Faible';
    return 'Très faible';
  };

  const upcomingExams = exams
    .filter(e => isFuture(new Date(e.date)))
    .sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
  const nextExam = upcomingExams[0];

  const filteredExams = exams.filter(exam => {
    const examDate = new Date(exam.date);
    switch (activeFilter) {
      case 'upcoming':
        return isFuture(examDate);
      case 'past':
        return isPast(examDate);
      case 'high':
        return getUrgencyScore(exam) >= 4;
      case 'all':
      default:
        return true;
    }
  }).sort((a, b) => {
    const urgencyDiff = getUrgencyScore(b) - getUrgencyScore(a);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const stats = {
    total: exams.length,
    upcoming: upcomingExams.length,
    high: exams.filter(e => getUrgencyScore(e) >= 4).length,
    done: exams.filter(e => e.is_done).length,
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEE', { locale: fr }).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe">
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Chargement des examens...</p>
        </div>
      )}

      {!isLoading && (
        <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Stats Overview */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">Mes examens</h1>
            <p className="text-sm text-muted-foreground">Visualise, priorise et prépare chaque épreuve sans stress.</p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">À venir</p>
                  <p className="text-2xl font-bold text-primary">{stats.upcoming}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Haute priorité</p>
                  <p className="text-2xl font-bold text-destructive">{stats.high}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Révisés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="lg"
            className="rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un examen
          </Button>
        </div>
        {/* Prochain examen */}
        {nextExam && (
          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Prochain examen</p>
                  <h3 className="text-2xl font-bold mb-2">{nextExam.subject}</h3>
                  <p className="text-muted-foreground mb-3">
                    {format(new Date(nextExam.date), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={getUrgencyColor(getUrgencyScore(nextExam))}>
                      Urgence: {getUrgencyScore(nextExam).toFixed(1)}/5 · {getUrgencyLabel(getUrgencyScore(nextExam))}
                    </Badge>
                    <Badge variant="outline" className="font-semibold">
                      {getCountdown(nextExam.date)}
                    </Badge>
                  </div>
                </div>
                <Calendar className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}


        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'upcoming', label: 'À venir' },
            { key: 'all', label: 'Tous' },
            { key: 'past', label: 'Passés' },
            { key: 'high', label: 'Haute priorité' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                const filterKey = filter.key as 'upcoming' | 'all' | 'past' | 'high';
                setActiveFilter(filterKey);
                setExamsFilter(filterKey);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Liste d'examens */}
        <div className="space-y-3">
          {filteredExams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Aucun examen dans cette catégorie</p>
              </CardContent>
            </Card>
          ) : (
            filteredExams.map((exam) => (
              <Card key={exam.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Jour */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{getDayLabel(exam.date)}</span>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1">{exam.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(new Date(exam.date), "d MMM yyyy", { locale: fr })}
                        {exam.location && ` · ${exam.location}`}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {exam.type || 'Partiel'}
                        </Badge>
                        {exam.coefficient && (
                          <Badge variant="outline" className="text-xs">
                            Coef. {exam.coefficient}
                          </Badge>
                        )}
                        <Badge className={getUrgencyColor(getUrgencyScore(exam))}>
                          Urgence: {Math.round(getUrgencyScore(exam))}/5
                        </Badge>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {getCountdown(exam.date)}
                        </Badge>
                        {exam.is_done && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            ✓ Révision OK
                          </Badge>
                        )}
                      </div>

                      {/* Notes */}
                      {exam.notes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3 mb-3">
                          {exam.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={exam.is_done ? "outline" : "default"}
                          onClick={() => toggleDone(exam)}
                          className="text-xs"
                        >
                          {exam.is_done ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Fait
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Marquer terminé
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExam(exam.id)}
                          className="text-xs text-destructive hover:text-destructive"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Drawer Ajout */}
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Nouvel examen</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-8 overflow-y-auto">
            <div>
              <Label htmlFor="subject">Matière *</Label>
              <Input
                id="subject"
                placeholder="Ex: Mathématiques"
                value={newExam.subject}
                onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="date">Date de l'examen *</Label>
              <Input
                id="date"
                type="date"
                value={newExam.date}
                onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={newExam.type}
                onValueChange={(value) => setNewExam({ ...newExam, type: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="dossier">Dossier</SelectItem>
                  <SelectItem value="projet">Projet</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité: {newExam.priority}/5</Label>
              <Slider
                id="priority"
                min={1}
                max={5}
                step={1}
                value={[newExam.priority]}
                onValueChange={([value]) => setNewExam({ ...newExam, priority: value })}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Faible</span>
                <span>Élevée</span>
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulté: {newExam.difficulty}/5</Label>
              <Slider
                id="difficulty"
                min={1}
                max={5}
                step={1}
                value={[newExam.difficulty]}
                onValueChange={([value]) => setNewExam({ ...newExam, difficulty: value })}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Facile</span>
                <span>Difficile</span>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Score d'urgence: <span className="font-bold text-foreground">{((newExam.priority + newExam.difficulty) / 2).toFixed(1)}/5</span>
              </p>
            </div>

            <Button onClick={handleAddExam} className="w-full" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer l'examen
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
        </>
      )}
    </div>
  );
};

export default Exams;
