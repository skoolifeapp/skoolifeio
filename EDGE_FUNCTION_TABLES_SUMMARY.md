# Résumé des tables récupérées par l'Edge Function generate-revision-plan

Voici le résumé détaillé des tables récupérées par l'Edge Function `generate-revision-plan` :

## 📚 1. EXAMS (Examens)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **subject** : Matière
- **date** : Date de l'examen
- **type** : Type d'examen
- **coefficient** : Coefficient (qui est la moyenne de priorité et difficulté)
- **is_done** : Examen passé ou non
- **created_at / updated_at** : Dates de création/modification

## 📅 2. CALENDAR_EVENTS (Événements du calendrier)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **start_date** : Date/heure de début
- **end_date** : Date/heure de fin
- **created_at / updated_at** : Dates de création/modification

## ⚙️ 3. USER_CONSTRAINTS_PROFILE (Profil de contraintes utilisateur)

- **user_id** : ID de l'utilisateur
- **wake_up_time** : Heure de lever
- **sleep_hours_needed** : Heures de sommeil nécessaires
- **no_study_before** : Ne pas réviser avant cette heure
- **no_study_after** : Ne plus réviser après cette heure
- **breakfast_start / breakfast_end** : Horaires petit-déjeuner
- **lunch_break_start / lunch_break_end** : Horaires déjeuner
- **dinner_break_start / dinner_break_end** : Horaires dîner
- **max_daily_revision_hours** : Max heures révision/jour
- **max_weekly_revision_hours** : Max heures révision/semaine
- **min_free_evenings_per_week** : Min soirées libres/semaine
- **min_personal_time_per_week** : Min temps perso/semaine
- **no_study_days** : Jours sans révisions
- **preferred_productivity** : Productivité préférée (matin/après-midi/soir/mixte)
- **respect_meal_times** : Respecter les horaires de repas
- **commute_home_school / commute_home_job / commute_home_sport / commute_home_activity** : Temps de trajet (en minutes)
- **is_alternant / has_student_job** : Statuts alternance/job étudiant

## 💼 4. WORK_SCHEDULES (Horaires de travail)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **days** : Jours de la semaine (array)
- **start_time** : Heure de début
- **end_time** : Heure de fin
- **start_date** : Date de début
- **frequency** : Fréquence
- **hours_per_week** : Heures par semaine
- **location** : Lieu

## 🏃 5. ACTIVITIES (Activités)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **days** : Jours de la semaine (array)
- **start_time** : Heure de début
- **end_time** : Heure de fin

## 🔄 6. ROUTINE_MOMENTS (Moments de routine)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **days** : Jours de la semaine (array)
- **start_time** : Heure de début
- **end_time** : Heure de fin

## ❌ 7. EVENT_EXCEPTIONS (Exceptions d'événements)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **source_id** : ID de l'événement source
- **source_type** : Type de source
- **exception_date** : Date de l'exception
- **exception_type** : Type d'exception (deleted/modified)
- **modified_data** : Données modifiées (JSON)

## 📌 8. PLANNED_EVENTS (Événements planifiés)

- **id** : Identifiant unique
- **user_id** : ID de l'utilisateur
- **title** : Titre
- **start_time** : Heure de début
- **end_time** : Heure de fin
- **color** : Couleur personnalisée

## 👤 9. PROFILES (Profils utilisateurs)

- **id** : Identifiant unique

---

Toutes ces données sont ensuite agrégées pour créer un contexte complet envoyé à l'IA qui génère les sessions de révision optimales.
