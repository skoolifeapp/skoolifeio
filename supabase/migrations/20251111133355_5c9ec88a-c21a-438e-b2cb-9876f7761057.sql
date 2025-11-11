-- Ajouter une table pour les exceptions d'occurrences récurrentes
CREATE TABLE IF NOT EXISTS public.recurring_event_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  new_event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_event_id, exception_date)
);

-- Enable RLS
ALTER TABLE public.recurring_event_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own exceptions" 
ON public.recurring_event_exceptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exceptions" 
ON public.recurring_event_exceptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exceptions" 
ON public.recurring_event_exceptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exceptions" 
ON public.recurring_event_exceptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recurring_event_exceptions_updated_at
BEFORE UPDATE ON public.recurring_event_exceptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();