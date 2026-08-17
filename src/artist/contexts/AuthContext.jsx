import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { authService } from '../services/authService';
import { AUTH_MODE, isMockAuth } from '../../config/auth';
import { mockAuthService, MOCK_SESSION_EVENT } from '../../services/mockAuthService';

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
    experience: artistRow?.experience_level || '',
    status: artistRow?.status || 'pending',
    profileComplete: artistRow ? 100 : 40,
  };
}

// Maps a mock session ({id,email,fullName,role}) onto the same shape as
// toPortalUser above, so the rest of the artist portal UI never has to know
// which backend authenticated the current user.
function toMockPortalUser(session) {
  if (!session) return null;
  return {
    id: session.id,
    userId: session.id,
    email: session.email,
    name: session.fullName || session.name || session.email,
    avatar: '',
    genre: '',
    city: '',
    bio: '',
    instagram: '',
    soundcloud: '',
    experience: '',
    status: 'approved',
    profileComplete: 100,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

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
    if (isMockAuth) {
      const applySession = () => {
        const session = mockAuthService.getMockSession();
        setUser(session && session.role === 'artist' ? toMockPortalUser(session) : null);
      };
      applySession();
      setLoading(false);
      window.addEventListener(MOCK_SESSION_EVENT, applySession);
      return () => window.removeEventListener(MOCK_SESSION_EVENT, applySession);
    }

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

  // Returns { ok, error } rather than a bare boolean — callers that store the
  // failure message into their own local state (e.g. LoginPage.jsx) need the
  // error value returned directly, not read back off context state, because
  // by the time this async call resolves the caller's own closure has
  // already captured the OLD `authError` from before this login attempt.
  const login = async (email, password) => {
    setAuthError('');
    setLoading(true);

    if (isMockAuth) {
      const res = mockAuthService.mockLogin(email, password);
      setLoading(false);
      if (!res.success) {
        setAuthError(res.error);
        return { ok: false, error: res.error };
      }
      if (res.user.role !== 'artist') {
        const error = 'This account is not an artist development account. Use artist@tangysessions.test.';
        setAuthError(error);
        return { ok: false, error };
      }
      setUser(toMockPortalUser(res.user));
      return { ok: true, error: '' };
    }

    const res = await authService.signIn(email, password);
    if (!res.success) {
      setLoading(false);
      setAuthError(res.error);
      return { ok: false, error: res.error };
    }
    const artistRow = await loadArtist(res.user);
    setLoading(false);
    if (!artistRow) {
      const error = 'This account has no artist application on file. Apply first, or sign in with your artist account.';
      setAuthError(error);
      return { ok: false, error };
    }
    return { ok: true, error: '' };
  };

  const logout = async () => {
    if (isMockAuth) {
      mockAuthService.mockLogout();
      setUser(null);
      return;
    }
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (updates) => {
    if (!user) return;

    if (isMockAuth) {
      setUser((u) => ({ ...u, ...updates }));
      return;
    }

    const dbUpdates = {};
    if ('name' in updates) dbUpdates.name = updates.name;
    if ('avatar' in updates) dbUpdates.avatar_url = updates.avatar;
    if ('genre' in updates) dbUpdates.genre = updates.genre;
    if ('city' in updates) dbUpdates.city = updates.city;
    if ('bio' in updates) dbUpdates.bio = updates.bio;
    if ('instagram' in updates) dbUpdates.instagram = updates.instagram;
    if ('soundcloud' in updates) dbUpdates.soundcloud = updates.soundcloud;

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
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, authError, authMode: AUTH_MODE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
