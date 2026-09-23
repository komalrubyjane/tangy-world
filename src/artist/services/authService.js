import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const NOT_CONFIGURED = { success: false, error: 'The artist portal is not connected yet — please try again shortly.' };

export const authService = {
  getSession: async () => {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  getArtistByUserId: async (userId) => {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.from('artists').select('*').eq('user_id', userId).maybeSingle();
    return data;
  },

  // Authentication is real Supabase Auth email OTP now (see
  // src/components/auth/EmailOtpAuth.jsx) — signInWithOtp()/verifyOtp()
  // handle both sign-in and account creation, so there's no separate
  // password sign-in or reset flow left for the artist portal.

  // Inserts the artist application row for an ALREADY-authenticated session
  // (RegisterPage.jsx verifies the applicant's email via OTP first, then
  // collects these fields, then calls this — never the other way around,
  // so every artist application belongs to a verified account from the
  // start). Replaces the old signUp-then-insert combo.
  submitArtistApplication: async ({ userId, email, name, genre, city, bio, instagram, soundcloud, experienceLevel }) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error: insertError } = await supabase.from('artists').insert({
      user_id: userId,
      name,
      email,
      genre,
      city,
      bio,
      instagram,
      soundcloud,
      experience_level: experienceLevel,
      status: 'pending',
    });
    if (insertError) return { success: false, error: insertError.message };
    return { success: true };
  },

  updateArtist: async (artistId, updates) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { data, error } = await supabase.from('artists').update(updates).eq('id', artistId).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, artist: data };
  },

  logout: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    return { success: true };
  },
};
