import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AUTH_MODE } from '../config/auth';

const UserAuthContext = createContext(null);

// Supabase Auth returns terse, sometimes-inconsistent English error strings
// (they vary by SDK version) — never render them verbatim as if they were
// designed copy, and never leak anything backend-specific (stack traces,
// SQL, RLS internals). Match on the stable substrings Supabase actually
// uses and fall back to a generic message for anything unrecognized.
function friendlySignInError(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('too many requests') || m.includes('rate limit')) return 'Too many attempts — please wait a moment and try again.';
  return 'Could not sign in — please try again.';
}

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  // Distinct from authError (sign-in form failures): set when the user IS
  // authenticated but their profiles row couldn't be loaded — StaffAuthGate
  // needs to tell "authenticated, no profile row yet" apart from
  // "authenticated, profile loaded, role just isn't sufficient" (see
  // handle_new_user() in 0001_schema.sql for how the row is normally created).
  const [profileError, setProfileError] = useState('');

  const loadProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setProfileError('');
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error) {
      // PGRST116 = PostgREST "no rows returned" — the profiles row genuinely
      // doesn't exist yet (trigger hasn't run/propagated). Any other error
      // (network, unexpected RLS denial, etc.) is also surfaced the same way
      // to the user, but logged distinctly for debugging.
      if (error.code !== 'PGRST116') {
        console.error('[Tangy] Failed to load profile:', error.message);
      }
      setProfileError('Your account profile could not be loaded. Please contact Tangy admin.');
      setUser({ id: sessionUser.id, email: sessionUser.email, full_name: null, role: 'user' });
      return;
    }
    setProfileError('');
    setUser({ ...data, email: sessionUser.email });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      loadProfile(data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = async (email, password, fullName) => {
    setAuthError('');

    if (!isSupabaseConfigured) {
      setAuthError('Sign up is not available right now — please try again shortly.');
      return false;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    setIsLoginModalOpen(false);
    return true;
  };

  const signIn = async (email, password) => {
    setAuthError('');

    if (!isSupabaseConfigured) {
      setAuthError('Sign in is not available right now — please try again shortly.');
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(friendlySignInError(error.message));
      return false;
    }
    setIsLoginModalOpen(false);
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const openLoginModal = () => {
    setAuthError('');
    setIsLoginModalOpen(true);
  };
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        signUp,
        signIn,
        logout,
        authError,
        profileError,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        authMode: AUTH_MODE,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
};
