-- 1. Créer le nouveau type enum pour source
CREATE TYPE event_source AS ENUM ('school', 'work', 'alternance', 'job', 'sport', 'activity', 'routine', 'other');

-- 2. Ajouter les nouvelles colonnes à calendar_events
ALTER TABLE calendar_events 
  ADD COLUMN source event_source,
  ADD COLUMN start_time TIME,
  ADD COLUMN end_time TIME,
  ADD COLUMN days_of_week INTEGER[],
  ADD COLUMN is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN is_active BOOLEAN DEFAULT true;

-- 3. Migrer les données existantes de type vers source
UPDATE calendar_events 
SET source = CASE 
  WHEN type = 'school' THEN 'school'::event_source
  WHEN type = 'work' THEN 'work'::event_source
  WHEN type = 'sport' THEN 'sport'::event_source
  WHEN type = 'others' THEN 'other'::event_source
  ELSE 'other'::event_source
END;

-- 4. Regrouper les occurrences similaires en événements récurrents
-- Pour chaque groupe d'événements similaires (même titre, même heure, même user)
WITH recurring_patterns AS (
  SELECT 
    user_id,
    title,
    location,
    EXTRACT(HOUR FROM start_date)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM start_date)::TEXT, 2, '0') as start_time_str,
    EXTRACT(HOUR FROM end_date)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM end_date)::TEXT, 2, '0') as end_time_str,
    source,
    metadata,
    ARRAY_AGG(DISTINCT EXTRACT(DOW FROM start_date)::INTEGER ORDER BY EXTRACT(DOW FROM start_date)::INTEGER) as days,
    MIN(start_date::DATE) as first_occurrence,
    COUNT(*) as occurrence_count,
    ARRAY_AGG(id) as occurrence_ids
  FROM calendar_events
  WHERE source IN ('work'::event_source, 'sport'::event_source, 'other'::event_source)
    AND is_recurring IS NOT TRUE
  GROUP BY user_id, title, location, start_time_str, end_time_str, source, metadata
  HAVING COUNT(*) > 1
)
-- Marquer les occurrences qui font partie d'un pattern récurrent
UPDATE calendar_events ce
SET 
  is_recurring = true,
  start_time = rp.start_time_str::TIME,
  end_time = rp.end_time_str::TIME,
  days_of_week = rp.days
FROM recurring_patterns rp
WHERE ce.id = ANY(rp.occurrence_ids);

-- 5. Pour les événements non-récurrents (occurrence unique), extraire aussi start_time/end_time
UPDATE calendar_events
SET 
  start_time = (start_date::TIME),
  end_time = (end_date::TIME)
WHERE source IN ('work'::event_source, 'sport'::event_source, 'other'::event_source)
  AND start_time IS NULL;

-- 6. Rendre source obligatoire maintenant que les données sont migrées
ALTER TABLE calendar_events 
  ALTER COLUMN source SET NOT NULL;

-- 7. Supprimer l'ancienne colonne type
ALTER TABLE calendar_events DROP COLUMN type;

-- 8. Créer un index pour améliorer les performances
CREATE INDEX idx_calendar_events_source ON calendar_events(source);
CREATE INDEX idx_calendar_events_recurring ON calendar_events(user_id, is_recurring) WHERE is_recurring = true;