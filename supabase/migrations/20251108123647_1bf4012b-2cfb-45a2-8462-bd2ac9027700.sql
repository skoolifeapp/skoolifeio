-- Drop old constraint_events if exists and create new structure
DROP TABLE IF EXISTS public.constraint_events CASCADE;

-- Table for work schedules (alternance & job)
CREATE TABLE public.work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('alternance', 'job', 'other')),
  title TEXT,
  days TEXT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly')),
  hours_per_week INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own work schedules"
ON public.work_schedules
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table for activities (sport, asso, cours, projet)
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sport', 'asso', 'cours', 'projet', 'autre')),
  title TEXT NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own activities"
ON public.activities
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table for routine moments (famille, couple, religion, etc)
CREATE TABLE public.routine_moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own routine moments"
ON public.routine_moments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update user_constraints_profile with new fields
ALTER TABLE public.user_constraints_profile
ADD COLUMN IF NOT EXISTS wake_up_time TIME DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS sleep_hours_needed NUMERIC DEFAULT 8,
ADD COLUMN IF NOT EXISTS min_personal_time_per_week INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS other_constraints_notes TEXT,
ADD COLUMN IF NOT EXISTS commute_home_activity INTEGER DEFAULT 0;

-- Add triggers for updated_at
CREATE TRIGGER update_work_schedules_updated_at
BEFORE UPDATE ON public.work_schedules
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_routine_moments_updated_at
BEFORE UPDATE ON public.routine_moments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();