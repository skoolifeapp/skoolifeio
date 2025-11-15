import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Parse time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: Check overlap between two time intervals
const hasOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return start1 < end2 && start2 < end1;
};

// Helper: Format date to YYYY-MM-DD in Europe/Paris timezone
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const planId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const body = await req.json();
    const {
      start_date: startDateInput,
      end_date: endDateInput,
      commit = false,
      regenerate_strategy = 'append',
      temperature = 0.2
    } = body;

    // Fetch all data
    const [examsRes, calendarRes, constraintsRes, commuteRes, mealsRes, profileRes] = await Promise.all([
      supabase.from('exams').select('*').eq('user_id', user.id).order('date'),
      supabase.from('calendar_events').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('user_rest_and_revisions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_commutes').select('*').eq('user_id', user.id),
      supabase.from('user_meals').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    if (examsRes.error) throw examsRes.error;
    const exams = examsRes.data || [];

    // Determine date range
    const now = new Date();
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const startDate = startDateInput ? new Date(startDateInput + 'T00:00:00+01:00') : parisNow;
    const lastExam = exams.length > 0 ? new Date(exams[exams.length - 1].date + 'T00:00:00+01:00') : parisNow;
    const endDate = endDateInput ? new Date(endDateInput + 'T23:59:59+01:00') : lastExam;

    // Filter exams in range
    const examsInRange = exams.filter(e => {
      const examDate = new Date(e.date + 'T00:00:00+01:00');
      return examDate >= startDate && examDate <= endDate;
    });

    if (examsInRange.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun examen dans la période spécifiée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const constraints = constraintsRes.data || {};
    const commutes = commuteRes.data || [];
    const meals = mealsRes.data || [];
    const profile = profileRes.data || {};

    // Validate constraints
    const wakeUpMin = timeToMinutes(constraints.wake_up_time || '07:00:00');
    let noStudyAfterMin = timeToMinutes(constraints.no_study_after || '22:00:00');
    
    // Handle cases where no_study_after is after midnight (e.g., 00:00:00, 01:00:00)
    // If no_study_after < wake_up_time, assume it's the next day
    if (noStudyAfterMin < wakeUpMin) {
      noStudyAfterMin += 24 * 60; // Add 24 hours in minutes
    }

    // Expand recurring events
    const expandRecurringEvents = (events: any[]) => {
      const expanded: Array<{ start: Date; end: Date; summary: string; location?: string; title?: string }> = [];
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

      for (const event of events) {
        if (event.is_recurring && event.days_of_week && event.start_time && event.end_time) {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayName = dayNames[d.getDay()];
            if (event.days_of_week.includes(dayName)) {
              const dateStr = formatDate(d);
              const [sh, sm] = event.start_time.split(':').map(Number);
              const [eh, em] = event.end_time.split(':').map(Number);
              
              const slotStart = new Date(d);
              slotStart.setHours(sh, sm, 0, 0);
              const slotEnd = new Date(d);
              slotEnd.setHours(eh, em, 0, 0);
              
              expanded.push({
                start: slotStart,
                end: slotEnd,
                summary: event.summary || event.title || '',
                title: event.title || event.summary || '',
                location: event.location
              });
            }
          }
        } else if (event.start_date && event.end_date) {
          expanded.push({
            start: new Date(event.start_date),
            end: new Date(event.end_date),
            summary: event.summary || event.title || '',
            title: event.title || event.summary || '',
            location: event.location
          });
        }
      }
      return expanded;
    };

    // Build all busy slots
    const calendarEvents = expandRecurringEvents(calendarRes.data || []);
    const allBusySlots: Array<{ start: Date; end: Date; type: string }> = [];

    // Create a map of commutes by destination name (lowercased for matching)
    const commuteMap = new Map<string, number>();
    for (const commute of commutes) {
      const destination = commute.destination.toLowerCase().trim();
      commuteMap.set(destination, commute.duration_minutes);
    }

    // Get school commute time for special handling
    const schoolCommuteMinutes = commuteMap.get('école') || 0;

    // Group calendar events by day to find first and last events
    const eventsByDay = new Map<string, Array<{ start: Date; end: Date; title?: string; summary?: string }>>();
    for (const evt of calendarEvents) {
      const dateKey = formatDate(evt.start);
      if (!eventsByDay.has(dateKey)) {
        eventsByDay.set(dateKey, []);
      }
      eventsByDay.get(dateKey)!.push(evt);
    }

    // Add calendar events with specific commute times
    for (const evt of calendarEvents) {
      const eventName = (evt.title || evt.summary || '').toLowerCase().trim();
      const dateKey = formatDate(evt.start);
      const dayEvents = eventsByDay.get(dateKey) || [];
      
      // Sort events by start time to find first and last
      const sortedEvents = dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      const isFirstEventOfDay = sortedEvents[0] === evt;
      const isLastEventOfDay = sortedEvents[sortedEvents.length - 1] === evt;
      
      // Find matching commute by event name
      const commuteMinutes = commuteMap.get(eventName);
      
      if (commuteMinutes) {
        // Add commute time before the event
        const commuteBefore = new Date(evt.start);
        commuteBefore.setMinutes(commuteBefore.getMinutes() - commuteMinutes);
        allBusySlots.push({ start: commuteBefore, end: evt.start, type: 'commute' });

        // Add the event itself
        allBusySlots.push({ start: evt.start, end: evt.end, type: 'calendar' });

        // Add commute time after the event
        const commuteAfterEnd = new Date(evt.end);
        commuteAfterEnd.setMinutes(commuteAfterEnd.getMinutes() + commuteMinutes);
        allBusySlots.push({ start: evt.end, end: commuteAfterEnd, type: 'commute' });
      } else {
        // Check if this is first/last ICS event and apply school commute
        if (schoolCommuteMinutes > 0 && isFirstEventOfDay) {
          // Subtract school commute from first event of the day
          const commuteBefore = new Date(evt.start);
          commuteBefore.setMinutes(commuteBefore.getMinutes() - schoolCommuteMinutes);
          allBusySlots.push({ start: commuteBefore, end: evt.start, type: 'commute' });
        }

        // Add the event itself
        allBusySlots.push({ start: evt.start, end: evt.end, type: 'calendar' });

        if (schoolCommuteMinutes > 0 && isLastEventOfDay) {
          // Add school commute after last event of the day
          const commuteAfterEnd = new Date(evt.end);
          commuteAfterEnd.setMinutes(commuteAfterEnd.getMinutes() + schoolCommuteMinutes);
          allBusySlots.push({ start: evt.end, end: commuteAfterEnd, type: 'commute' });
        }
      }
    }

    // Add meals
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const meal of meals) {
        const [sh, sm] = meal.start_time.split(':').map(Number);
        const [eh, em] = meal.end_time.split(':').map(Number);
        
        const mealStart = new Date(d);
        mealStart.setHours(sh, sm, 0, 0);
        const mealEnd = new Date(d);
        mealEnd.setHours(eh, em, 0, 0);
        
        allBusySlots.push({ start: mealStart, end: mealEnd, type: 'meal' });
      }
    }

    // Add sleep periods
    const sleepHours = constraints.sleep_hours_needed || 8;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const wakeUp = new Date(d);
      const [wh, wm] = (constraints.wake_up_time || '07:00:00').split(':').map(Number);
      wakeUp.setHours(wh, wm, 0, 0);
      
      const sleepStart = new Date(wakeUp);
      sleepStart.setHours(sleepStart.getHours() - sleepHours);
      
      allBusySlots.push({ start: sleepStart, end: wakeUp, type: 'sleep' });
    }

    console.log(`[${planId}] User: ${user.id}, Exams: ${examsInRange.length}, Busy slots: ${allBusySlots.length}`);

    // Calculate exam weights using urgency formula
    const examWeights = examsInRange.map(exam => {
      const examDate = new Date(exam.date + 'T00:00:00+01:00');
      const daysUntil = Math.max(1, Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const urgency = Math.exp(-daysUntil / 14);
      const coef = exam.coefficient || ((exam.priority || 3) + (exam.difficulty || 3)) / 2;
      const weight = coef * urgency;
      
      return { exam, weight, urgency, coef };
    });

    const totalWeight = examWeights.reduce((sum, e) => sum + e.weight, 0);
    const weeklyGoal = constraints.weekly_hours_goal || 20;
    
    examWeights.forEach(e => {
      e.weight = e.weight / totalWeight;
    });

    // Build context for AI
    const context = {
      plan_id: planId,
      planning_window: {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        timezone: 'Europe/Paris'
      },
      exams: examWeights.map(({ exam, weight, urgency, coef }) => ({
        id: exam.id,
        subject: exam.subject,
        date: exam.date,
        priority: exam.priority || 3,
        difficulty: exam.difficulty || 3,
        coefficient: coef,
        weight: weight,
        urgency: urgency,
        type: exam.type || 'Partiel'
      })),
      constraints: {
        wake_up_time: constraints.wake_up_time || '07:00:00',
        no_study_after: constraints.no_study_after || '22:00:00',
        sleep_hours_needed: sleepHours,
        max_sessions_per_day: constraints.max_sessions_per_day || 3,
        max_session_duration_minutes: constraints.max_session_duration_minutes || 90,
        weekly_hours_goal: weeklyGoal,
        min_personal_time_per_week: constraints.min_personal_time_per_week || 5
      },
      busy_slots: allBusySlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        type: slot.type
      })),
      meals: meals.map(m => ({ type: m.meal_type, start: m.start_time, end: m.end_time })),
      user_profile: { name: profile.full_name }
    };

    // AI Prompt
    const systemPrompt = `Tu es un expert en planification de révisions pour étudiants français.

CONTEXTE:
Nous développons Skoolife (mobile-first). Objectif : générer des sessions de révision réalistes et optimisées par IA, en respectant le rythme de vie, les contraintes et les examens. Fuseau horaire : Europe/Paris.

RÈGLES BUSINESS (HARD CONSTRAINTS) - ZÉRO TOLÉRANCE:
1. Jamais avant wake_up_time, jamais après no_study_after
2. Respecter max_sessions_per_day (${context.constraints.max_sessions_per_day}) et max_session_duration_minutes (${context.constraints.max_session_duration_minutes})
3. ZÉRO chevauchement avec événements existants (calendar_events), repas (meals), sommeil, trajets
4. Réserver min_personal_time_per_week (${context.constraints.min_personal_time_per_week}h) en blocs de 30-120min AVANT les révisions
5. Jour J d'un examen: max 1 session ≤30min, se terminant ≥90min avant l'examen
6. J-1: sessions "light" ≤60min chacune, total ≤2h

RÈGLES D'OPTIMISATION (SOFT CONSTRAINTS):
- Viser weekly_hours_goal (${weeklyGoal}h) ±10% par semaine
- Longues sessions >90min: découper en 25-55min avec pauses 5-10min
- Répartition équitable sur la semaine
- Panacher les matières (éviter 3 sessions consécutives même matière)
- Ajouter buffer trajet avant/après events "location" non nul

PONDÉRATION EXAMENS:
- weight = coefficient × urgency (exp(-days/14))
- Plus proche = plus urgent = plus de sessions
- Répartir weekly_hours_goal selon weights normalisés

CONSTRUCTION DISPONIBILITÉS:
- Par jour: [wake_up_time, no_study_after] - busy_slots - meals - sleep
- Placer d'abord personal_time, puis révisions

STRATÉGIE PLACEMENT:
1. Réserver personal_time en début de semaine (lun-jeu)
2. Itérer semaines: répartir weekly_hours_goal selon exam weights
3. Placer sessions dans free slots (plus tôt jour → plus tôt semaine)
4. Découper sessions ≤max_session_duration
5. Respecter max_sessions_per_day
6. Alterner subjects
7. J-1 et J: règles spéciales

VALIDATION:
- Aucun overlap
- Limites quotidiennes respectées
- Weekly goal ±10% (warning si impossible)

SORTIE:
sessions: [{ subject, exam_id, exam_date, start_time (ISO), end_time (ISO), duration_minutes, type: "revision|light|warm-up", intensity: "normal|light", importance_score }]
personal_time_blocks: [{ start_time (ISO), end_time (ISO) }]
warnings: []`;

    const userPrompt = `Génère un planning de révision optimal pour:
${JSON.stringify(context, null, 2)}

CONTRAINTES ABSOLUES:
- Max ${context.constraints.max_sessions_per_day} sessions/jour
- Sessions: 25-${context.constraints.max_session_duration_minutes}min
- Objectif: ${weeklyGoal}h/semaine
- Personal time: ${context.constraints.min_personal_time_per_week}h/semaine
- ZÉRO overlap avec busy_slots

Retourne sessions + personal_time_blocks + warnings`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_revision_plan',
            description: 'Génère un planning de révision structuré',
            parameters: {
              type: 'object',
              properties: {
                sessions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      subject: { type: 'string' },
                      exam_id: { type: 'string' },
                      exam_date: { type: 'string' },
                      start_time: { type: 'string' },
                      end_time: { type: 'string' },
                      duration_minutes: { type: 'number' },
                      type: { type: 'string', enum: ['revision', 'light', 'warm-up'] },
                      intensity: { type: 'string', enum: ['normal', 'light'] },
                      importance_score: { type: 'number', minimum: 0, maximum: 1 }
                    },
                    required: ['subject', 'exam_id', 'exam_date', 'start_time', 'end_time', 'duration_minutes', 'type', 'intensity', 'importance_score']
                  }
                },
                personal_time_blocks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start_time: { type: 'string' },
                      end_time: { type: 'string' }
                    },
                    required: ['start_time', 'end_time']
                  }
                },
                warnings: { type: 'array', items: { type: 'string' } }
              },
              required: ['sessions', 'personal_time_blocks', 'warnings']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_revision_plan' } },
        max_completion_tokens: 16000,
        temperature: temperature
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI Error]', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes AI. Réessaye dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits AI insuffisants.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI error: ${aiResponse.status} - ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const planData = JSON.parse(toolCall.function.arguments);
    let sessions = planData.sessions || [];
    const personalTimeBlocks = planData.personal_time_blocks || [];
    const warnings = planData.warnings || [];

    console.log(`[${planId}] AI generated ${sessions.length} sessions, ${personalTimeBlocks.length} personal blocks`);

    // Validate and filter sessions
    const validSessions = sessions.filter((session: any) => {
      if (!session.start_time || !session.end_time || !session.subject || !session.exam_id) {
        warnings.push(`Session invalide ignorée: ${JSON.stringify(session)}`);
        return false;
      }

      const sessionStart = new Date(session.start_time);
      const sessionEnd = new Date(session.end_time);

      // Check overlaps with busy slots
      for (const busy of allBusySlots) {
        if (hasOverlap(sessionStart, sessionEnd, busy.start, busy.end)) {
          warnings.push(`Session ${session.subject} ${session.start_time} overlap avec ${busy.type}`);
          return false;
        }
      }

      // Check daily limit
      const sessionDate = formatDate(sessionStart);
      const sessionsOnDay = sessions.filter((s: any) => 
        s.start_time && formatDate(new Date(s.start_time)) === sessionDate
      ).length;

      if (sessionsOnDay > context.constraints.max_sessions_per_day) {
        warnings.push(`Trop de sessions le ${sessionDate}: ${sessionsOnDay} > ${context.constraints.max_sessions_per_day}`);
        return false;
      }

      return true;
    });

    console.log(`[${planId}] ${validSessions.length} valid sessions after filtering`);

    // Calculate weekly summary
    const weeklySummary: any[] = [];
    const weekStarts = new Map<string, { target: number; scheduled: number }>();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      const weekStart = formatDate(d);
      weekStarts.set(weekStart, { target: weeklyGoal * 60, scheduled: 0 });
    }

    for (const session of validSessions) {
      const sessionDate = new Date(session.start_time);
      const weekStart = formatDate(new Date(sessionDate.setDate(sessionDate.getDate() - sessionDate.getDay() + 1)));
      
      const week = weekStarts.get(weekStart);
      if (week) {
        week.scheduled += session.duration_minutes;
      }
    }

    weekStarts.forEach((data, weekStart) => {
      const coverage = data.target > 0 ? data.scheduled / data.target : 0;
      weeklySummary.push({
        week_start: weekStart,
        target_minutes: data.target,
        scheduled_minutes: data.scheduled,
        coverage_ratio: Math.round(coverage * 100) / 100,
        warning: (coverage < 0.9 || coverage > 1.1) ? 'Objectif non atteint' : null
      });
    });

    // Calculate diagnostics
    const totalBusyMinutes = allBusySlots.reduce((sum, slot) => {
      return sum + (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
    }, 0);

    const totalMinutesInRange = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const freeMinutes = totalMinutesInRange - totalBusyMinutes;

    const diagnostics = {
      free_minutes_total: Math.round(freeMinutes),
      blocked_by_events_minutes: Math.round(totalBusyMinutes),
      meals_minutes: allBusySlots.filter(s => s.type === 'meal').reduce((sum, s) => 
        sum + (s.end.getTime() - s.start.getTime()) / (1000 * 60), 0
      ),
      sleep_minutes: allBusySlots.filter(s => s.type === 'sleep').reduce((sum, s) => 
        sum + (s.end.getTime() - s.start.getTime()) / (1000 * 60), 0
      ),
      commute_minutes: allBusySlots.filter(s => s.type === 'commute').reduce((sum, s) => 
        sum + (s.end.getTime() - s.start.getTime()) / (1000 * 60), 0
      )
    };

    // Commit to database if requested
    if (commit) {
      console.log(`[${planId}] Committing to database with strategy: ${regenerate_strategy}`);

      // Handle regenerate strategies
      if (regenerate_strategy === 'replace_all') {
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user.id)
          .eq('source', 'ai_revision')
          .gte('start_date', startDate.toISOString())
          .lte('start_date', endDate.toISOString());

        if (deleteError) console.error('Error deleting old sessions:', deleteError);
      } else if (regenerate_strategy === 'replace_week') {
        // Delete sessions for each week touched
        for (const weekStart of weekStarts.keys()) {
          const weekStartDate = new Date(weekStart + 'T00:00:00+01:00');
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 7);

          const { error: deleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('user_id', user.id)
            .eq('source', 'ai_revision')
            .gte('start_date', weekStartDate.toISOString())
            .lt('start_date', weekEndDate.toISOString());

          if (deleteError) console.error('Error deleting week:', deleteError);
        }
      }

      // Insert new sessions
      const eventsToInsert = validSessions.map((session: any) => ({
        user_id: user.id,
        source: 'ai_revision',
        title: `Révision — ${session.subject}`,
        summary: 'Session de révision IA',
        description: JSON.stringify({
          linked_exam_id: session.exam_id,
          importance_score: session.importance_score,
          strategy: session.type,
          intensity: session.intensity,
          generated_at: new Date().toISOString(),
          plan_id: planId
        }),
        start_date: session.start_time.replace('Z', ''),
        end_date: session.end_time.replace('Z', ''),
        start_time: session.start_time.split('T')[1].substring(0, 8),
        end_time: session.end_time.split('T')[1].substring(0, 8),
        is_recurring: false,
        is_active: true,
        metadata: { plan_id: planId, created_by: 'generate_revision_sessions' }
      }));

      if (eventsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(eventsToInsert);

        if (insertError) {
          console.error('Error inserting sessions:', insertError);
          throw insertError;
        }
      }

      console.log(`[${planId}] Committed ${eventsToInsert.length} sessions to database`);
    }

    const response = {
      user_id: user.id,
      plan_id: planId,
      committed: commit,
      range: {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate)
      },
      weekly_summary: weeklySummary,
      sessions: validSessions.map((s: any) => ({
        subject: s.subject,
        linked_exam_id: s.exam_id,
        exam_date: s.exam_date,
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.duration_minutes,
        type: s.type,
        intensity: s.intensity,
        importance_score: s.importance_score
      })),
      personal_time_blocks: personalTimeBlocks,
      conflicts: [],
      notes: warnings,
      diagnostics: diagnostics,
      performance: {
        time_to_generate_ms: Date.now() - startTime,
        sessions_generated: validSessions.length,
        sessions_filtered: sessions.length - validSessions.length
      }
    };

    console.log(`[${planId}] Complete in ${response.performance.time_to_generate_ms}ms`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        plan_id: planId 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
