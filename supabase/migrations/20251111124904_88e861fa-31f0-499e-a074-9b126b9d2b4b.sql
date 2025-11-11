-- Modifier la table user_constraints_profile pour permettre des valeurs NULL
ALTER TABLE public.user_constraints_profile 
  ALTER COLUMN wake_up_time DROP DEFAULT,
  ALTER COLUMN wake_up_time DROP NOT NULL,
  ALTER COLUMN no_study_after DROP DEFAULT,
  ALTER COLUMN no_study_after DROP NOT NULL,
  ALTER COLUMN sleep_hours_needed DROP DEFAULT,
  ALTER COLUMN sleep_hours_needed DROP NOT NULL,
  ALTER COLUMN min_personal_time_per_week SET DEFAULT 0;