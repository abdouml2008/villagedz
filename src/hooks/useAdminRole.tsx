import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user || !supabase) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && !supabaseLoading) {
      checkAdminRole();
    }
  }, [user, authLoading, supabase, supabaseLoading]);

  return { isAdmin, loading: loading || authLoading || supabaseLoading };
}
