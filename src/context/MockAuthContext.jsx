// Mock auth context for the account-creation/dashboard system. When
// AUTH_MODE === 'mock' (src/config/auth.js), the EXISTING real-auth contexts
// (UserAuthContext, artist AuthContext, StaffAuthGate) also read/write the
// same underlying mockAuthService session, so this context listens for the
// same change event to stay in sync no matter which login surface was used.
import { createContext, useContext, useState, useEffect } from 'react';
import { mockAuthService, ROLE_META, DASHBOARD_BY_ROLE, MOCK_SESSION_EVENT } from '../services/mockAuthService';

const MockAuthContext = createContext(null);

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applySession = () => setUser(mockAuthService.getSession());
    applySession();
    setLoading(false);
    window.addEventListener(MOCK_SESSION_EVENT, applySession);
    return () => window.removeEventListener(MOCK_SESSION_EVENT, applySession);
  }, []);

  const signUp = (data) => {
    const res = mockAuthService.signUp(data);
    if (res.success) setUser(res.user);
    return res;
  };

  const signIn = (data) => {
    const res = mockAuthService.signIn(data);
    if (res.success) setUser(res.user);
    return res;
  };

  const signOut = () => {
    mockAuthService.signOut();
    setUser(null);
  };

  const previewRole = (role) => {
    const demo = mockAuthService.seedDemoUser(role);
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
