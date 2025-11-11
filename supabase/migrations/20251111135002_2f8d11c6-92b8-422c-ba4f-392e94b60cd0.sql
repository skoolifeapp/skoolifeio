-- Supprimer la table d'exceptions qui n'est pas nécessaire
DROP TABLE IF EXISTS public.recurring_event_exceptions CASCADE;

-- Ajouter un champ pour lier les occurrences entre elles
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS parent_recurring_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE;