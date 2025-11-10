# 📅 Types d'événements Skoolife - Récapitulatif

## Événements affichés sur le Planning

### 🔵 BLEU - Travail (work_schedules)
**Source de données** : `work_schedules` table

#### 1. Alternance
- **Rythmes disponibles** :
  - `2j_3j` : 2 jours école / 3 jours entreprise
  - `3j_2j` : 3 jours école / 2 jours entreprise
  - `1sem_1sem` : 1 semaine école / 1 semaine entreprise
  - `1sem_2sem` : 1 semaine école / 2 semaines entreprise
- **Champs supplémentaires** :
  - `start_date` : Date de départ (optionnel)
  - `company_name` : Nom de l'entreprise (optionnel)
- **Couleur** : `bg-blue-500/90 border-blue-600`
- **Modifiable** : Oui, fixé dans Contraintes mais modifiable/ajout able sur Planning

#### 2. Job étudiant
- **Utilisation** : Horaires fixes mais ajustables
- **Couleur** : `bg-blue-500/90 border-blue-600`
- **Modifiable** : Oui, sur le Planning directement

#### 3. Autres engagements
- Stages, missions, projets, etc.
- **Couleur** : `bg-blue-500/90 border-blue-600`
- **Modifiable** : Oui, sur le Planning directement

---

### 🟢 VERT - Activités (activities)
**Source de données** : `activities` table

- **Types** : Sport, associations, cours, projets personnels, autres
- **Couleur** : `bg-green-500/90 border-green-600`
- **Modifiable** : Oui, fixé dans Contraintes mais modifiable/ajout able sur Planning

---

### 🔴 ROUGE - Moments de routine (routine_moments)
**Source de données** : `routine_moments` table

- **Types** : Moments familles/couples réguliers
- **Couleur** : `bg-red-500/90 border-red-600`
- **Modifiable** : Oui, fixé dans Contraintes mais modifiable/ajout able sur Planning
- **Note** : Inclut les horaires de repas habituels (gérés dans `user_constraints_profile`)

---

### 🟣 VIOLET - Sessions de révision (revision_sessions)
**Source de données** : `revision_sessions` table

- **Génération** : Automatique par l'IA
- **Couleur** : `bg-indigo-500/90 border-indigo-600`
- **Liées aux** : Examens (`exams` table)
- **Modifiable** : Oui, modifiable et supprimable

---

### 🔴 ROUGE - Examens (exams)
**Source de données** : `exams` table

- **Couleur** : Rouge (couleur exacte à vérifier dans Planning.tsx)
- **Modifiable** : Oui

---

### 🔵 BLEU - Événements de calendrier (calendar_events)
**Source de données** : `calendar_events` table

- **Import** : Fichiers ICS
- **Couleur** : `bg-primary text-primary-foreground`
- **Modifiable** : Oui

---

### 🎨 PERSONNALISABLE - Événements planifiés (planned_events)
**Source de données** : `planned_events` table

- **Ajout** : Manuel sur le Planning
- **Couleur** : Personnalisable, défaut `#3b82f6` (bleu)
- **Modifiable** : Oui

---

## 🔒 Données internes (non affichées sur Planning)

### ⏰ Rythme de base
**Source** : `user_constraints_profile` table
- Heure de lever habituelle
- Heure de coucher habituelle
- Ne plus réviser après...
- Heures de sommeil souhaitées

### 🍽️ Horaires de repas
**Source** : `user_constraints_profile` table
- `breakfast_start` / `breakfast_end` : Petit-déjeuner
- `lunch_break_start` / `lunch_break_end` : Déjeuner
- `dinner_break_start` / `dinner_break_end` : Dîner

### 🚗 Temps de trajet
**Source** : `user_constraints_profile` table
- `commute_home_school` : Temps Domicile ↔ École
- `commute_home_job` : Temps Domicile ↔ Travail
- `commute_home_activity` : Temps Domicile ↔ Activités

**Logique** : Les trajets sont inclus dans les calculs de disponibilité mais **non affichés** sur le planning visuel.

**Exemple** : 
- Sport de 17h30 à 19h avec 30 min de trajet
- **Affiché sur Planning** : 17h30 - 19h
- **En data interne** : 17h - 19h30 (inclut le trajet)

### 📊 Contraintes générales
**Source** : `user_constraints_profile` table
- Temps perso minimum sans révisions par semaine (`min_personal_time_per_week`)
- Jours sans étude (`no_study_days`)
- Heures de révision max par jour/semaine
- Respect des horaires de repas (`respect_meal_times`)

---

## 🎨 Palette de couleurs

| Événement | Couleur CSS | Utilisation |
|-----------|------------|-------------|
| Travail (tous types) | `bg-blue-500/90 border-blue-600` | Alternance, Job, Autres |
| Activités | `bg-green-500/90 border-green-600` | Sport, Assos, etc. |
| Routine | `bg-red-500/90 border-red-600` | Moments famille/couple |
| Révisions | `bg-indigo-500/90 border-indigo-600` | Sessions IA |
| Calendrier | `bg-primary text-primary-foreground` | Imports ICS |
| Événements planifiés | Personnalisable | Par défaut `#3b82f6` |

---

## 🔄 Gestion des exceptions

**Source** : `event_exceptions` table

Les événements récurrents (travail, activités, routine) peuvent avoir des exceptions :
- `deleted` : Occurrence supprimée pour une date spécifique
- `modified` : Occurrence modifiée pour une date spécifique

---

*Dernière mise à jour : Janvier 2025*
