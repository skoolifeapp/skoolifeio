import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { intensity = 'standard' } = await req.json();

    // Fetch user data
    const [examsRes, eventsRes, workSchedulesRes, activitiesRes, routineMomentsRes, exceptionsRes, plannedEventsRes, profileRes] = await Promise.all([
      supabaseClient.from('exams').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabaseClient.from('calendar_events').select('*').eq('user_id', user.id),
      supabaseClient.from('work_schedules').select('*').eq('user_id', user.id),
      supabaseClient.from('activities').select('*').eq('user_id', user.id),
      supabaseClient.from('routine_moments').select('*').eq('user_id', user.id),
      supabaseClient.from('event_exceptions').select('*').eq('user_id', user.id),
      supabaseClient.from('planned_events').select('*').eq('user_id', user.id),
      supabaseClient.from('user_constraints_profile').select('*').eq('user_id', user.id).single(),
    ]);

    if (examsRes.error) throw examsRes.error;
    if (eventsRes.error) throw eventsRes.error;
    if (workSchedulesRes.error) throw workSchedulesRes.error;
    if (activitiesRes.error) throw activitiesRes.error;
    if (routineMomentsRes.error) throw routineMomentsRes.error;
    if (exceptionsRes.error) throw exceptionsRes.error;
    if (plannedEventsRes.error) throw plannedEventsRes.error;

    const exams = examsRes.data || [];
    const events = eventsRes.data || [];
    const workSchedules = workSchedulesRes.data || [];
    const activities = activitiesRes.data || [];
    const routineMoments = routineMomentsRes.data || [];
    const exceptions = exceptionsRes.data || [];
    const plannedEvents = plannedEventsRes.data || [];
    const profile = profileRes.data || null;

    if (exams.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun examen trouvé. Ajoute d\'abord tes examens.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context for AI
    const now = new Date().toISOString();
    const lastExamDate = exams[exams.length - 1].date;

    const intensityConfig = {
      leger: { minDuration: 45, maxDuration: 60, sessionsPerDay: 1 },
      standard: { minDuration: 60, maxDuration: 90, sessionsPerDay: 2 },
      intensif: { minDuration: 75, maxDuration: 120, sessionsPerDay: 3 },
    };

    const config = intensityConfig[intensity as keyof typeof intensityConfig] || intensityConfig.standard;

    const systemPrompt = `Tu es Skoolife, un assistant IA qui génère des plannings de révision pour étudiants.

RÈGLES STRICTES - RESPECT ABSOLU OBLIGATOIRE :

1. CONTRAINTES HORAIRES :
   - Les sessions doivent durer entre ${config.minDuration} et ${config.maxDuration} minutes
   - Maximum ${config.sessionsPerDay} sessions par jour
   - JAMAIS de sessions entre ${profile?.no_study_after || '22:00'} et ${profile?.no_study_before || '08:00'}
   ${profile?.no_study_days && profile.no_study_days.length > 0 ? `- JAMAIS de sessions les jours suivants : ${profile.no_study_days.join(', ')}` : '- JAMAIS le dimanche (jour de repos)'}
   ${profile?.max_daily_revision_hours ? `- Maximum ${profile.max_daily_revision_hours}h de révision par jour` : ''}
   ${profile?.max_weekly_revision_hours ? `- Maximum ${profile.max_weekly_revision_hours}h de révision par semaine` : ''}

2. RESPECT DE L'EMPLOI DU TEMPS :
   - NE JAMAIS créer de session qui chevauche un événement existant (cours, TD, etc.)
   - NE JAMAIS créer de session qui chevauche une contrainte fixe (alternance, job, sport, rdv)
   - Vérifier pour CHAQUE session que le créneau horaire est totalement libre
   - Laisser au minimum 30 minutes de marge avant/après chaque événement
   ${profile?.respect_meal_times ? `- RESPECTER les heures de repas : déjeuner ${profile.lunch_break_start}-${profile.lunch_break_end}, dîner ${profile.dinner_break_start}-${profile.dinner_break_end}` : ''}

3. RESPECT DES TRAJETS & PRÉFÉRENCES :
   ${profile?.commute_home_school ? `- Temps trajet école : ${profile.commute_home_school} min (aller simple) - Éviter de placer sessions juste avant/après un événement école` : ''}
   ${profile?.commute_home_job ? `- Temps trajet job : ${profile.commute_home_job} min - Prévoir marge suffisante` : ''}
   ${profile?.commute_home_sport ? `- Temps trajet sport : ${profile.commute_home_sport} min - Prévoir marge suffisante` : ''}
   ${profile?.preferred_productivity === 'morning' ? '- PRIVILÉGIER les créneaux du matin (7h-12h) pour les sessions' : ''}
   ${profile?.preferred_productivity === 'afternoon' ? '- PRIVILÉGIER les créneaux de l\'après-midi (12h-18h) pour les sessions' : ''}
   ${profile?.preferred_productivity === 'evening' ? '- PRIVILÉGIER les créneaux du soir (18h-22h) pour les sessions' : ''}
   ${profile?.min_free_evenings_per_week ? `- Garantir au moins ${profile.min_free_evenings_per_week} soirée(s) libre(s) par semaine (après 18h)` : ''}

4. COUVERTURE COMPLÈTE DES EXAMENS :
   - Tu DOIS créer des sessions pour TOUS les examens listés, pas juste un seul
   - Répartir équitablement entre toutes les matières selon priorité et date
   - Prioriser les examens proches et difficiles (haute priorité)
   - Augmenter l'intensité à l'approche de chaque examen

5. STRATÉGIE DE RÉPARTITION :
   - Alterner entre les matières pour éviter la monotonie
   - Concentrer les révisions dans les 2 semaines avant chaque examen
   - Privilégier plusieurs sessions courtes plutôt qu'une longue
   - Varier les horaires selon les préférences utilisateur

⚠️ EN CAS DE DOUTE SUR UN CRÉNEAU : NE PAS CRÉER LA SESSION ⚠️

RETOURNE UNIQUEMENT un JSON valide avec ce format exact :
{
  "sessions": [
    {
      "subject": "nom de la matière",
      "exam_id": "uuid de l'examen",
      "start_time": "ISO 8601 timestamp avec fuseau horaire",
      "end_time": "ISO 8601 timestamp avec fuseau horaire",
      "difficulty": "facile|moyen|difficile",
      "weight": nombre entre 0 et 1
    }
  ]
}`;

    const userPrompt = `Génère un planning de révision du ${now} au ${lastExamDate}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 EXAMENS À RÉVISER (${exams.length} au total - TOUS obligatoires)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${exams.map((e, idx) => {
  const examDate = new Date(e.date);
  const daysUntilExam = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const priorityEmoji = e.priority === 'high' ? '🔴' : e.priority === 'medium' ? '🟡' : '🟢';
  const difficultyText = e.difficulty ? ` | Difficulté: ${e.difficulty}` : '';
  const coeffText = e.coefficient ? ` | Coeff: ${e.coefficient}` : '';
  const typeText = e.type ? ` | Type: ${e.type}` : '';
  const locationText = e.location ? ` | Lieu: ${e.location}` : '';
  return `${idx + 1}. ${priorityEmoji} ${e.subject}
   - Date examen: ${e.date} (J-${daysUntilExam})
   - Priorité: ${e.priority}${difficultyText}${coeffText}${typeText}${locationText}
   ${e.notes ? `- Notes: ${e.notes}` : ''}
   - ID: ${e.id}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 CRÉNEAUX OCCUPÉS - À ÉVITER ABSOLUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${events.length > 0 ? events.map(e => {
  const start = new Date(e.start_date);
  const end = new Date(e.end_date);
  return `❌ ${e.summary}
   Du: ${start.toLocaleString('fr-FR')} 
   Au: ${end.toLocaleString('fr-FR')}
   ${e.location ? `Lieu: ${e.location}` : ''}`;
}).join('\n\n') : '✅ Aucun événement - Emploi du temps libre'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 HORAIRES DE TRAVAIL - NE PAS UTILISER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${workSchedules.length > 0 ? workSchedules.map(w => {
  // Helper to expand recurring schedules
  const getOccurrencesForPeriod = (schedule: any, startDate: Date, endDate: Date) => {
    const occurrences = [];
    const daysMap: Record<string, number> = { 
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 
      'friday': 5, 'saturday': 6, 'sunday': 0 
    };
    
    for (const day of schedule.days) {
      const targetDayNum = daysMap[day.toLowerCase()];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() === targetDayNum) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Check if there's an exception for this date
          const exception = exceptions.find((ex: any) => 
            ex.source_type === 'work_schedule' &&
            ex.source_id === schedule.id &&
            ex.exception_date === dateStr
          );
          
          if (!exception || exception.exception_type === 'modified') {
            const finalData = exception?.exception_type === 'modified' ? exception.modified_data : schedule;
            occurrences.push({
              date: dateStr,
              start_time: finalData.start_time,
              end_time: finalData.end_time,
              title: finalData.title || schedule.title,
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return occurrences;
  };
  
  const planningStart = new Date();
  const planningEnd = new Date(lastExamDate);
  const occurrences = getOccurrencesForPeriod(w, planningStart, planningEnd);
  const typeEmoji = w.type === 'alternance' ? '💼' : w.type === 'job' ? '🏢' : '📋';
  
  return occurrences.map(occ => `${typeEmoji} ${occ.title || w.type.toUpperCase()}
   Le: ${occ.date} de ${occ.start_time} à ${occ.end_time}
   ${w.location ? `Lieu: ${w.location}` : ''}`).join('\n\n');
}).join('\n\n') : '✅ Aucun horaire de travail'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 ACTIVITÉS RÉGULIÈRES - NE PAS UTILISER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${activities.length > 0 ? activities.map(a => {
  const getOccurrencesForPeriod = (activity: any, startDate: Date, endDate: Date) => {
    const occurrences = [];
    const daysMap: Record<string, number> = { 
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 
      'friday': 5, 'saturday': 6, 'sunday': 0 
    };
    
    for (const day of activity.days) {
      const targetDayNum = daysMap[day.toLowerCase()];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() === targetDayNum) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const exception = exceptions.find((ex: any) => 
            ex.source_type === 'activity' &&
            ex.source_id === activity.id &&
            ex.exception_date === dateStr
          );
          
          if (!exception || exception.exception_type === 'modified') {
            const finalData = exception?.exception_type === 'modified' ? exception.modified_data : activity;
            occurrences.push({
              date: dateStr,
              start_time: finalData.start_time,
              end_time: finalData.end_time,
              title: finalData.title,
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return occurrences;
  };
  
  const planningStart = new Date();
  const planningEnd = new Date(lastExamDate);
  const occurrences = getOccurrencesForPeriod(a, planningStart, planningEnd);
  
  return occurrences.map(occ => `🏃 ${occ.title}
   Le: ${occ.date} de ${occ.start_time} à ${occ.end_time}
   ${a.location ? `Lieu: ${a.location}` : ''}`).join('\n\n');
}).join('\n\n') : '✅ Aucune activité régulière'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 MOMENTS DE ROUTINE - NE PAS UTILISER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${routineMoments.length > 0 ? routineMoments.map(r => {
  const getOccurrencesForPeriod = (routine: any, startDate: Date, endDate: Date) => {
    const occurrences = [];
    const daysMap: Record<string, number> = { 
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 
      'friday': 5, 'saturday': 6, 'sunday': 0 
    };
    
    for (const day of routine.days) {
      const targetDayNum = daysMap[day.toLowerCase()];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (currentDate.getDay() === targetDayNum) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const exception = exceptions.find((ex: any) => 
            ex.source_type === 'routine_moment' &&
            ex.source_id === routine.id &&
            ex.exception_date === dateStr
          );
          
          if (!exception || exception.exception_type === 'modified') {
            const finalData = exception?.exception_type === 'modified' ? exception.modified_data : routine;
            occurrences.push({
              date: dateStr,
              start_time: finalData.start_time,
              end_time: finalData.end_time,
              title: finalData.title,
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return occurrences;
  };
  
  const planningStart = new Date();
  const planningEnd = new Date(lastExamDate);
  const occurrences = getOccurrencesForPeriod(r, planningStart, planningEnd);
  
   return occurrences.map(occ => `⏰ ${occ.title}
   Le: ${occ.date} de ${occ.start_time} à ${occ.end_time}`).join('\n\n');
}).join('\n\n') : '✅ Aucun moment de routine'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 ÉVÉNEMENTS PLANIFIÉS MANUELLEMENT - NE PAS UTILISER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${plannedEvents.length > 0 ? plannedEvents.map(p => {
  const start = new Date(p.start_time);
  const end = new Date(p.end_time);
  return `📅 ${p.title}
   Le: ${start.toISOString().split('T')[0]} 
   De: ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} 
   À: ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
   ${p.location ? `Lieu: ${p.location}` : ''}
   ${p.description ? `Description: ${p.description}` : ''}`;
}).join('\n\n') : '✅ Aucun événement planifié manuellement'}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRÉFÉRENCES & SOFT CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${profile ? `
📊 Profil étudiant :
${profile.is_alternant ? '- En alternance' : ''}
${profile.has_student_job ? '- A un job étudiant' : ''}

🚗 Temps de trajet (aller simple) :
${profile.commute_home_school ? `- École : ${profile.commute_home_school} min` : ''}
${profile.commute_home_job ? `- Job : ${profile.commute_home_job} min` : ''}
${profile.commute_home_sport ? `- Sport : ${profile.commute_home_sport} min` : ''}

⚡ Productivité optimale :
- ${profile.preferred_productivity === 'morning' ? 'Matin (7h-12h)' : profile.preferred_productivity === 'evening' ? 'Soir (18h-22h)' : profile.preferred_productivity === 'afternoon' ? 'Après-midi (12h-18h)' : 'Mixte'}

⏱️ Limites strictes :
- Max ${profile.max_daily_revision_hours}h/jour
- Max ${profile.max_weekly_revision_hours}h/semaine
- Pas avant ${profile.no_study_before}
- Pas après ${profile.no_study_after}
${profile.no_study_days.length > 0 ? `- Jours interdits : ${profile.no_study_days.join(', ')}` : ''}

🍽️ Rituels :
${profile.respect_meal_times ? `- Repas : ${profile.lunch_break_start}-${profile.lunch_break_end} et ${profile.dinner_break_start}-${profile.dinner_break_end}` : '- Pas de contrainte repas'}
- Soirées libres : min ${profile.min_free_evenings_per_week}/semaine
` : '✅ Aucune préférence définie - utiliser les valeurs par défaut'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OBJECTIFS DE GÉNÉRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Nombre minimum de sessions: ${Math.max(10, exams.length * 4)}
- Sessions par examen (minimum): ${Math.max(3, Math.ceil(10 / exams.length))}
- Durée des sessions: ${config.minDuration}-${config.maxDuration} minutes
- Sessions max par jour: ${config.sessionsPerDay}

⚠️ RAPPEL CRITIQUE ⚠️
Vérifie CHAQUE session générée pour t'assurer qu'elle :
1. Ne chevauche AUCUN événement de l'emploi du temps
2. Ne chevauche AUCUNE contrainte fixe
3. Respecte TOUTES les préférences & limites utilisateur
4. Se situe dans les horaires autorisés
5. Couvre TOUS les examens listés ci-dessus
6. Optimise selon les moments de productivité préférés

Génère maintenant le planning optimal.`;

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI response:', aiContent);

    const parsed = JSON.parse(aiContent);
    const sessions = parsed.sessions || [];

    if (sessions.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun créneau libre trouvé avec tes contraintes actuelles.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // IMPORTANT: Delete all existing revision sessions for this user before inserting new ones
    console.log('Deleting existing revision sessions...');
    const { error: deleteError } = await supabaseClient
      .from('revision_sessions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old sessions:', deleteError);
      throw new Error('Failed to delete old sessions');
    }

    console.log('Old sessions deleted successfully');

    // Insert new sessions
    const sessionsToInsert = sessions.map((s: any) => ({
      user_id: user.id,
      exam_id: s.exam_id,
      subject: s.subject,
      start_time: s.start_time,
      end_time: s.end_time,
      difficulty: s.difficulty,
      weight: s.weight,
    }));

    const { data: insertedSessions, error: insertError } = await supabaseClient
      .from('revision_sessions')
      .insert(sessionsToInsert)
      .select();

    if (insertError) throw insertError;

    console.log(`Generated ${insertedSessions.length} revision sessions`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: insertedSessions.length,
      sessions: insertedSessions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-revision-plan:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});