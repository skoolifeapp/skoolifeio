-- Extend exams table with additional fields for better planning
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS coefficient numeric,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_done boolean DEFAULT false;