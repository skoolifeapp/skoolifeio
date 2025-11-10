-- Étape 1: Supprimer toutes les contraintes existantes sur priority et difficulty
ALTER TABLE public.exams 
  DROP CONSTRAINT IF EXISTS exams_priority_check,
  DROP CONSTRAINT IF EXISTS exams_difficulty_check;

-- Étape 2: Convertir les données textuelles existantes en valeurs numériques
UPDATE public.exams
SET priority = CASE
  WHEN priority IN ('low', 'faible', 'bas') THEN '1'
  WHEN priority IN ('medium-low') THEN '2'
  WHEN priority IN ('medium', 'moyen') THEN '3'
  WHEN priority IN ('medium-high') THEN '4'
  WHEN priority IN ('high', 'élevé', 'haut', 'haute') THEN '5'
  ELSE priority
END;

UPDATE public.exams
SET difficulty = CASE
  WHEN difficulty IN ('low', 'faible', 'facile') THEN '1'
  WHEN difficulty IN ('medium-low') THEN '2'
  WHEN difficulty IN ('medium', 'moyen') THEN '3'
  WHEN difficulty IN ('medium-high') THEN '4'
  WHEN difficulty IN ('high', 'difficile', 'haut') THEN '5'
  ELSE difficulty
END;

-- Étape 3: Modifier les types de colonnes en integer
ALTER TABLE public.exams 
  ALTER COLUMN priority TYPE integer USING priority::integer,
  ALTER COLUMN difficulty TYPE integer USING difficulty::integer;

-- Étape 4: Ajouter les nouvelles contraintes
ALTER TABLE public.exams 
  ADD CONSTRAINT exams_priority_check CHECK (priority >= 1 AND priority <= 5),
  ADD CONSTRAINT exams_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 5);