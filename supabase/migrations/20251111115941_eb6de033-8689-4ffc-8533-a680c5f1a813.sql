-- Add commutes column to store commute data as JSONB array
ALTER TABLE user_constraints_profile 
ADD COLUMN commutes JSONB DEFAULT '[]'::jsonb;