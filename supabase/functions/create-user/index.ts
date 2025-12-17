import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the authorization header to verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create client with user's token to verify they're an admin
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

    // Check if caller is admin
    const { data: roleData, error: roleError } = await userClient.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'admin'
    });
    
    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "صلاحية المدير مطلوبة" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request body
    const { email, password, role }: CreateUserRequest = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "البريد وكلمة المرور مطلوبان" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create the new user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // If role is different from default 'user', update it
    if (role === 'admin' && newUser.user) {
      // The trigger already assigns 'user' role, so we need to update it
      const { error: updateRoleError } = await adminClient
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', newUser.user.id);
      
      if (updateRoleError) {
        console.error("Update role error:", updateRoleError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: newUser.user?.id, email: newUser.user?.email } 
    }), {
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
