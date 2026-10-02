import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// The browser only ever gets the public key: a publishable key (sb_publishable_…)
// or, for older projects and the local stack, the legacy anon key.
export const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = SUPABASE_PUBLIC_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Tangy] Supabase env vars are not set (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). ' +
    'Auth, bookings, check-ins and admin data will fall back to local mock data until they are configured — see .env.example.'
  );
}

// Only construct a real client when configured, so importing this module never
// crashes the app in environments where Supabase hasn't been wired up yet.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
