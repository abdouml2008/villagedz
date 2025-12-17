import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user: callerUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if caller has any role
    const { data: roleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .maybeSingle();
    
    if (!roleData) {
      return new Response(JSON.stringify({ error: "صلاحية مطلوبة" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isAdmin = roleData.role === 'admin';

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get all auth users
    const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all user roles
    const { data: userRoles } = await adminClient
      .from('user_roles')
      .select('*');

    // Combine auth users with their roles
    const users = authUsers.users.map(authUser => {
      const roleRecord = userRoles?.find(r => r.user_id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        role: roleRecord?.role || 'user',
        created_at: authUser.created_at,
        role_id: roleRecord?.id
      };
    });

    // If not admin, only return current user's data
    if (!isAdmin) {
      const currentUser = users.find(u => u.id === callerUser.id);
      return new Response(JSON.stringify({ 
        users: currentUser ? [currentUser] : [],
        isAdmin: false
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ users, isAdmin: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);