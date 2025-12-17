import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';

export function useHasAnyRole() {
  const { user, loading: authLoading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [hasRole, setHasRole] = useState(false);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user || !supabase) {
        setHasRole(false);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking role:', error);
          setHasRole(false);
          setRole(null);
        } else {
          setHasRole(true);
          setRole(data?.role || null);
        }
      } catch (err) {
        console.error('Error checking role:', err);
        setHasRole(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && !supabaseLoading) {
      checkRole();
    }
  }, [user, authLoading, supabase, supabaseLoading]);

  return { hasRole, role, isAdmin: role === 'admin', loading: loading || authLoading || supabaseLoading };
}
