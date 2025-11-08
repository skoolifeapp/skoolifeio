-- Table pour stocker les exceptions des événements récurrents
CREATE TABLE IF NOT EXISTS public.event_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'work_schedule', 'activity', 'routine_moment'
  source_id UUID NOT NULL,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL, -- 'deleted' ou 'modified'
  modified_data JSONB, -- Nouvelles données si modified
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_event_exceptions_user_date ON public.event_exceptions(user_id, exception_date);
CREATE INDEX idx_event_exceptions_source ON public.event_exceptions(source_type, source_id);

-- Enable RLS
ALTER TABLE public.event_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own event exceptions"
  ON public.event_exceptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_event_exceptions_updated_at
  BEFORE UPDATE ON public.event_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();