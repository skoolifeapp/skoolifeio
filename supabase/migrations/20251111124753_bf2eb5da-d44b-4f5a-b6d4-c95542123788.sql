-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_constraints_profile table
CREATE TABLE IF NOT EXISTS public.user_constraints_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wake_up_time TIME NOT NULL DEFAULT '07:00',
  no_study_after TIME NOT NULL DEFAULT '22:00',
  sleep_hours_needed NUMERIC NOT NULL DEFAULT 8,
  min_personal_time_per_week INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_constraints_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own constraints profile" 
ON public.user_constraints_profile 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own constraints profile" 
ON public.user_constraints_profile 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own constraints profile" 
ON public.user_constraints_profile 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own constraints profile" 
ON public.user_constraints_profile 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_constraints_profile_updated_at
BEFORE UPDATE ON public.user_constraints_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();