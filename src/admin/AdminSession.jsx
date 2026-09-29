/* global __TANGY_DEV_TOOLS__ */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { adminApi } from './api';
import { allowed, dashboardKind } from './rbac';
import { useDevRole, mockUser, MOCK_ROLE_PERMISSIONS, clearDevRole, isDevIdentity } from './dev/devMock';
import { DevModeBanner } from './dev/DevRoleSelector';

const AdminSessionContext = createContext(null);

// Loads the signed-in user's permission set (my_permissions()) and the
// console's exposed runtime settings once per sign-in. These only drive what
// the UI renders — every action is re-authorized by the database.
export const AdminSessionProvider = ({ children }) => {
  const auth = useUserAuth();
  // DEV ONLY: with no real session, a role picked in the dev switcher stands
  // in as the signed-in identity. A real session always wins. In production
  // builds the inline check below is the literal `false`, so this — and the
  // dev module's data — is compiled out.
  const devRole = useDevRole();
  const mock = (import.meta.env.DEV && __TANGY_DEV_TOOLS__) && devRole && !auth.isLoggedIn && !auth.loading ? mockUser(devRole) : null;
  const user = mock || auth.user;
  const isLoggedIn = !!mock || auth.isLoggedIn;
  const userId = user?.id;
  const [state, setState] = useState({ perms: null, settings: {}, loading: false, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setState({ perms: null, settings: {}, loading: false, error: null });
      return undefined;
    }
    if (mock) {
      setState({ perms: new Set(MOCK_ROLE_PERMISSIONS[mock.role]), settings: {}, loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([adminApi.myPermissions(), adminApi.runtimeSettings()])
      .then(([perms, settings]) => {
        if (!cancelled) setState({ perms: new Set(perms || []), settings: settings || {}, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ perms: new Set(), settings: {}, loading: false, error });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId, user?.role, user?.is_active, reloadKey, !!mock]);

  const can = useCallback((requires, anyOf) => allowed(state.perms, { requires, anyOf }), [state.perms]);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const authLogout = auth.logout;
  // Signing out also leaves dev mode, so a refresh doesn't restore the mock.
  const logout = useCallback(async () => {
    if (import.meta.env.DEV && __TANGY_DEV_TOOLS__) clearDevRole();
    await authLogout();
  }, [authLogout]);

  const value = useMemo(() => ({
    user,
    isLoggedIn,
    authLoading: auth.loading && !mock,
    profileError: mock ? null : auth.profileError,
    isMock: !!mock,
    logout,
    perms: state.perms,
    settings: state.settings,
    loading: state.loading || (isLoggedIn && !!userId && state.perms === null && !state.error),
    error: state.error,
    can,
    kind: dashboardKind(state.perms ? [...state.perms] : []),
    reload,
  }), [user, state, isLoggedIn, userId, can, reload, auth.loading, auth.profileError, mock, logout]);

  return (
    <AdminSessionContext.Provider value={value}>
      {(import.meta.env.DEV && __TANGY_DEV_TOOLS__) && isDevIdentity(user) && <DevModeBanner user={user} />}
      {children}
    </AdminSessionContext.Provider>
  );
};

export const useAdminSession = () => {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession must be used within AdminSessionProvider');
  return ctx;
};

export const useCan = () => useAdminSession().can;

export function useSetting(key, fallback) {
  const { settings } = useAdminSession();
  return settings?.[key] ?? fallback;
}
