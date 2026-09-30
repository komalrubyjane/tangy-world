import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { buildNav } from '../rbac';
import { MOCK_IDENTITIES, PORTAL_IDENTITIES, MOCK_ROLE_PERMISSIONS, switchDevRole, devBackend } from './devMock';

// DEVELOPMENT-ONLY entry screen for /admin and /check-in (rendered by
// AdminGate in place of the sign-in panel when DEV_MOCK_ENABLED). It only
// picks a development identity — everything after that is the real console:
// AdminSession → RBAC → AdminShell → route guards.
const ROLES = [
  { role: 'super_admin', title: 'Super Admin', tagline: 'Full system control' },
  { role: 'admin', title: 'Admin / Manager', tagline: 'Day-to-day operations' },
  { role: 'staff', title: 'Staff', tagline: 'Event-specific tasks' },
];

// Module list per role, straight from the console's own nav config.
const modulesFor = (role) =>
  buildNav(MOCK_ROLE_PERMISSIONS[role]).flatMap((g) => g.items).filter((i) => !i.to.startsWith('/admin-portal/ops/')).map((i) => i.label);

export const DevRoleSelector = ({ onUseRealLogin }) => {
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState('');
  const backend = devBackend();
  const navigate = useNavigate();

  const enterPortal = async (role) => {
    setBusy(role);
    setNote('');
    const res = await switchDevRole(role);
    if (res.mode !== 'local') {
      await switchDevRole(null);
      setBusy(null);
      setNote(`Partner portals need a local Supabase session (${res.reason || 'unavailable'}).`);
      return;
    }
    navigate(PORTAL_IDENTITIES[role].path);
  };

  const enter = async (role) => {
    setBusy(role);
    setNote('');
    const res = await switchDevRole(role);
    setBusy(null);
    if (res.mode === 'mock' && backend.local) setNote(`Local session unavailable (${res.reason}) — continuing without data.`);
  };

  return (
    <div className="w-full max-w-[980px]" data-dev-role-selector>
      <DevModeStrip />
      <header className="text-center mt-8 mb-8">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-[#C99A2E]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B94717]" /> Tangy Sessions
        </div>
        <h1 className="font-condensed text-[34px] sm:text-[40px] uppercase tracking-tight text-[#EFE2C0] mt-1 mb-0 leading-none">Admin Portal</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#ff4fd8]">Development / Demo mode</p>
        <p className="mt-4 text-[15px] text-[#E7D5A4]/75">Select a role to preview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map(({ role, title, tagline }) => {
          const id = MOCK_IDENTITIES[role];
          const modules = modulesFor(role);
          return (
            <section key={role} aria-label={title} className="flex flex-col bg-[#17130F] border border-[#C99A2E]/30 rounded-md p-5 hover:border-[#C99A2E]/70 transition-colors">
              <h2 className="font-condensed text-[24px] uppercase tracking-tight text-[#EFE2C0] m-0 leading-none">{title}</h2>
              <p className="text-[13px] text-[#C99A2E] mt-1.5">{tagline}</p>
              <p className="font-mono text-[11px] text-[#E7D5A4]/60 mt-3">{id.full_name} · {id.email}</p>
              <ul className="mt-4 mb-5 flex flex-col gap-1 text-[12.5px] text-[#E7D5A4]/70 flex-1">
                {modules.map((m) => <li key={m} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#C99A2E]/70" />{m}</li>)}
              </ul>
              <button onClick={() => enter(role)} disabled={!!busy}
                className="h-11 bg-[#C99A2E] text-[#11100C] rounded font-mono text-[12px] uppercase tracking-[0.12em] font-medium hover:bg-[#dcb14a] disabled:opacity-50">
                {busy === role ? 'Entering…' : 'Enter dashboard'}
              </button>
            </section>
          );
        })}
      </div>

      <h2 className="mt-10 mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#C99A2E] text-center">Partner & volunteer portals</h2>
      <p className="text-center text-[12px] text-[#E7D5A4]/60 mb-4">{backend.local ? 'Signs in to a local test account with an approved application.' : 'Requires a local Supabase stack — portal data is scoped to a real session.'}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(PORTAL_IDENTITIES).map(([role, id]) => (
          <section key={role} aria-label={id.label} className={`flex flex-col bg-[#17130F] border border-[#C99A2E]/25 rounded-md p-4 ${backend.local ? 'hover:border-[#C99A2E]/70' : 'opacity-50'}`}>
            <h3 className="font-condensed text-[18px] uppercase tracking-tight text-[#EFE2C0] m-0 leading-none">{id.label}</h3>
            <p className="text-[12px] text-[#E7D5A4]/55 mt-1.5 flex-1">{id.tagline}</p>
            <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-2 truncate">{id.email}</p>
            <button onClick={() => enterPortal(role)} disabled={!backend.local || !!busy}
              className="mt-3 h-9 border border-[#C99A2E]/60 text-[#E7D5A4] rounded font-mono text-[11px] uppercase tracking-[0.1em] hover:bg-[#C99A2E]/15 disabled:opacity-50">
              {busy === role ? 'Opening…' : 'Open portal'}
            </button>
          </section>
        ))}
      </div>

      {note && <p role="status" className="mt-4 text-center text-[12.5px] text-[#f5b544]">{note}</p>}
      <p className="mt-6 text-center text-[12px] text-[#E7D5A4]/60 leading-relaxed">
        {backend.local
          ? `Data: local Supabase (${backend.host}). With SUPABASE_SERVICE_ROLE_KEY set for the dev server, each role signs in to a local test account and pages show real local data; otherwise pages show their empty/error states.`
          : `Data: no local Supabase connected. The preview identity has no database session, so pages show their empty or error states.`}
      </p>
      <div className="mt-4 flex items-center justify-center gap-5 text-[12px]">
        <button type="button" onClick={onUseRealLogin} className="text-[#E7D5A4]/55 hover:text-[#E7D5A4] underline underline-offset-2">Sign in with a real account instead</button>
        <Link to="/" className="text-[#E7D5A4]/60 hover:text-[#E7D5A4]">← Website</Link>
      </div>
    </div>
  );
};

// The standing development indicator (selector + console). The wording
// follows what is actually happening: `localSession` only when the browser
// holds a real session on a local Supabase stack.
export const DevModeStrip = ({ localSession = false, children }) => (
  <div role="note" aria-label="Development mode" data-dev-mode-strip
    className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-1.5 bg-[repeating-linear-gradient(135deg,#2a0f25_0_10px,#1a0b17_10px_20px)] border-y border-[#ff4fd8]/60 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#ffd6f5]">
    <span className="font-bold text-[#ff4fd8]">
      {localSession
        ? 'Demo / development mode — local test account — changes stay in the local database'
        : 'Demo / development mode — no real account — no database changes'}
    </span>
    {children}
  </div>
);

// In-console strip: who you're previewing as + a way back to the selector.
export const DevModeBanner = ({ user }) => {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = Object.values(MOCK_IDENTITIES).find((m) => m.email === user.email);
  const changeRole = async () => {
    setBusy(true);
    await switchDevRole(null);
    if (pathname.startsWith('/admin-portal/')) navigate('/admin-portal', { replace: true });
  };
  return (
    <DevModeStrip localSession={!user.devMock}>
      <span>Previewing as <b className="text-[#ff4fd8]">{id?.label}</b> · {user.email}</span>
      <button onClick={changeRole} disabled={busy}
        className="h-6 px-2.5 rounded border border-[#ff4fd8]/70 text-[#ffd6f5] hover:bg-[#ff4fd8]/20 disabled:opacity-50">
        {busy ? 'Leaving…' : 'Change role'}
      </button>
      {user.devMock && <span className="opacity-70 normal-case tracking-normal">No database session — pages show their empty/error states.</span>}
    </DevModeStrip>
  );
};

// On partner/volunteer portal pages: which dev identity is signed in, and a
// way back to the role selector. Rendered from App.jsx in dev builds only.
// Leaves the portal before signing out, so the portal's own route guard
// doesn't redirect to its login page first.
export const DevPortalStrip = () => {
  const { user } = useUserAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = user && Object.values(PORTAL_IDENTITIES).find((m) => m.email === user.email);
  if (!id || pathname.startsWith('/admin-portal') || pathname.startsWith('/check-in')) return null;
  return (
    <div role="note" aria-label="Development mode" className="fixed left-3 bottom-3 z-[1000] flex items-center gap-2 rounded-full border-2 border-dashed border-[#ff4fd8] bg-[#1a0b17]/95 pl-3 pr-1 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#ffd6f5] shadow-lg">
      <span className="font-bold text-[#ff4fd8]">Dev</span> {id.label} · local test account
      <button onClick={() => { navigate('/admin-portal'); switchDevRole(null); }} className="h-6 px-2.5 rounded-full border border-[#ff4fd8]/70 hover:bg-[#ff4fd8]/20">Change role</button>
    </div>
  );
};
