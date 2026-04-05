import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Client with caller's token to verify identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      console.error("Caller auth error:", callerError?.message);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    console.log("Caller role check:", { callerId: caller.id, role: roleData?.role, roleError: roleError?.message });

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas proprietários podem criar contas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { email, password, fullName, cargo, role } = await req.json();
    console.log("Creating user:", { email, fullName, cargo, role });

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, fullName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API (auto-confirms email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error("Create user error:", createError.message);
      const msg = createError.message.includes("already been registered")
        ? "Este e-mail já está cadastrado"
        : createError.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User created:", newUser?.user?.id);

    // Wait for trigger to create profile and role
    if (newUser?.user) {
      // Give triggers time to execute
      await new Promise(r => setTimeout(r, 1500));

      const initials = fullName.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "MB";
      
      // Update profile cargo and initials
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ cargo, avatar_initials: initials })
        .eq("user_id", newUser.user.id);
      
      if (profileError) {
        console.error("Profile update error:", profileError.message);
      }

      // If role should be admin, update role
      if (role === "admin") {
        await adminClient.from("user_roles").delete().eq("user_id", newUser.user.id);
        const { error: roleInsertError } = await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });
        if (roleInsertError) console.error("Role insert error:", roleInsertError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, userId: newUser?.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
