import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { authService } from '../services/authService';
import { AUTH_MODE } from '../../config/auth';

const AuthContext = createContext(null);

// Maps a DB `artists` row onto the field names the existing artist-portal UI expects.
// Deliberately returns null when there's no artist application, even if the caller
// has a valid Supabase Auth session — a signed-in patron is not automatically an
// artist, and this is the only gate ArtistProtectedRoute checks.
function toPortalUser(sessionUser, artistRow) {
  if (!sessionUser || !artistRow) return null;
  return {
    id: artistRow?.id || sessionUser.id,
    userId: sessionUser.id,
    email: sessionUser.email,
    name: artistRow?.name || sessionUser.email,
    avatar: artistRow?.avatar_url || '',
    genre: artistRow?.genre || '',
    city: artistRow?.city || '',
    bio: artistRow?.bio || '',
    instagram: artistRow?.instagram || '',
    soundcloud: artistRow?.soundcloud || '',
    spotify: artistRow?.spotify || '',
    experience: artistRow?.experience_level || '',
    status: artistRow?.status || 'pending',
    profileComplete: artistRow ? 100 : 40,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadArtist = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return null;
    }
    const artistRow = await authService.getArtistByUserId(sessionUser.id);
    setUser(toPortalUser(sessionUser, artistRow));
    return artistRow;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      loadArtist(data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadArtist(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadArtist]);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (updates) => {
    if (!user) return;

    const dbUpdates = {};
    if ('name' in updates) dbUpdates.name = updates.name;
    if ('avatar' in updates) dbUpdates.avatar_url = updates.avatar;
    if ('genre' in updates) dbUpdates.genre = updates.genre;
    if ('city' in updates) dbUpdates.city = updates.city;
    if ('bio' in updates) dbUpdates.bio = updates.bio;
    if ('instagram' in updates) dbUpdates.instagram = updates.instagram;
    if ('soundcloud' in updates) dbUpdates.soundcloud = updates.soundcloud;
    if ('spotify' in updates) dbUpdates.spotify = updates.spotify;

    setUser((u) => ({ ...u, ...updates }));

    if (Object.keys(dbUpdates).length > 0) {
      const res = await authService.updateArtist(user.id, dbUpdates);
      if (!res.success) {
        // Revert the optimistic update on failure and surface it via console —
        // callers currently don't check updateUser's return value.
        console.error('[Tangy] Failed to save artist profile:', res.error);
        await loadArtist({ id: user.userId, email: user.email });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser, authMode: AUTH_MODE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
