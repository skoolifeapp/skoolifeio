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
    const [examsRes, eventsRes, constraintsRes] = await Promise.all([
      supabaseClient.from('exams').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabaseClient.from('calendar_events').select('*').eq('user_id', user.id),
      supabaseClient.from('constraints').select('*').eq('user_id', user.id),
    ]);

    if (examsRes.error) throw examsRes.error;
    if (eventsRes.error) throw eventsRes.error;
    if (constraintsRes.error) throw constraintsRes.error;

    const exams = examsRes.data || [];
    const events = eventsRes.data || [];
    const constraints = constraintsRes.data || [];

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
   - JAMAIS de sessions entre 22h00 et 8h00
   - JAMAIS le dimanche (jour de repos)

2. RESPECT DE L'EMPLOI DU TEMPS :
   - NE JAMAIS créer de session qui chevauche un événement existant (cours, TD, etc.)
   - Vérifier pour CHAQUE session que le créneau horaire est totalement libre
   - Laisser au minimum 30 minutes de marge avant/après chaque événement
   
3. RESPECT DES CONTRAINTES UTILISATEUR :
   - Si contrainte "alternance" : NE PAS placer de sessions les jours d'alternance indiqués
   - Si contrainte "sport" : NE PAS placer de sessions aux horaires de sport indiqués
   - Si contrainte "job" : NE PAS placer de sessions pendant les heures de travail

4. COUVERTURE COMPLÈTE DES EXAMENS :
   - Tu DOIS créer des sessions pour TOUS les examens listés, pas juste un seul
   - Répartir équitablement entre toutes les matières selon priorité et date
   - Prioriser les examens proches et difficiles (haute priorité)
   - Augmenter l'intensité à l'approche de chaque examen

5. STRATÉGIE DE RÉPARTITION :
   - Alterner entre les matières pour éviter la monotonie
   - Concentrer les révisions dans les 2 semaines avant chaque examen
   - Privilégier plusieurs sessions courtes plutôt qu'une longue
   - Varier les horaires (matin, après-midi, soir)

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
  return `${idx + 1}. ${priorityEmoji} ${e.subject}
   - Date examen: ${e.date} (J-${daysUntilExam})
   - Priorité: ${e.priority}
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
⛔ CONTRAINTES UTILISATEUR - IMPÉRATIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${constraints.length > 0 ? constraints.map(c => {
  const daysStr = c.days.length > 0 ? c.days.join(', ') : 'Tous les jours';
  return `🔒 ${c.type.toUpperCase()}
   Jours concernés: ${daysStr}
   ⚠️ NE PAS créer de sessions pendant ces créneaux`;
}).join('\n\n') : '✅ Aucune contrainte particulière'}

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
2. Respecte TOUTES les contraintes utilisateur
3. Se situe dans les horaires autorisés (8h-22h, pas dimanche)
4. Couvre TOUS les examens listés ci-dessus

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