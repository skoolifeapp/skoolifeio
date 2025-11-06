-- Drop existing constraints table to rebuild it properly
DROP TABLE IF EXISTS public.constraints CASCADE;

-- Create enum for constraint event types
CREATE TYPE public.constraint_type AS ENUM (
  'alternance',
  'job',
  'sport',
  'rdv',
  'exception'
);

-- Create table for hard constraints (visible in planning)
CREATE TABLE public.constraint_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type constraint_type NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.constraint_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for constraint_events
CREATE POLICY "Users can view their own constraint events"
ON public.constraint_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own constraint events"
ON public.constraint_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own constraint events"
ON public.constraint_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own constraint events"
ON public.constraint_events FOR DELETE
USING (auth.uid() = user_id);

-- Create table for soft constraints (user preferences)
CREATE TABLE public.user_constraints_profile (
  user_id UUID NOT NULL PRIMARY KEY,
  is_alternant BOOLEAN DEFAULT false,
  has_student_job BOOLEAN DEFAULT false,
  commute_home_school INTEGER DEFAULT 0,
  commute_home_job INTEGER DEFAULT 0,
  commute_home_sport INTEGER DEFAULT 0,
  preferred_productivity TEXT DEFAULT 'mixed',
  max_daily_revision_hours INTEGER DEFAULT 8,
  max_weekly_revision_hours INTEGER DEFAULT 40,
  no_study_days TEXT[] DEFAULT '{}',
  no_study_after TIME DEFAULT '22:00',
  no_study_before TIME DEFAULT '08:00',
  lunch_break_start TIME DEFAULT '12:00',
  lunch_break_end TIME DEFAULT '14:00',
  dinner_break_start TIME DEFAULT '19:00',
  dinner_break_end TIME DEFAULT '20:30',
  respect_meal_times BOOLEAN DEFAULT true,
  min_free_evenings_per_week INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_constraints_profile ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_constraints_profile
CREATE POLICY "Users can view their own profile"
ON public.user_constraints_profile FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.user_constraints_profile FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_constraints_profile FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at on constraint_events
CREATE TRIGGER update_constraint_events_updated_at
BEFORE UPDATE ON public.constraint_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on user_constraints_profile
CREATE TRIGGER update_user_constraints_profile_updated_at
BEFORE UPDATE ON public.user_constraints_profile
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();