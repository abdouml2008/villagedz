import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  userId: string;
  email?: string;
  role?: 'admin' | 'user';
  password?: string;
}

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

    const { userId, email, role, password }: UpdateUserRequest = await req.json();

    // Check if caller is admin
    const { data: isAdmin } = await userClient.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'admin'
    });

    // Non-admins can only update their own data
    if (!isAdmin && userId !== callerUser.id) {
      return new Response(JSON.stringify({ error: "غير مصرح بتعديل بيانات الآخرين" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Non-admins cannot change roles
    if (!isAdmin && role) {
      return new Response(JSON.stringify({ error: "غير مصرح بتغيير الصلاحيات" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Update auth user if email or password provided
    if (email || password) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updateData);
      if (updateError) {
        console.error("Update auth user error:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Update role if provided (admin only)
    if (role && isAdmin) {
      const { error: roleError } = await adminClient
        .from('user_roles')
        .update({ role, email })
        .eq('user_id', userId);
      
      if (roleError) {
        console.error("Update role error:", roleError);
      }
    } else if (email) {
      // Just update email in user_roles
      await adminClient
        .from('user_roles')
        .update({ email })
        .eq('user_id', userId);
    }

    return new Response(JSON.stringify({ success: true }), {
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