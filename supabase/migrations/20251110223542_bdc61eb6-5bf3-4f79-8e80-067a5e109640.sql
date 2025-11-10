-- Ajouter les champs pour l'alternance enrichie dans work_schedules
ALTER TABLE work_schedules 
ADD COLUMN IF NOT EXISTS alternance_rhythm text,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS company_name text;

-- Ajouter un commentaire pour documenter les rythmes d'alternance possibles
COMMENT ON COLUMN work_schedules.alternance_rhythm IS 'Rythme d''alternance: 2j_3j, 3j_2j, 1sem_1sem, 1sem_2sem';

-- Ajouter les champs pour les horaires de repas dans user_constraints_profile
ALTER TABLE user_constraints_profile
ADD COLUMN IF NOT EXISTS breakfast_start time,
ADD COLUMN IF NOT EXISTS breakfast_end time;

-- Mettre à jour les valeurs par défaut des horaires de repas existants si nécessaire
UPDATE user_constraints_profile
SET 
  lunch_break_start = COALESCE(lunch_break_start, '12:00:00'::time),
  lunch_break_end = COALESCE(lunch_break_end, '14:00:00'::time),
  dinner_break_start = COALESCE(dinner_break_start, '19:00:00'::time),
  dinner_break_end = COALESCE(dinner_break_end, '20:30:00'::time)
WHERE lunch_break_start IS NULL 
   OR lunch_break_end IS NULL
   OR dinner_break_start IS NULL
   OR dinner_break_end IS NULL;