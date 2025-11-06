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

RÈGLES STRICTES :
1. Les sessions doivent durer entre ${config.minDuration} et ${config.maxDuration} minutes
2. Maximum ${config.sessionsPerDay} sessions par jour
3. Pas de sessions entre 22h00 et 8h00
4. Éviter tout chevauchement avec les événements existants
5. Respecter les contraintes utilisateur
6. Prioriser les examens proches et difficiles
7. Augmenter progressivement l'intensité à l'approche des examens

RETOURNE UNIQUEMENT un JSON valide avec ce format exact :
{
  "sessions": [
    {
      "subject": "nom de la matière",
      "exam_id": "uuid de l'examen",
      "start_time": "ISO 8601 timestamp",
      "end_time": "ISO 8601 timestamp",
      "difficulty": "facile|moyen|difficile",
      "weight": nombre entre 0 et 1
    }
  ]
}`;

    const userPrompt = `Génère un planning de révision du ${now} au ${lastExamDate}.

EXAMENS :
${exams.map(e => `- ${e.subject} le ${e.date}, priorité: ${e.priority}, id: ${e.id}`).join('\n')}

ÉVÉNEMENTS (créneaux occupés) :
${events.map(e => `- ${e.summary} : ${e.start_date} → ${e.end_date}`).join('\n')}

CONTRAINTES :
${constraints.map(c => `- Type: ${c.type}, Jours: ${c.days.join(', ')}`).join('\n')}

Génère le planning optimal.`;

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

    // Insert sessions
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