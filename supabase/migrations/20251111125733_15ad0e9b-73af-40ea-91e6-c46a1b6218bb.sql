-- Supprimer les colonnes inutiles de la table exams
ALTER TABLE public.exams 
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS is_done;

-- Renommer les colonnes pour correspondre aux noms souhaités
-- subject -> subject (déjà correct)
-- date -> date (déjà correct)
-- type -> type (déjà correct)
-- priority -> priority (déjà correct)
-- difficulty -> difficulty (déjà correct)
-- coefficient -> coefficient (déjà correct)

-- S'assurer que toutes les colonnes ont les bons types et contraintes
ALTER TABLE public.exams 
  ALTER COLUMN subject SET NOT NULL,
  ALTER COLUMN date SET NOT NULL,
  ALTER COLUMN priority SET NOT NULL,
  ALTER COLUMN difficulty SET NOT NULL,
  ALTER COLUMN coefficient SET NOT NULL;