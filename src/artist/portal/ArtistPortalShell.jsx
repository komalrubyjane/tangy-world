import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useNotifications } from '../../portal/useNotifications';
import { workspaceApi } from '../services/workspaceApi';
import { ARTIST_NAV } from './portalNav';
import { PIcon } from './kit';
import { cx } from './util';

// The Artist Portal: one dedicated shell — a sidebar on desktop, a drawer on
// mobile — and nothing else. No site Navbar, no admin navigation, no
// secondary tab bar. Every section is its own route (portalNav.js).
// Only approved artists get in; anyone else with an application goes to its
// status page.

function useBadges(user) {
  const { count } = useNotifications(user?.userId);
  const [requests, setRequests] = useState(0);
  const { pathname } = useLocation();
  useEffect(() => {
    let cancelled = false;
    workspaceApi.bookingRequests().then((rows) => {
      if (!cancelled) setRequests(rows.filter((r) => r.status === 'pending').length);
    }, () => {});
    return () => { cancelled = true; };
  }, [pathname]);
  return { notifications: count, requests };
}

const NavList = ({ badges, onNavigate }) => (
  <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
    {ARTIST_NAV.map((item) => {
      const n = item.badge ? badges[item.badge] : 0;
      return (
        <li key={item.to}>
          <NavLink
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => cx(
              'flex items-center gap-3 min-h-[44px] px-3 rounded-md text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]',
              isActive ? 'bg-[#C99A2E]/15 text-[#F3E7C9] font-medium' : 'text-[#E7D5A4]/80 hover:bg-[#E7D5A4]/5 hover:text-[#F3E7C9]',
            )}
          >
            <PIcon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {n > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#C99A2E] text-[#14110D] text-[11px] font-bold flex items-center justify-center" aria-label={`${n} new`}>{n}</span>}
          </NavLink>
        </li>
      );
    })}
  </ul>
);

const Brand = () => (
  <div className="flex items-baseline gap-2">
    <span className="font-display text-lg uppercase tracking-wide text-[#F3E7C9]">Tangy</span>
    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C99A2E]">Artist portal</span>
  </div>
);

function PortalFrame() {
  const { user, loading, logout } = useAuth();
  const badges = useBadges(user);
  const [open, setOpen] = useState(false);
  const drawer = useRef(null);
  const toggle = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  useFocusTrap(drawer, open);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const t = toggle.current;
    return () => { window.removeEventListener('keydown', onKey); t?.focus(); };
  }, [open]);

  if (loading) return <div className="min-h-[100dvh] ui-texture text-[#E7D5A4] flex items-center justify-center text-sm" role="status">Opening your portal…</div>;
  if (!user) return <Navigate to={`/artist/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.status !== 'approved') return <Navigate to="/artist/application" replace />;

  const signOut = async () => { await logout(); navigate('/artist/login'); };
  const footer = (
    <div className="flex flex-col gap-1 pt-4 mt-4 border-t border-[#E7D5A4]/10">
      <p className="text-xs text-[#E7D5A4]/70 m-0 px-3 truncate" title={user.email}>{user.name}</p>
      <button type="button" onClick={signOut} className="flex items-center gap-3 min-h-[44px] px-3 rounded-md text-sm text-[#E7D5A4]/80 hover:bg-[#E7D5A4]/5"><PIcon name="LogOut" />Sign out</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] ui-texture text-[#E7D5A4] font-body lg:grid lg:grid-cols-[248px_1fr]" data-artist-portal>
      <a href="#artist-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-[#C99A2E] text-[#14110D] px-3 py-2 rounded">Skip to content</a>

      <aside className="hidden lg:flex flex-col sticky top-0 h-[100dvh] border-r border-[#E7D5A4]/10 ui-texture-deep px-3 py-5" aria-label="Artist portal">
        <div className="px-3 mb-6"><Brand /></div>
        <nav aria-label="Artist portal" className="flex-1 overflow-y-auto"><NavList badges={badges} /></nav>
        {footer}
      </aside>

      <div className="min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 bg-[#17140F]/95 border-b border-[#E7D5A4]/10">
          <Brand />
          <button ref={toggle} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="artist-drawer"
            className="flex items-center gap-2 min-h-[44px] px-3 rounded-md border border-[#E7D5A4]/20 text-sm">
            <PIcon name="Menu" />Menu{badges.notifications + badges.requests > 0 && <span className="w-2 h-2 rounded-full bg-[#C99A2E]" aria-label="New items" />}
          </button>
        </header>

        <main id="artist-main" tabIndex={-1} className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-6xl outline-none">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div ref={drawer} id="artist-drawer" role="dialog" aria-modal="true" aria-label="Artist portal menu"
            className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] ui-texture-deep border-r border-[#E7D5A4]/10 px-3 py-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-3 mb-4">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"><PIcon name="X" /></button>
            </div>
            <nav aria-label="Artist portal" className="flex-1"><NavList badges={badges} onNavigate={() => setOpen(false)} /></nav>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

export const ArtistPortalShell = () => (
  <AuthProvider>
    <PortalFrame />
  </AuthProvider>
);
