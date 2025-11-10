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

    const systemPrompt = `Tu es Skoolife, un assistant IA spécialisé dans la génération de plannings de révision intelligents pour étudiants.

🎯 MISSION : Générer un planning optimal qui respecte ABSOLUMENT toutes les contraintes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RÈGLES STRICTES - RESPECT ABSOLU OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ CONTRAINTES HORAIRES STRICTES :
   ⏰ Durée sessions : ENTRE ${config.minDuration} et ${config.maxDuration} minutes exactement
   📊 Maximum ${config.sessionsPerDay} session(s) par jour
   🌙 JAMAIS entre ${profile?.no_study_after || '22:00'} et ${profile?.no_study_before || '08:00'}
   ${profile?.no_study_days && profile.no_study_days.length > 0 ? `🚫 JOURS INTERDITS : ${profile.no_study_days.join(', ')} - AUCUNE session ces jours-là` : '🚫 JAMAIS le dimanche (repos obligatoire)'}
   ${profile?.max_daily_revision_hours ? `⏱️ Maximum ${profile.max_daily_revision_hours}h de révision PAR JOUR (cumul total)` : ''}
   ${profile?.max_weekly_revision_hours ? `📅 Maximum ${profile.max_weekly_revision_hours}h de révision PAR SEMAINE (cumul total)` : ''}

2️⃣ ZÉRO CONFLIT - VÉRIFICATION OBLIGATOIRE :
   ❌ NE JAMAIS chevaucher un événement du calendrier
   ❌ NE JAMAIS chevaucher un horaire de travail
   ❌ NE JAMAIS chevaucher une activité régulière
   ❌ NE JAMAIS chevaucher un moment de routine
   ❌ NE JAMAIS chevaucher un événement planifié manuellement
   ⚠️ Laisser MINIMUM 30 minutes de marge avant ET après chaque événement existant
   ${profile?.respect_meal_times ? `🍽️ RESPECTER ABSOLUMENT les repas : 
      - Déjeuner : ${profile.lunch_break_start} à ${profile.lunch_break_end}
      - Dîner : ${profile.dinner_break_start} à ${profile.dinner_break_end}` : ''}

3️⃣ TRAJETS & OPTIMISATIONS :
   ${profile?.commute_home_school ? `🚗 Trajet école : ${profile.commute_home_school} min → Prévoir ${Math.ceil(profile.commute_home_school * 1.2)} min de marge totale` : ''}
   ${profile?.commute_home_job ? `🚗 Trajet job : ${profile.commute_home_job} min → Prévoir ${Math.ceil(profile.commute_home_job * 1.2)} min de marge totale` : ''}
   ${profile?.commute_home_sport ? `🚗 Trajet sport : ${profile.commute_home_sport} min → Prévoir ${Math.ceil(profile.commute_home_sport * 1.2)} min de marge totale` : ''}
   ${profile?.commute_home_activity ? `🚗 Trajet activités : ${profile.commute_home_activity} min → Prévoir ${Math.ceil(profile.commute_home_activity * 1.2)} min de marge totale` : ''}
   ${profile?.preferred_productivity === 'morning' ? '🌅 PRIVILÉGIER FORTEMENT les créneaux MATIN (7h-12h) - meilleure productivité' : ''}
   ${profile?.preferred_productivity === 'afternoon' ? '☀️ PRIVILÉGIER FORTEMENT les créneaux APRÈS-MIDI (12h-18h) - meilleure productivité' : ''}
   ${profile?.preferred_productivity === 'evening' ? '🌆 PRIVILÉGIER FORTEMENT les créneaux SOIR (18h-22h) - meilleure productivité' : ''}
   ${profile?.min_free_evenings_per_week ? `🎯 Garantir AU MOINS ${profile.min_free_evenings_per_week} soirée(s) COMPLÈTEMENT libre(s) par semaine (18h-minuit sans révisions)` : ''}

4️⃣ COUVERTURE TOTALE DES EXAMENS :
   📚 Tu DOIS créer des sessions pour TOUS LES ${exams.length} EXAMENS listés
   🎯 Chaque examen doit avoir AU MINIMUM ${Math.max(3, Math.ceil(10 / exams.length))} sessions dédiées
   🔴 Prioriser les examens : high > medium > low ET proches > lointains
   📈 Intensifier les révisions dans les 10-14 jours avant CHAQUE examen
   ⚖️ Coefficients : Donner plus de sessions aux matières à fort coefficient

5️⃣ STRATÉGIE INTELLIGENTE :
   🔄 Alterner les matières pour éviter saturation cognitive
   📆 Répartition équilibrée sur toute la période jusqu'au dernier examen
   ⏰ Préférer 2-3 sessions courtes plutôt qu'1 longue (meilleure rétention)
   🎲 Varier les horaires selon préférences productivité utilisateur
   💪 Session difficile = matin, Session facile = soir (si pas de préférence spécifique)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ MÉTHODE DE VALIDATION POUR CHAQUE SESSION ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Avant de créer une session, tu DOIS vérifier :
✅ Le créneau est dans les heures autorisées
✅ Le jour n'est pas interdit
✅ Aucun conflit avec événements, travail, activités, routines, plannedEvents
✅ Marges de 30min respectées avant/après chaque événement
✅ Pas pendant les repas (si respect_meal_times = true)
✅ Durée entre ${config.minDuration} et ${config.maxDuration} minutes
✅ Respect des limites quotidiennes et hebdomadaires

🚫 SI LE MOINDRE DOUTE : NE PAS CRÉER LA SESSION 🚫

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 FORMAT DE SORTIE OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RETOURNE UNIQUEMENT un objet JSON valide avec ce format EXACT :
{
  "sessions": [
    {
      "subject": "Nom exact de la matière",
      "exam_id": "UUID de l'examen correspondant",
      "start_time": "2025-11-15T09:00:00+01:00",
      "end_time": "2025-11-15T10:30:00+01:00",
      "difficulty": "facile|moyen|difficile",
      "weight": 0.75
    }
  ]
}

Notes importantes :
- start_time et end_time : Format ISO 8601 AVEC fuseau horaire (+01:00 pour France)
- difficulty : Basé sur la difficulté de l'examen ou "moyen" par défaut
- weight : Entre 0 et 1 (importance de la session, calculée selon priorité/coeff/date)
- subject : EXACTEMENT le même nom que dans la liste des examens`;

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

    console.log('Calling Lovable AI with optimized prompt...');
    console.log('User has:', {
      examsCount: exams.length,
      eventsCount: events.length,
      workSchedulesCount: workSchedules.length,
      activitiesCount: activities.length,
      routineMomentsCount: routineMoments.length,
      plannedEventsCount: plannedEvents.length,
      exceptionsCount: exceptions.length,
      hasProfile: !!profile,
    });

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
        temperature: 1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de requêtes atteinte. Réessaye dans quelques instants.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Crédits insuffisants. Contacte le support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI request failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI raw response length:', aiContent?.length || 0);

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    const sessions = parsed.sessions || [];
    console.log('Parsed sessions count:', sessions.length);

    if (sessions.length === 0) {
      console.warn('No sessions generated by AI');
      return new Response(JSON.stringify({ 
        error: 'Aucun créneau libre trouvé avec tes contraintes actuelles. Essaye de réduire tes contraintes ou de vérifier ton emploi du temps.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate sessions before inserting
    const validSessions = sessions.filter((s: any) => {
      if (!s.subject || !s.start_time || !s.end_time) {
        console.warn('Invalid session missing required fields:', s);
        return false;
      }
      
      const startTime = new Date(s.start_time);
      const endTime = new Date(s.end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.warn('Invalid session with bad timestamps:', s);
        return false;
      }
      
      if (endTime <= startTime) {
        console.warn('Invalid session with end_time before start_time:', s);
        return false;
      }
      
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (durationMinutes < config.minDuration || durationMinutes > config.maxDuration) {
        console.warn(`Invalid session duration ${durationMinutes}min (expected ${config.minDuration}-${config.maxDuration}):`, s);
        return false;
      }
      
      return true;
    });

    console.log('Valid sessions after filtering:', validSessions.length);

    if (validSessions.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Les sessions générées ne respectent pas les contraintes. Réessaye avec d\'autres paramètres.' 
      }), {
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
    const sessionsToInsert = validSessions.map((s: any) => ({
      user_id: user.id,
      exam_id: s.exam_id || null,
      subject: s.subject,
      start_time: s.start_time,
      end_time: s.end_time,
      difficulty: s.difficulty || 'moyen',
      weight: s.weight || 0.5,
    }));

    console.log('Inserting sessions:', sessionsToInsert.length);

    const { data: insertedSessions, error: insertError } = await supabaseClient
      .from('revision_sessions')
      .insert(sessionsToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully generated ${insertedSessions.length} revision sessions`);

    // Log session distribution by subject
    const sessionsBySubject = insertedSessions.reduce((acc: Record<string, number>, s: any) => {
      acc[s.subject] = (acc[s.subject] || 0) + 1;
      return acc;
    }, {});
    console.log('Sessions by subject:', sessionsBySubject);

    return new Response(JSON.stringify({ 
      success: true, 
      count: insertedSessions.length,
      sessions: insertedSessions,
      distribution: sessionsBySubject,
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