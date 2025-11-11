-- Mettre à NULL les valeurs de révision existantes pour tous les utilisateurs
UPDATE user_rest_and_revisions
SET 
  max_sessions_per_day = NULL,
  max_session_duration_minutes = NULL,
  weekly_hours_goal = NULL;