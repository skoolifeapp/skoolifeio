-- Modifier les colonnes de révision pour les rendre nullables sans valeur par défaut
ALTER TABLE user_rest_and_revisions
ALTER COLUMN max_sessions_per_day DROP DEFAULT,
ALTER COLUMN max_sessions_per_day DROP NOT NULL,
ALTER COLUMN max_session_duration_minutes DROP DEFAULT,
ALTER COLUMN max_session_duration_minutes DROP NOT NULL,
ALTER COLUMN weekly_hours_goal DROP DEFAULT,
ALTER COLUMN weekly_hours_goal DROP NOT NULL;