-- Add revision constraint columns to user_rest_and_revisions
ALTER TABLE user_rest_and_revisions
ADD COLUMN IF NOT EXISTS max_sessions_per_day integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_session_duration_minutes integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS weekly_hours_goal numeric DEFAULT 10;