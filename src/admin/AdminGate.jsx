/* global __TANGY_DEV_TOOLS__ */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { EmailOtpAuth } from '../components/auth/EmailOtpAuth';
import { DEMO_ADMIN_ENABLED } from '../config/demoAdmin';
import { useAdminSession } from './AdminSession';
import { adminApi } from './api';
import { ROLE_LABELS } from './rbac';
import { DevRoleSelector } from './dev/DevRoleSelector';

export const SIGNOUT_REASON_KEY = 'tangy_admin_signout_reason';

const Screen = ({ children }) => (
  <div data-lenis-prevent className="min-h-[100dvh] bg-[#11100C] text-[#E7D5A4] flex items-center justify-center p-4 font-sans">
    {children}
  </div>
);

const Card = ({ title, subtitle, children }) => (
  <div className="w-full max-w-[400px] bg-[#17130F] border border-[#C99A2E]/35 rounded-md p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
    <div className="mb-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#C99A2E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B94717]" /> Tangy Sessions
      </div>
      <h1 className="font-condensed text-[26px] uppercase tracking-tight text-[#EFE2C0] mt-2 mb-0 leading-none">{title}</h1>
      {subtitle && <p className="text-[13px] text-[#E7D5A4]/55 mt-2">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// Email OTP is the primary sign-in (Supabase Auth — codes are never generated
// or stored by Tangy). Password sign-in stays available as a fallback for
// existing staff accounts until the project's OTP email template is verified.
export const AdminLoginPanel = ({ title = 'Admin Console', subtitle = 'Sign in with your Tangy staff email.' }) => {
  const { signIn, authError } = useUserAuth();
  const [mode, setMode] = useState('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() => {
    try {
      const reason = sessionStorage.getItem(SIGNOUT_REASON_KEY);
      sessionStorage.removeItem(SIGNOUT_REASON_KEY);
      return reason || '';
    } catch {
      return '';
    }
  });

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    await signIn(email, password);
    setBusy(false);
  };

  return (
    <Card title={title} subtitle={subtitle}>
      {notice && (
        <div role="status" className="mb-4 text-[12.5px] text-[#f5b544] bg-[#d4911c]/10 border border-[#d4911c]/40 rounded px-3 py-2">{notice}</div>
      )}
      {!isSupabaseConfigured && (
        <div className="mb-4 text-[12.5px] text-[#f5b544] bg-[#d4911c]/10 border border-[#d4911c]/40 rounded px-3 py-2">
          Backend not connected — sign-in is unavailable until Supabase is configured.
        </div>
      )}

      {mode === 'otp' ? (
        <div className="text-[#E7D5A4]">
          <EmailOtpAuth
            allowSignup={false}
            onVerified={() => setNotice('')}
            copy={{ emailIntro: "We'll email you a 6-digit code. Only existing Tangy staff accounts can sign in here." }}
          />
        </div>
      ) : (
        <form onSubmit={submitPassword} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#C99A2E]/85">Email</span>
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-[#11100C] border border-[#C99A2E]/30 rounded px-3 text-[14px] text-[#EFE2C0] focus:outline-none focus:border-[#C99A2E]" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#C99A2E]/85">Password</span>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-10 bg-[#11100C] border border-[#C99A2E]/30 rounded px-3 text-[14px] text-[#EFE2C0] focus:outline-none focus:border-[#C99A2E]" />
          </label>
          {authError && <div role="alert" className="text-[12.5px] text-[#ef6b5e] bg-[#a8322a]/10 border border-[#a8322a]/40 rounded px-3 py-2">{authError}</div>}
          <button type="submit" disabled={busy} className="h-10 mt-1 bg-[#C99A2E] text-[#11100C] rounded font-mono text-[12px] uppercase tracking-[0.1em] font-medium hover:bg-[#dcb14a] disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      <div className="mt-5 pt-4 border-t border-[#C99A2E]/15 flex items-center justify-between gap-2 text-[11.5px]">
        <button type="button" onClick={() => setMode(mode === 'otp' ? 'password' : 'otp')} className="text-[#E7D5A4]/55 hover:text-[#E7D5A4] underline underline-offset-2">
          {mode === 'otp' ? 'Use password instead' : 'Use email code instead'}
        </button>
        <Link to="/" className="text-[#E7D5A4]/45 hover:text-[#E7D5A4]">← Website</Link>
      </div>

      {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
      {DEMO_ADMIN_ENABLED && !(import.meta.env.DEV && __TANGY_DEV_TOOLS__) && (
        <Link to="/demo-admin" className="mt-4 block text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#E7D5A4]/45 hover:text-[#E7D5A4] border border-[#E7D5A4]/15 rounded py-2">
          Team demo — enter demo admin →
        </Link>
      )}
    </Card>
  );
};

// Gate for the whole /admin/* console. Order: auth loading → sign-in →
// permission loading → no console access / deactivated → console.
export const AdminGate = ({ children, requires = 'dashboard.view', title, subtitle }) => {
  const { user, isLoggedIn, authLoading, logout, profileError, loading, error, can, isMock } = useAdminSession();

  const authorized = isLoggedIn && !loading && can(requires);
  const [realLogin, setRealLogin] = useState(false);

  // Record the console sign-in once per browser session (the RPC also
  // de-duplicates and ignores non-console accounts).
  useEffect(() => {
    if (!authorized || !user?.id || isMock) return;
    const key = `tangy_admin_login_logged:${user.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage unavailable — the RPC still de-duplicates */ }
    adminApi.logAuthEvent('auth.login');
  }, [authorized, user?.id, isMock]);

  if (authLoading || (isLoggedIn && loading)) {
    return <Screen><div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E7D5A4]/50">Verifying access…</div></Screen>;
  }

  if (!isLoggedIn) {
    // DEV ONLY: the role selector is the entry screen; real sign-in stays one click away.
    if ((import.meta.env.DEV && __TANGY_DEV_TOOLS__) && !realLogin) return <Screen><DevRoleSelector onUseRealLogin={() => setRealLogin(true)} /></Screen>;
    return <Screen><AdminLoginPanel title={title} subtitle={subtitle} /></Screen>;
  }

  if (!authorized) {
    const deactivated = user?.is_active === false;
    return (
      <Screen>
        <Card title={deactivated ? 'Account deactivated' : 'No access'}>
          <p className="text-[13px] text-[#E7D5A4]/75 leading-relaxed">
            {deactivated
              ? 'This account has been deactivated by a Super Admin. Contact your Tangy administrator if you think this is a mistake.'
              : profileError
                ? `Signed in as ${user.email} — ${profileError}`
                : error
                  ? 'We could not load your permissions. Check your connection and try again.'
                  : user.role === 'volunteer'
                    ? 'Check-in access for volunteers is granted by the event team for a set time. You have no active access right now — contact the event admin if you need it.'
                    : `You're signed in as ${user.email} (${ROLE_LABELS[user.role] || user.role}), which doesn't have access to this area.`}
          </p>
          <div className="mt-5 flex gap-2">
            <button onClick={logout} className="h-9 px-4 bg-[#a8322a] text-white rounded font-mono text-[11px] uppercase tracking-[0.1em]">Sign out</button>
            {user.role !== 'user' && !['super_admin', 'admin', 'staff'].includes(user.role) && (
              <Link to={{ artist: '/artist/dashboard', sponsor: '/sponsor/dashboard', vendor: '/vendor/dashboard', venue: '/venue/dashboard', volunteer: '/volunteer/dashboard', crew: '/crew/dashboard' }[user.role] || '/dashboard'}
                className="h-9 px-4 inline-flex items-center border border-[#C99A2E]/35 rounded font-mono text-[11px] uppercase tracking-[0.1em]">My portal</Link>
            )}
            <Link to="/" className="h-9 px-4 inline-flex items-center border border-[#C99A2E]/35 rounded font-mono text-[11px] uppercase tracking-[0.1em]">Website</Link>
          </div>
        </Card>
      </Screen>
    );
  }

  return children;
};
