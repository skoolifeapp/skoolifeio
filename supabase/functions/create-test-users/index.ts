import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUsersRequest {
  emails: string[];
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emails, password }: CreateUsersRequest = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "emails array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: "password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = [];
    const errors = [];

    // Create users one by one
    for (const email of emails) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true, // Auto-confirm without sending email
        });

        if (error) {
          console.error(`Error creating user ${email}:`, error);
          errors.push({ email, error: error.message });
        } else {
          console.log(`User created successfully: ${email}`);
          results.push({ email, userId: data.user?.id });
        }
      } catch (err) {
        console.error(`Exception creating user ${email}:`, err);
        errors.push({ email, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: results.length,
        total: emails.length,
        results,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-test-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
