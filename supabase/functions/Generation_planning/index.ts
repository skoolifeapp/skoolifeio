import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_BUSY_SLOTS = 400; // limite dure pour contrôler les tokens

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Init Supabase client avec le contexte auth du user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Body
    const body = await req.json().catch(() => ({}));
    const intensity = body.intensity || "standard";

    // Récupération des données nécessaires
    const [
      examsRes,
      eventsRes,
      workSchedulesRes,
      activitiesRes,
      routineMomentsRes,
      exceptionsRes,
      plannedEventsRes,
      profileRes,
    ] = await Promise.all([
      supabaseClient.from("exams").select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true }),
      supabaseClient.from("calendar_events").select("*").eq("user_id", user.id),
      supabaseClient.from("work_schedules").select("*").eq("user_id", user.id),
      supabaseClient.from("activities").select("*").eq("user_id", user.id),
      supabaseClient.from("routine_moments").select("*").eq("user_id", user.id),
      supabaseClient.from("event_exceptions").select("*").eq("user_id", user.id),
      supabaseClient.from("planned_events").select("*").eq("user_id", user.id),
      supabaseClient.from("user_constraints_profile").select("*")
        .eq("user_id", user.id)
        .single(),
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
      return new Response(
        JSON.stringify({
          error:
            "Aucun examen trouvé. Ajoute d'abord tes examens avant de générer un planning.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Fenêtre de planning : maintenant -> dernier examen
    const now = new Date();
    const lastExamDate = new Date(exams[exams.length - 1].date);
    const planningStart = now;
    const planningEnd = lastExamDate;

    // Config intensité (sessions/jour & durée)
    const intensityConfig = {
      leger: { minDuration: 45, maxDuration: 60, sessionsPerDay: 1 },
      standard: { minDuration: 60, maxDuration: 90, sessionsPerDay: 2 },
      intensif: { minDuration: 75, maxDuration: 120, sessionsPerDay: 3 },
    } as const;

    const config =
      intensityConfig[intensity as keyof typeof intensityConfig] ||
      intensityConfig.standard;

    // Helper: génération occurrences récurrentes avec exceptions
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const isSameDate = (d1: Date, d2: Date) =>
      d1.toISOString().slice(0, 10) === d2.toISOString().slice(0, 10);

    function findException(
      list: any[],
      source_type: string,
      source_id: any,
      dateStr: string,
    ) {
      return list.find((ex: any) =>
        ex.source_type === source_type &&
        ex.source_id === source_id &&
        ex.exception_date === dateStr
      );
    }

    function expandRecurringSlots(
      items: any[],
      opts: {
        type: string;
        startKey: string;
        endKey: string;
        daysKey: string;
        titleKey?: string;
      },
      exceptionsList: any[],
    ) {
      const slots: { start: string; end: string; type: string }[] = [];
      for (const item of items) {
        const days: string[] = item[opts.daysKey] || [];
        for (const day of days) {
          const target = daysMap[day.toLowerCase()];
          if (target === undefined) continue;

          const d = new Date(planningStart);
          while (d <= planningEnd) {
            if (d.getDay() === target) {
              const dateStr = d.toISOString().slice(0, 10);
              const ex = findException(
                exceptionsList,
                opts.type,
                item.id,
                dateStr,
              );

              if (ex && ex.exception_type === "cancelled") {
                // on saute
              } else {
                const source = ex && ex.exception_type === "modified"
                  ? ex.modified_data
                  : item;
                const start = `${dateStr}T${source[opts.startKey]}`;
                const end = `${dateStr}T${source[opts.endKey]}`;
                slots.push({
                  start,
                  end,
                  type: opts.type,
                });
              }
            }
            d.setDate(d.getDate() + 1);
          }
        }
      }
      return slots;
    }

    // Construction compacte du contexte

    // Exams minimalistes
    const examsPayload = exams.map((e: any) => ({
      id: e.id,
      subject: e.subject,
      date: e.date,
      priority: e.priority || "medium",
      difficulty: e.difficulty || "moyen",
      coefficient: e.coefficient || 1,
      type: e.type || null,
    }));

    // Créneaux occupés (busy_slots)
    let busySlots: { start: string; end: string; type: string }[] = [];

    // Événements calendrier
    for (const ev of events) {
      if (!ev.start_date || !ev.end_date) continue;
      const start = new Date(ev.start_date);
      const end = new Date(ev.end_date);
      if (end < planningStart || start > planningEnd) continue;
      busySlots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        type: "calendar_event",
      });
    }

    // Événements planifiés manuellement
    for (const p of plannedEvents) {
      if (!p.start_time || !p.end_time) continue;
      const start = new Date(p.start_time);
      const end = new Date(p.end_time);
      if (end < planningStart || start > planningEnd) continue;
      busySlots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        type: "planned_event",
      });
    }

    // Work schedules récurrents
    busySlots = busySlots.concat(
      expandRecurringSlots(
        workSchedules,
        {
          type: "work_schedule",
          startKey: "start_time",
          endKey: "end_time",
          daysKey: "days",
        },
        exceptions,
      ),
    );

    // Activities récurrentes
    busySlots = busySlots.concat(
      expandRecurringSlots(
        activities,
        {
          type: "activity",
          startKey: "start_time",
          endKey: "end_time",
          daysKey: "days",
        },
        exceptions,
      ),
    );

    // Routine moments récurrents
    busySlots = busySlots.concat(
      expandRecurringSlots(
        routineMoments,
        {
          type: "routine_moment",
          startKey: "start_time",
          endKey: "end_time",
          daysKey: "days",
        },
        exceptions,
      ),
    );

    // Tri & trimming pour limiter les tokens
    busySlots.sort((a, b) =>
      a.start < b.start ? -1 : a.start > b.start ? 1 : 0
    );
    if (busySlots.length > MAX_BUSY_SLOTS) {
      busySlots = busySlots.slice(0, MAX_BUSY_SLOTS);
    }

    // Contexte compact envoyé à l'IA
    const context = {
      now: planningStart.toISOString(),
      planning_start: planningStart.toISOString(),
      planning_end: planningEnd.toISOString(),
      exams: examsPayload,
      busy_slots: busySlots,
      profile: profile || {},
      intensity: {
        min_session_minutes: config.minDuration,
        max_session_minutes: config.maxDuration,
        max_sessions_per_day: config.sessionsPerDay,
      },
    };

    // System prompt court & strict
    const systemPrompt = `
Tu es Skoolife, moteur IA de génération de plannings de révision.
Tu dois :
- Respecter strictement les créneaux occupés (busy_slots).
- Respecter les contraintes du profil (heures autorisées, jours interdits, limites quotidiennes/hebdo, repas, soirées libres).
- Générer des sessions entre planning_start et planning_end.
- Couvrir tous les examens, en priorisant date proche + priorité + coefficient.
- Produire UNIQUEMENT du JSON valide au format demandé.
`;

    // User prompt : JSON + règles de sortie
    const userPrompt = `
Voici le contexte JSON (ne pas le réécrire, utilise-le) :
${JSON.stringify(context)}

Tâche :
- Génère un planning optimal de révisions.
- Chaque session :
  - Ne doit pas chevaucher un busy_slot.
  - Doit respecter les contraintes du profil.
  - Doit durer entre ${
      config.minDuration
    } et ${config.maxDuration} minutes.
  - Doit avoir exam_id correspondant à un examen ou null si général.
  - Doit contribuer à couvrir tous les examens.

Format de sortie OBLIGATOIRE (JSON uniquement) :
{
  "sessions": [
    {
      "subject": "Nom exact de la matière",
      "exam_id": "UUID de l'examen correspondant ou null",
      "start_time": "ISO 8601 avec fuseau (+01:00 si France)",
      "end_time": "ISO 8601",
      "difficulty": "facile|moyen|difficile",
      "weight": 0.0-1.0
    }
  ]
}
Ne renvoie aucun texte hors de cet objet JSON.
`;

    console.log("Calling OpenAI with optimized prompt...", {
      exams: examsPayload.length,
      busySlots: busySlots.length,
    });

    // Appel OpenAI (à adapter selon ton modèle exact)
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errorText);

      if (openaiRes.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requêtes atteinte. Réessaye dans quelques instants.",
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (openaiRes.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Crédits IA insuffisants. Contacte le support Skoolife.",
          }),
          {
            status: 402,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      throw new Error(`AI request failed: ${openaiRes.status} - ${errorText}`);
    }

    const openaiData = await openaiRes.json();
    const aiContent = openaiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Réponse IA vide");
    }

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (e) {
      console.error("JSON parse error:", e, aiContent);
      return new Response(
        JSON.stringify({
          error:
            "L'IA a retourné un format invalide. Réessaye dans quelques instants.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    if (!sessions.length) {
      return new Response(
        JSON.stringify({
          error:
            "Aucune session de révision valide générée. Vérifie tes contraintes ou ton emploi du temps.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Validation locale des sessions
    const validSessions = sessions.filter((s: any) => {
      if (!s.subject || !s.start_time || !s.end_time) return false;

      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
      if (end <= start) return false;

      const duration =
        (end.getTime() - start.getTime()) / (1000 * 60);
      if (
        duration < config.minDuration ||
        duration > config.maxDuration
      ) {
        return false;
      }

      return true;
    });

    if (!validSessions.length) {
      return new Response(
        JSON.stringify({
          error:
            "Les sessions générées ne respectent pas les contraintes. Réessaye avec des paramètres différents.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Suppression des anciennes sessions de révision de l'utilisateur
    const { error: deleteError } = await supabaseClient
      .from("revision_sessions")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting old sessions:", deleteError);
      throw new Error("Failed to delete old sessions");
    }

    // Insertion des nouvelles sessions
    const sessionsToInsert = validSessions.map((s: any) => ({
      user_id: user.id,
      exam_id: s.exam_id || null,
      subject: s.subject,
      start_time: s.start_time,
      end_time: s.end_time,
      difficulty: s.difficulty || "moyen",
      weight: s.weight ?? 0.5,
    }));

    const { data: inserted, error: insertError } = await supabaseClient
      .from("revision_sessions")
      .insert(sessionsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    const distribution = inserted.reduce(
      (acc: Record<string, number>, s: any) => {
        acc[s.subject] = (acc[s.subject] || 0) + 1;
        return acc;
      },
      {},
    );

    return new Response(
      JSON.stringify({
        success: true,
        count: inserted.length,
        sessions: inserted,
        distribution,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error("Error in Generation_planning:", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : "Unknown error in edge function",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
