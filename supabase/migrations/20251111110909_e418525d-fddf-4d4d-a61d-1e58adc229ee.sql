-- Fonction helper pour générer les occurrences d'un événement récurrent
CREATE OR REPLACE FUNCTION generate_occurrences(
  p_start_time time,
  p_end_time time,
  p_days text[],
  p_months_ahead integer DEFAULT 3
) RETURNS TABLE(occurrence_date date, start_datetime timestamptz, end_datetime timestamptz) AS $$
DECLARE
  v_current_date date := CURRENT_DATE;
  v_end_date date := CURRENT_DATE + (p_months_ahead || ' months')::interval;
  v_day_num int;
  v_day_names text[] := ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
BEGIN
  WHILE v_current_date <= v_end_date LOOP
    -- Obtenir le numéro du jour (1=lundi, 7=dimanche)
    v_day_num := EXTRACT(ISODOW FROM v_current_date);
    
    -- Vérifier si ce jour est dans la liste des jours souhaités
    IF v_day_names[v_day_num] = ANY(p_days) THEN
      occurrence_date := v_current_date;
      start_datetime := (v_current_date || ' ' || p_start_time)::timestamptz;
      end_datetime := (v_current_date || ' ' || p_end_time)::timestamptz;
      RETURN NEXT;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Créer une table temporaire pour stocker les nouvelles occurrences
CREATE TEMP TABLE new_occurrences AS
SELECT 
  e.user_id,
  e.type,
  e.title,
  e.summary,
  e.location,
  e.description,
  e.metadata,
  o.start_datetime as start_date,
  o.end_datetime as end_date
FROM calendar_events e
CROSS JOIN LATERAL generate_occurrences(e.start_time, e.end_time, e.days, 3) o
WHERE e.is_recurring = true AND e.start_time IS NOT NULL AND e.end_time IS NOT NULL;

-- Supprimer les anciens événements récurrents
DELETE FROM calendar_events WHERE is_recurring = true;

-- Insérer les nouvelles occurrences
INSERT INTO calendar_events (
  user_id,
  type,
  title,
  summary,
  location,
  description,
  metadata,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  user_id,
  type,
  title,
  summary,
  location,
  description,
  metadata,
  start_date,
  end_date,
  now(),
  now()
FROM new_occurrences;

-- Rendre start_date et end_date obligatoires maintenant
ALTER TABLE calendar_events ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE calendar_events ALTER COLUMN end_date SET NOT NULL;

-- Supprimer les colonnes de récurrence qui ne sont plus nécessaires
ALTER TABLE calendar_events DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS days;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS start_time;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS end_time;

-- Supprimer la table event_exceptions qui n'est plus nécessaire
DROP TABLE IF EXISTS event_exceptions CASCADE;

-- Nettoyer la fonction helper
DROP FUNCTION IF EXISTS generate_occurrences;