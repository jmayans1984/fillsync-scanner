import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const getApiHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    // El backend verifica este token y deriva el user.id real.
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    'x-user-id': session?.user?.id || '',
  };
};

export const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
