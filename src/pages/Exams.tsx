import { useState, useEffect } from "react";
import { Plus, Calendar, AlertTriangle, TrendingUp, CheckCircle2, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isFuture, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface Exam {
  id: string;
  subject: string;
  date: string;
  priority: string;
  type?: string;
  location?: string;
  coefficient?: number;
  difficulty?: string;
  notes?: string;
  is_done?: boolean;
}

const Exams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'all' | 'past' | 'high'>('upcoming');
  const [newExam, setNewExam] = useState({
    subject: "",
    date: "",
    priority: "medium",
    type: "partiel",
    location: "",
    coefficient: "",
    difficulty: "moyen",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (examsError) {
      console.error('Error loading exams:', examsError);
      toast.error("Erreur lors du chargement des examens");
    } else {
      setExams(examsData || []);
    }
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

    setExams(exams.filter(exam => exam.id !== id));
    toast.success("Examen supprimé");
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

    loadData();
    toast.success(exam.is_done ? "Marqué comme non fait" : "Marqué comme terminé");
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
      priority: "medium",
      type: "partiel",
      location: "",
      coefficient: "",
      difficulty: "moyen",
      notes: "",
    });
    loadData();
    toast.success("Examen ajouté avec succès");
  };

  const getCountdown = (dateStr: string) => {
    const examDate = new Date(dateStr);
    if (isToday(examDate)) return "Aujourd'hui";
    if (isPast(examDate)) return "Terminé";
    const days = differenceInDays(examDate, new Date());
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  const getDifficultyEmoji = (difficulty?: string) => {
    switch (difficulty) {
      case 'facile': return '😊';
      case 'moyen': return '😐';
      case 'difficile': return '😰';
      default: return '';
    }
  };

  const upcomingExams = exams.filter(e => isFuture(new Date(e.date)));
  const nextExam = upcomingExams[0];

  const filteredExams = exams.filter(exam => {
    const examDate = new Date(exam.date);
    switch (activeFilter) {
      case 'upcoming':
        return isFuture(examDate);
      case 'past':
        return isPast(examDate);
      case 'high':
        return exam.priority === 'high';
      case 'all':
      default:
        return true;
    }
  });

  const stats = {
    total: exams.length,
    upcoming: upcomingExams.length,
    high: exams.filter(e => e.priority === 'high').length,
    done: exams.filter(e => e.is_done).length,
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEE', { locale: fr }).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe px-safe">
      {/* Header Sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 pt-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mes examens</h1>
            <p className="text-sm text-muted-foreground">Visualise, priorise et prépare chaque épreuve sans stress.</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="icon"
            className="rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Prochain examen */}
        {nextExam && (
          <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Prochain examen</p>
                  <h3 className="text-2xl font-bold mb-2">{nextExam.subject}</h3>
                  <p className="text-muted-foreground mb-3">
                    {format(new Date(nextExam.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(nextExam.priority)}>
                      {getPriorityLabel(nextExam.priority)}
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

        {/* Stats Pills */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              <p className="text-xs text-muted-foreground mt-1">À venir</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.high}</p>
              <p className="text-xs text-muted-foreground mt-1">Priorité haute</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
              <p className="text-xs text-muted-foreground mt-1">Terminés</p>
            </CardContent>
          </Card>
        </div>

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
              onClick={() => setActiveFilter(filter.key as any)}
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
                        {format(new Date(exam.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        {exam.location && ` · ${exam.location}`}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {exam.type || 'Partiel'}
                        </Badge>
                        {exam.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {getDifficultyEmoji(exam.difficulty)} {exam.difficulty}
                          </Badge>
                        )}
                        {exam.coefficient && (
                          <Badge variant="outline" className="text-xs">
                            Coef. {exam.coefficient}
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(exam.priority)}>
                          {getPriorityLabel(exam.priority)}
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

      {/* Dialog Ajout */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel examen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
              <Label htmlFor="date">Date & heure *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={newExam.date}
                onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={newExam.priority}
                  onValueChange={(value) => setNewExam({ ...newExam, priority: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Faible</SelectItem>
                    <SelectItem value="medium">🟡 Moyenne</SelectItem>
                    <SelectItem value="high">🔴 Haute</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Ex: Amphi A, Salle 204..."
                value={newExam.location}
                onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="coefficient">Coefficient</Label>
                <Input
                  id="coefficient"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Ex: 2"
                  value={newExam.coefficient}
                  onChange={(e) => setNewExam({ ...newExam, coefficient: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select
                  value={newExam.difficulty}
                  onValueChange={(value) => setNewExam({ ...newExam, difficulty: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facile">😊 Facile</SelectItem>
                    <SelectItem value="moyen">😐 Moyen</SelectItem>
                    <SelectItem value="difficile">😰 Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes importantes</Label>
              <Textarea
                id="notes"
                placeholder="Chapitres à réviser, conseils du prof, etc."
                value={newExam.notes}
                onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                className="mt-1.5 min-h-[100px]"
              />
            </div>

            <Button onClick={handleAddExam} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer l'examen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exams;
