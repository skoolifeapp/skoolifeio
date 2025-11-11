-- Drop and recreate user_constraints_profile table with simplified structure
DROP TABLE IF EXISTS public.user_constraints_profile;

CREATE TABLE public.user_constraints_profile (
  user_id uuid NOT NULL PRIMARY KEY,
  wake_up_time time NOT NULL DEFAULT '07:00:00',
  no_study_after time NOT NULL DEFAULT '22:00:00',
  sleep_hours_needed integer NOT NULL DEFAULT 8,
  min_personal_time_per_week integer NOT NULL DEFAULT 5,
  meals jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_constraints_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.user_constraints_profile
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON public.user_constraints_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_constraints_profile
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.user_constraints_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();