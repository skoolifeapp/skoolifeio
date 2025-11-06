import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating study plan for user:", user.id);

    // Fetch user's exams
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (examsError) {
      console.error("Error fetching exams:", examsError);
      throw examsError;
    }

    // Fetch user's constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from("constraints")
      .select("*")
      .eq("user_id", user.id);

    if (constraintsError) {
      console.error("Error fetching constraints:", constraintsError);
      throw constraintsError;
    }

    // Fetch user's calendar events (emploi du temps)
    const { data: calendarEvents, error: eventsError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching calendar events:", eventsError);
      throw eventsError;
    }

    console.log("Data fetched - Exams:", exams?.length, "Constraints:", constraints?.length, "Events:", calendarEvents?.length);

    // Prepare data for AI
    const currentDate = new Date().toISOString();
    
    const systemPrompt = `Tu es Skoolife AI, un assistant intelligent spécialisé dans la génération de plannings de révision optimisés pour les étudiants.

Ton rôle est de créer un planning de révision personnalisé en tenant compte de :
1. Les examens à venir (matière, date, priorité)
2. L'emploi du temps scolaire existant
3. Les contraintes personnelles (alternance, sport, job étudiant)

Règles importantes :
- Ne jamais programmer de révision pendant les cours (calendar_events)
- Respecter les contraintes de disponibilité
- Répartir les sessions selon la priorité de l'examen (high = plus de sessions, low = moins de sessions)
- Espacer les sessions de révision dans le temps (répétition espacée)
- Créer des sessions de 1h à 2h maximum
- Commencer les révisions au moins 2 semaines avant l'examen si possible
- Tenir compte de la date actuelle : ${currentDate}

Format de réponse STRICT (JSON uniquement, pas de texte avant ou après) :
{
  "sessions": [
    {
      "exam_id": "uuid de l'examen",
      "title": "Révision Mathématiques - Chapitre 1",
      "start_time": "2025-11-15T14:00:00Z",
      "end_time": "2025-11-15T16:00:00Z"
    }
  ]
}`;

    const userPrompt = `Voici les données pour générer le planning de révision :

EXAMENS (${exams?.length || 0}) :
${JSON.stringify(exams, null, 2)}

EMPLOI DU TEMPS (${calendarEvents?.length || 0} événements) :
${JSON.stringify(calendarEvents, null, 2)}

CONTRAINTES (${constraints?.length || 0}) :
${JSON.stringify(constraints, null, 2)}

Génère maintenant un planning de révision optimal en respectant toutes les contraintes.`;

    console.log("Calling AI gateway...");

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants pour l'IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");
    
    const aiContent = aiData.choices[0].message.content;
    console.log("AI content:", aiContent);

    // Parse AI response
    let studyPlan;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       aiContent.match(/(\{[\s\S]*\})/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      studyPlan = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("AI content was:", aiContent);
      throw new Error("Impossible de parser la réponse de l'IA");
    }

    if (!studyPlan.sessions || !Array.isArray(studyPlan.sessions)) {
      console.error("Invalid study plan format:", studyPlan);
      throw new Error("Format de planning invalide");
    }

    console.log("Parsed study plan with", studyPlan.sessions.length, "sessions");

    // Insert study sessions into database
    const sessionsToInsert = studyPlan.sessions.map((session: any) => ({
      user_id: user.id,
      exam_id: session.exam_id,
      title: session.title,
      start_time: session.start_time,
      end_time: session.end_time,
      completed: false,
    }));

    const { data: insertedSessions, error: insertError } = await supabase
      .from("study_sessions")
      .insert(sessionsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting sessions:", insertError);
      throw insertError;
    }

    console.log("Successfully inserted", insertedSessions?.length, "sessions");

    return new Response(JSON.stringify({ 
      success: true, 
      sessions: insertedSessions,
      message: `${insertedSessions?.length} sessions de révision générées avec succès !`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-study-plan function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Une erreur est survenue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
