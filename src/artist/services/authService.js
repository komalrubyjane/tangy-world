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

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  },

  requestPasswordReset: async (email) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/artist/login`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Creates the auth account + the artist application row in one step.
  applyAsArtist: async ({ email, password, name, genre, city, bio, instagram, soundcloud, experienceLevel }) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (signUpError) return { success: false, error: signUpError.message };

    const userId = signUpData.user?.id;
    if (!userId) {
      return { success: false, error: 'Could not create your account. Please try again.' };
    }

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
