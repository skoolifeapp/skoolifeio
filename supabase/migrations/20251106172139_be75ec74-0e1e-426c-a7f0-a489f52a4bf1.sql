-- Add commute_time field to constraints table
ALTER TABLE public.constraints
ADD COLUMN commute_time integer DEFAULT 0;

COMMENT ON COLUMN public.constraints.commute_time IS 'Temps de trajet en minutes (aller simple) - utilisé par l''IA pour optimiser le planning';