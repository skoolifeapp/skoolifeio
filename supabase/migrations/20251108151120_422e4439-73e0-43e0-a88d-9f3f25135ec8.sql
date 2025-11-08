-- Ajouter une contrainte unique pour éviter les doublons d'exceptions
ALTER TABLE public.event_exceptions
ADD CONSTRAINT unique_event_exception 
UNIQUE (user_id, source_type, source_id, exception_date);