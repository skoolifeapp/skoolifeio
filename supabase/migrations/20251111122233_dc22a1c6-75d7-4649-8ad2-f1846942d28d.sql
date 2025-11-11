-- Add commutes column to user_constraints_profile table
ALTER TABLE public.user_constraints_profile
ADD COLUMN IF NOT EXISTS commutes jsonb DEFAULT '[]'::jsonb;