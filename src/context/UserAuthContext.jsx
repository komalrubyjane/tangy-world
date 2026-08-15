import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error) {
      // Profile row is created by a DB trigger on signup — if it's not there yet
      // (e.g. still propagating) fall back to bare auth identity rather than
      // treating the user as logged out.
      setUser({ id: sessionUser.id, email: sessionUser.email, full_name: null, role: 'user' });
      return;
    }
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
      setAuthError(error.message);
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
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
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
