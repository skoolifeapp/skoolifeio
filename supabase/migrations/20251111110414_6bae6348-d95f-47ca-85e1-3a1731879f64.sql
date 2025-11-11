-- Ajouter les colonnes nécessaires à calendar_events pour supporter tous les types d'événements
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'school',
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS start_time time without time zone,
  ADD COLUMN IF NOT EXISTS end_time time without time zone,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Rendre summary, start_date et end_date nullables
-- Pour les événements récurrents, on utilise start_time/end_time au lieu de start_date/end_date
ALTER TABLE calendar_events ALTER COLUMN summary DROP NOT NULL;
ALTER TABLE calendar_events ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE calendar_events ALTER COLUMN end_date DROP NOT NULL;

-- Créer un index sur le type pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_type ON calendar_events(user_id, type);

-- Migrer les données de work_schedules vers calendar_events
INSERT INTO calendar_events (
  user_id,
  type,
  is_recurring,
  days,
  start_time,
  end_time,
  title,
  summary,
  location,
  metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'work' as type,
  true as is_recurring,
  days,
  start_time,
  end_time,
  COALESCE(title, company_name, 'Travail') as title,
  COALESCE(title, company_name, 'Travail') as summary,
  location,
  jsonb_build_object(
    'work_type', type,
    'company_name', company_name,
    'alternance_rhythm', alternance_rhythm,
    'frequency', frequency,
    'hours_per_week', hours_per_week,
    'start_date', start_date
  ) as metadata,
  created_at,
  updated_at
FROM work_schedules;

-- Migrer les données de activities vers calendar_events
INSERT INTO calendar_events (
  user_id,
  type,
  is_recurring,
  days,
  start_time,
  end_time,
  title,
  summary,
  location,
  metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'sport' as type,
  true as is_recurring,
  days,
  start_time,
  end_time,
  title,
  title as summary,
  location,
  jsonb_build_object(
    'activity_type', type
  ) as metadata,
  created_at,
  updated_at
FROM activities;

-- Migrer les données de routine_moments vers calendar_events
INSERT INTO calendar_events (
  user_id,
  type,
  is_recurring,
  days,
  start_time,
  end_time,
  title,
  summary,
  metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'others' as type,
  true as is_recurring,
  days,
  start_time,
  end_time,
  title,
  title as summary,
  '{}'::jsonb as metadata,
  created_at,
  updated_at
FROM routine_moments;

-- Marquer les événements existants (du fichier .ics) comme type 'school' et non-récurrents
UPDATE calendar_events 
SET type = 'school', is_recurring = false, title = summary
WHERE type = 'school' AND title IS NULL;

-- Supprimer les anciennes tables maintenant que les données sont migrées
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS routine_moments CASCADE;