// New, separate mock auth context for the account-creation/dashboard system
// requested in this phase. Deliberately does NOT touch the existing real
// Supabase-backed UserAuthContext (patron login modal) or artist
// AuthContext (/artist/login) — those stay exactly as they are.
import { createContext, useContext, useState, useEffect } from 'react';
import { authService, ROLE_META, DASHBOARD_BY_ROLE } from '../services/authService';

const MockAuthContext = createContext(null);

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getSession());
    setLoading(false);
  }, []);

  const signUp = (data) => {
    const res = authService.signUp(data);
    if (res.success) setUser(res.user);
    return res;
  };

  const signIn = (data) => {
    const res = authService.signIn(data);
    if (res.success) setUser(res.user);
    return res;
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
  };

  const previewRole = (role) => {
    const demo = authService.seedDemoUser(role);
    setUser(demo);
    return demo;
  };

  return (
    <MockAuthContext.Provider value={{ user, loading, isLoggedIn: !!user, signUp, signIn, signOut, previewRole, ROLE_META, DASHBOARD_BY_ROLE }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error('useMockAuth must be used within MockAuthProvider');
  return ctx;
};
