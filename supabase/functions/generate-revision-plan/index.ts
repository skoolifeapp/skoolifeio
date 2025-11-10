import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntensityConfig {
  sessionDuration: { min: number; max: number };
  sessionsPerDay: { min: number; max: number };
  totalHoursTarget: number;
}

const INTENSITY_CONFIGS: Record<string, IntensityConfig> = {
  leger: {
    sessionDuration: { min: 45, max: 90 },
    sessionsPerDay: { min: 1, max: 2 },
    totalHoursTarget: 20,
  },
  standard: {
    sessionDuration: { min: 60, max: 120 },
    sessionsPerDay: { min: 2, max: 4 },
    totalHoursTarget: 40,
  },
  intensif: {
    sessionDuration: { min: 90, max: 150 },
    sessionsPerDay: { min: 3, max: 6 },
    totalHoursTarget: 60,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { intensity = 'standard' } = await req.json();
    const intensityConfig = INTENSITY_CONFIGS[intensity] || INTENSITY_CONFIGS.standard;

    console.log(`[${user.id}] Génération planning avec intensité: ${intensity}`);

    // Récupération de TOUTES les données
    const [examsRes, calendarRes, constraintsRes, workRes, activitiesRes, routineRes, exceptionsRes, plannedRes, profileRes] = await Promise.all([
      supabase.from('exams').select('*').eq('user_id', user.id).order('date'),
      supabase.from('calendar_events').select('*').eq('user_id', user.id),
      supabase.from('user_constraints_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('work_schedules').select('*').eq('user_id', user.id),
      supabase.from('activities').select('*').eq('user_id', user.id),
      supabase.from('routine_moments').select('*').eq('user_id', user.id),
      supabase.from('event_exceptions').select('*').eq('user_id', user.id),
      supabase.from('planned_events').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    if (examsRes.error) throw examsRes.error;
    const exams = examsRes.data || [];

    if (exams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun examen trouvé. Ajoute des examens pour générer un planning.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const lastExamDate = new Date(exams[exams.length - 1].date);
    const constraints = constraintsRes.data || {};
    const profile = profileRes.data || {};

    // Construction du contexte complet
    const context = {
      planning_window: {
        start: now.toISOString(),
        end: lastExamDate.toISOString(),
        days_available: Math.ceil((lastExamDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      },
      exams: exams.map(e => ({
        id: e.id,
        subject: e.subject,
        date: e.date,
        priority: e.priority || 3,
        difficulty: e.difficulty || 3,
        coefficient: e.coefficient || 1,
        type: e.type || 'Partiel',
        location: e.location,
        notes: e.notes,
      })),
      constraints: {
        sleep: {
          wake_up_time: constraints.wake_up_time || '07:00:00',
          sleep_hours_needed: constraints.sleep_hours_needed || 8,
        },
        study_limits: {
          no_study_before: constraints.no_study_before || '08:00:00',
          no_study_after: constraints.no_study_after || '22:00:00',
          no_study_days: constraints.no_study_days || [],
          max_daily_hours: constraints.max_daily_revision_hours || 8,
          max_weekly_hours: constraints.max_weekly_revision_hours || 40,
        },
        meals: {
          respect_meal_times: constraints.respect_meal_times !== false,
          lunch: {
            start: constraints.lunch_break_start || '12:00:00',
            end: constraints.lunch_break_end || '14:00:00',
          },
          dinner: {
            start: constraints.dinner_break_start || '19:00:00',
            end: constraints.dinner_break_end || '20:30:00',
          },
        },
        productivity: {
          preferred_time: constraints.preferred_productivity || 'mixed',
        },
        personal: {
          min_free_evenings_per_week: constraints.min_free_evenings_per_week || 1,
          min_personal_time_per_week: constraints.min_personal_time_per_week || 5,
        },
        work: {
          is_alternant: constraints.is_alternant || false,
          has_student_job: constraints.has_student_job || false,
        },
      },
      busy_slots: {
        calendar_events: (calendarRes.data || []).map(e => ({
          summary: e.summary,
          start: e.start_date,
          end: e.end_date,
          location: e.location,
        })),
        work_schedules: (workRes.data || []).map(w => ({
          id: w.id,
          title: w.title,
          type: w.type,
          days: w.days,
          start_time: w.start_time,
          end_time: w.end_time,
          location: w.location,
        })),
        activities: (activitiesRes.data || []).map(a => ({
          id: a.id,
          title: a.title,
          type: a.type,
          days: a.days,
          start_time: a.start_time,
          end_time: a.end_time,
          location: a.location,
        })),
        routine_moments: (routineRes.data || []).map(r => ({
          id: r.id,
          title: r.title,
          days: r.days,
          start_time: r.start_time,
          end_time: r.end_time,
        })),
        planned_events: (plannedRes.data || []).map(p => ({
          title: p.title,
          start: p.start_time,
          end: p.end_time,
          description: p.description,
        })),
        exceptions: (exceptionsRes.data || []).map(ex => ({
          source_type: ex.source_type,
          source_id: ex.source_id,
          date: ex.exception_date,
          type: ex.exception_type,
          modified_data: ex.modified_data,
        })),
      },
      intensity: {
        level: intensity,
        config: intensityConfig,
      },
      user_profile: {
        name: profile.full_name,
        university: profile.university,
        study_year: profile.study_year,
      },
    };

    console.log(`[${user.id}] Contexte préparé - ${exams.length} examens, ${context.busy_slots.calendar_events.length} événements calendrier`);

    // Appel OpenAI avec extraction structurée
    const systemPrompt = `Tu es un expert en planification de révisions pour étudiants. Ta mission est de créer un planning de révision optimal et personnalisé.

RÈGLES ABSOLUES :
1. JAMAIS de chevauchement entre sessions de révision et créneaux occupés (travail, activités, routine, événements)
2. TOUJOURS respecter les limites de temps d'étude (heures/jour, heures/semaine)
3. TOUJOURS respecter les pauses repas si activées
4. TOUJOURS respecter les jours sans révision
5. Les sessions doivent être dans la fenêtre de planning (du maintenant au dernier examen)
6. Durée des sessions : entre ${intensityConfig.sessionDuration.min} et ${intensityConfig.sessionDuration.max} minutes
7. Sessions par jour : entre ${intensityConfig.sessionsPerDay.min} et ${intensityConfig.sessionsPerDay.max}

STRATÉGIE DE RÉVISION :
- Prioriser les examens selon : (priorité × difficulté × coefficient) / jours_restants
- Espacer les révisions (répétition espacée) : première révision → révision intermédiaire → révision finale
- Plus un examen est proche, plus il faut de sessions courtes et fréquentes
- Alterner les matières pour éviter la fatigue cognitive
- Placer les matières difficiles aux moments de productivité optimale

GESTION DES CRÉNEAUX RÉCURRENTS :
- Les work_schedules, activities, routine_moments se répètent selon leurs "days"
- Vérifier les exceptions : type "deleted" = créneau annulé ce jour-là, type "modified" = créneau modifié (utiliser modified_data)
- Ne JAMAIS placer de session sur un créneau occupé (même récurrent)

FORMAT DE SORTIE :
- Chaque session doit avoir : subject, start_time (ISO), end_time (ISO), exam_id, difficulty (low/medium/high), weight (0-1), type (first_pass/review/final_review), reasoning
- weight = importance de la session (0-1) basée sur priorité/difficulté/proximité examen
- reasoning = explication courte du choix de ce créneau (max 100 chars)`;

    const userPrompt = `Génère un planning de révision personnalisé pour cet étudiant.

CONTEXTE COMPLET :
${JSON.stringify(context, null, 2)}

Crée des sessions de révision optimales qui maximisent l'apprentissage tout en respectant TOUTES les contraintes.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_revision_plan',
            description: 'Crée un planning de révision structuré',
            parameters: {
              type: 'object',
              properties: {
                sessions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      subject: { type: 'string' },
                      start_time: { type: 'string', description: 'ISO 8601 datetime' },
                      end_time: { type: 'string', description: 'ISO 8601 datetime' },
                      exam_id: { type: 'string' },
                      difficulty: { type: 'string', enum: ['low', 'medium', 'high'] },
                      weight: { type: 'number', minimum: 0, maximum: 1 },
                      type: { type: 'string', enum: ['first_pass', 'review', 'final_review'] },
                      reasoning: { type: 'string', maxLength: 100 },
                    },
                    required: ['subject', 'start_time', 'end_time', 'exam_id', 'difficulty', 'weight', 'type', 'reasoning'],
                  },
                },
                metadata: {
                  type: 'object',
                  properties: {
                    total_sessions: { type: 'number' },
                    total_hours: { type: 'number' },
                    subjects_covered: { type: 'object' },
                    warnings: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              required: ['sessions', 'metadata'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'create_revision_plan' } },
        max_completion_tokens: 16000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[OpenAI Error]', openaiResponse.status, errorText);
      
      if (openaiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes. Réessaye dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const aiResult = await openaiResponse.json();
    console.log(`[${user.id}] Réponse OpenAI reçue`);

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('Pas de tool call dans la réponse OpenAI');
    }

    const planData = JSON.parse(toolCall.function.arguments);
    const sessions = planData.sessions || [];

    console.log(`[${user.id}] ${sessions.length} sessions générées par l'IA`);

    // Validation des sessions
    const validSessions = sessions.filter((s: any) => {
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      const durationMin = (end.getTime() - start.getTime()) / 60000;

      const isValid = 
        start >= now &&
        end <= lastExamDate &&
        start < end &&
        durationMin >= intensityConfig.sessionDuration.min &&
        durationMin <= intensityConfig.sessionDuration.max * 1.2 && // 20% de marge
        s.subject &&
        s.exam_id &&
        exams.some(e => e.id === s.exam_id);

      if (!isValid) {
        console.warn(`Session invalide ignorée:`, s);
      }

      return isValid;
    });

    console.log(`[${user.id}] ${validSessions.length} sessions valides après validation`);

    if (validSessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Aucune session valide générée. Vérifie tes contraintes et réessaye.',
          warnings: planData.metadata?.warnings || [],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Suppression de l'ancien planning
    const { error: deleteError } = await supabase
      .from('revision_sessions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erreur suppression ancien planning:', deleteError);
    }

    // Insertion des nouvelles sessions
    const sessionsToInsert = validSessions.map((s: any) => ({
      user_id: user.id,
      exam_id: s.exam_id,
      subject: s.subject,
      start_time: s.start_time,
      end_time: s.end_time,
      difficulty: s.difficulty,
      weight: s.weight,
    }));

    const { data: insertedSessions, error: insertError } = await supabase
      .from('revision_sessions')
      .insert(sessionsToInsert)
      .select();

    if (insertError) {
      console.error('Erreur insertion sessions:', insertError);
      throw insertError;
    }

    console.log(`[${user.id}] ✅ ${insertedSessions.length} sessions insérées avec succès`);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedSessions.length,
        metadata: planData.metadata,
        sessions: insertedSessions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur génération planning:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
