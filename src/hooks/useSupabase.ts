import { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  
  if (!initPromise) {
    initPromise = (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      supabaseInstance = supabase;
      return supabase;
    })();
  }
  
  return initPromise;
}

export function useSupabase() {
  const [client, setClient] = useState<SupabaseClient | null>(supabaseInstance);
  const [loading, setLoading] = useState(!supabaseInstance);

  useEffect(() => {
    if (!client) {
      getSupabase().then((supabase) => {
        setClient(supabase);
        setLoading(false);
      }).catch((error) => {
        console.error('Failed to load Supabase:', error);
        setLoading(false);
      });
    }
  }, [client]);

  return { supabase: client, loading };
}

export { getSupabase };
