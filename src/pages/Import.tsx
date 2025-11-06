import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, CheckCircle2, FileText } from "lucide-react";
import ICAL from "ical.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Import = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.ics')) {
        setFile(selectedFile);
      } else {
        console.error('Invalid file format');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.ics')) {
        setFile(droppedFile);
      } else {
        console.error('Invalid file format');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !user) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const jcalData = ICAL.parse(text);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const events = vevents.map((vevent: any) => {
        const event = new ICAL.Event(vevent);
        return {
          user_id: user.id,
          summary: event.summary,
          start_date: event.startDate.toJSDate().toISOString(),
          end_date: event.endDate.toJSDate().toISOString(),
          location: event.location || null,
          description: event.description || null,
        };
      });

      // Delete existing events for this user before importing new ones
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting old events:', deleteError);
        toast.error("Erreur lors de la suppression des anciens événements");
        return;
      }

      // Insert new events into Supabase
      const { error: insertError } = await supabase
        .from('calendar_events')
        .insert(events);

      if (insertError) {
        console.error('Error inserting events:', insertError);
        toast.error("Erreur lors de l'importation des événements");
        return;
      }

      toast.success("Calendrier importé avec succès", {
        description: `${events.length} événements importés.`,
      });
      
      navigate('/planning');
    } catch (error) {
      console.error('Error parsing ICS file:', error);
      toast.error("Erreur lors de la lecture du fichier .ics");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen safe-area-inset-bottom px-safe pt-safe">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Import .ics</h1>
        <p className="text-muted-foreground mb-8">
          Importe ton emploi du temps universitaire
        </p>

        <Card
          className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
            isDragging
              ? "border-primary bg-secondary scale-105"
              : file
              ? "border-primary bg-secondary/50"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{file.name}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Fichier prêt à être importé
              </p>
              <Button
                variant="outline"
                onClick={() => setFile(null)}
                className="mb-2"
              >
                Changer de fichier
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <Upload className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Dépose ton fichier .ics ici
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                ou clique pour parcourir
              </p>
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Sélectionner un fichier</span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".ics"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </Card>

        {file && (
          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={isImporting}
          >
            {isImporting ? 'Importation en cours...' : 'Valider l\'import'}
          </Button>
        )}

        <div className="mt-8 p-4 bg-muted rounded-xl">
          <h3 className="font-semibold mb-2 text-sm">💡 Astuce</h3>
          <p className="text-xs text-muted-foreground">
            Tu peux télécharger ton emploi du temps .ics depuis ton ENT universitaire (Celcat, ADE, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Import;
