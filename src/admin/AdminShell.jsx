import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAdminSession, useSetting } from './AdminSession';
import { adminApi } from './api';
import { buildNav, ROLE_LABELS, P } from './rbac';
import { Icon, Button, cx } from './ui';
import { SIGNOUT_REASON_KEY } from './AdminGate';
import { NotificationBell } from '../portal/NotificationBell';

// Partner threads awaiting a Tangy reply (status 'open').
function useAwaitingMessages(enabled) {
  const [count, setCount] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return undefined;
    let cancelled = false;
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .neq('conversation_type', 'general')
      .eq('status', 'open')
      .then(({ count: c }) => { if (!cancelled && typeof c === 'number') setCount(c); });
    return () => { cancelled = true; };
  }, [enabled, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return count;
}

function usePendingApplications(enabled) {
  const [count, setCount] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return undefined;
    let cancelled = false;
    supabase
      .from('applications_overview')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count: c }) => { if (!cancelled && typeof c === 'number') setCount(c); });
    return () => { cancelled = true; };
    // Refresh when moving between sections (e.g. after reviewing one).
  }, [enabled, pathname.startsWith('/admin/applications')]); // eslint-disable-line react-hooks/exhaustive-deps
  return count;
}

export function useConsoleSignOut() {
  const { logout, user, isMock } = useAdminSession();
  return useCallback(async (reason) => {
    if (!isMock) await adminApi.logAuthEvent(reason ? 'auth.session_expired' : 'auth.logout');
    try {
      if (user?.id) sessionStorage.removeItem(`tangy_admin_login_logged:${user.id}`);
      if (reason) sessionStorage.setItem(SIGNOUT_REASON_KEY, reason);
    } catch { /* storage unavailable */ }
    await logout();
  }, [logout, user?.id, isMock]);
}

// Signs the console out after N idle minutes (System Settings →
// auth.admin_idle_timeout_minutes; 0 disables). Supabase's own JWT refresh
// handles token expiry separately.
function useIdleTimeout(minutes, onTimeout) {
  const last = useRef(Date.now());
  useEffect(() => {
    if (!minutes || minutes <= 0) return undefined;
    const bump = () => { last.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - last.current > minutes * 60_000) onTimeout();
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [minutes, onTimeout]);
}

const NavItem = ({ item, badge, onNavigate }) => {
  const cls = ({ isActive }) => cx(
    'group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] text-[13px] transition-colors',
    isActive ? 'bg-[#C99A2E]/15 text-[#EFE2C0] shadow-[inset_2px_0_0_#C99A2E]' : 'text-[#E7D5A4]/65 hover:text-[#EFE2C0] hover:bg-[#E7D5A4]/[0.04]'
  );
  const inner = (
    <>
      <Icon name={item.icon} size={16} className="shrink-0 opacity-80" />
      <span className="truncate">{item.label}</span>
      {item.external && <Icon name="ArrowUpRight" size={13} className="ml-auto opacity-40" />}
      {typeof badge === 'number' && badge > 0 && (
        <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#B94717] text-white text-[10.5px] font-mono inline-flex items-center justify-center tabular-nums">{badge > 99 ? '99+' : badge}</span>
      )}
    </>
  );
  if (item.external) {
    return <Link to={item.to} onClick={onNavigate} className={cls({ isActive: false })}>{inner}</Link>;
  }
  return <NavLink to={item.to} end={item.end} onClick={onNavigate} className={cls}>{inner}</NavLink>;
};

const Sidebar = ({ nav, badges, onNavigate }) => {
  const { pathname } = useLocation();
  const [openMore, setOpenMore] = useState(() => pathname.startsWith('/admin/ops'));
  const orgName = useSetting('general.organization_name', 'Tangy Sessions');
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-[#C99A2E]/15 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#B94717]" />
        <div className="leading-none">
          <div className="font-condensed text-[15px] uppercase tracking-wide text-[#EFE2C0]">{orgName}</div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#C99A2E]/70 mt-1">Admin System</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-4" aria-label="Admin navigation">
        {nav.map((group) => {
          const collapsed = group.collapsible && !openMore;
          return (
            <div key={group.group}>
              {group.collapsible ? (
                <button onClick={() => setOpenMore((o) => !o)} className="w-full flex items-center justify-between px-2.5 mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#E7D5A4]/35 hover:text-[#E7D5A4]/70" aria-expanded={!collapsed}>
                  {group.group} <Icon name="ChevronDown" size={13} className={cx('transition-transform', collapsed && '-rotate-90')} />
                </button>
              ) : (
                <div className="px-2.5 mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#E7D5A4]/35">{group.group}</div>
              )}
              {!collapsed && (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => <NavItem key={item.to} item={item} badge={badges[item.badge]} onNavigate={onNavigate} />)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

const QUICK_ACTIONS = [
  { label: 'Create event', to: '/admin/events?new=1', requires: P.EVENTS_MANAGE, icon: 'Plus' },
  { label: 'Review pending applications', to: '/admin/applications?status=pending', requires: P.APPLICATIONS_REVIEW, icon: 'Inbox' },
  { label: 'Add complimentary booking', to: '/admin/bookings?comp=1', requires: P.BOOKINGS_MANAGE, icon: 'Ticket' },
  { label: 'New announcement', to: '/admin/content?new=1', requires: P.CONTENT, icon: 'Megaphone' },
  { label: 'Open check-in terminal', to: '/check-in', requires: P.CHECKIN, icon: 'ScanLine' },
  { label: 'Invite a user', to: '/admin/users?invite=1', requires: P.USERS_MANAGE, icon: 'UserPlus' },
];

const CommandPalette = ({ nav, onClose }) => {
  const { can } = useAdminSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const items = useMemo(() => {
    const all = [
      ...nav.flatMap((g) => g.items.map((i) => ({ label: i.label, to: i.to, icon: i.icon, hint: g.group }))),
      ...QUICK_ACTIONS.filter((a) => can(a.requires)).map((a) => ({ ...a, hint: 'Action' })),
    ];
    const t = q.trim().toLowerCase();
    return t ? all.filter((i) => i.label.toLowerCase().includes(t) || i.hint.toLowerCase().includes(t)) : all;
  }, [nav, q, can]);

  const go = (item) => { onClose(); navigate(item.to); };

  return (
    <div className="fixed inset-0 z-[480] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#17130F] border border-[#C99A2E]/40 rounded-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 border-b border-[#C99A2E]/20">
          <Icon name="Search" size={16} className="text-[#E7D5A4]/45" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === 'Enter' && items[idx]) go(items[idx]);
            }}
            placeholder="Jump to a section or action…"
            className="flex-1 h-12 bg-transparent text-[14px] text-[#EFE2C0] placeholder:text-[#E7D5A4]/35 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-[#E7D5A4]/40 border border-[#E7D5A4]/20 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1.5" role="listbox">
          {items.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-[#E7D5A4]/45">No matches</li>}
          {items.map((item, i) => (
            <li key={`${item.hint}-${item.to}`} role="option" aria-selected={i === idx}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(item)}
                className={cx('w-full flex items-center gap-3 px-4 h-10 text-left text-[13px]', i === idx ? 'bg-[#C99A2E]/15 text-[#EFE2C0]' : 'text-[#E7D5A4]/75')}
              >
                <Icon name={item.icon} size={15} className="opacity-70" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[#E7D5A4]/35">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const AdminShell = ({ children }) => {
  const { user, perms, can, isMock } = useAdminSession();
  const signOut = useConsoleSignOut();
  const nav = useMemo(() => buildNav(perms ? [...perms] : []), [perms]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const pendingApps = usePendingApplications(can(P.APPLICATIONS_VIEW));
  const awaitingMessages = useAwaitingMessages(can(P.MESSAGES) && !isMock);
  const idleMinutes = Number(useSetting('auth.admin_idle_timeout_minutes', 60));

  const onIdle = useCallback(() => signOut(`Signed out after ${idleMinutes} minutes of inactivity.`), [signOut, idleMinutes]);
  useIdleTimeout(idleMinutes, onIdle);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Native cursor inside the console (the site's custom cursor is decorative).
  useEffect(() => {
    document.body.classList.add('admin-console');
    return () => document.body.classList.remove('admin-console');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const badges = { applications: pendingApps, messages: awaitingMessages };

  return (
    <div data-lenis-prevent className="min-h-[100dvh] bg-[#11100C] text-[#E7D5A4] font-sans flex">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[600] bg-[#C99A2E] text-[#11100C] px-3 py-2 rounded">Skip to content</a>

      <aside className="hidden lg:block w-[236px] shrink-0 h-[100dvh] sticky top-0 bg-[#141009] border-r border-[#C99A2E]/15">
        <Sidebar nav={nav} badges={badges} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[420] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[270px] max-w-[85vw] bg-[#141009] border-r border-[#C99A2E]/25 animate-[drawerIn_0.18s_ease]">
            <Sidebar nav={nav} badges={badges} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[200] h-14 shrink-0 bg-[#11100C]/95 backdrop-blur-sm border-b border-[#C99A2E]/15 flex items-center gap-2 px-3 sm:px-5">
          <Button variant="ghost" size="sm" icon="Menu" className="lg:hidden" aria-label="Open navigation" onClick={() => setDrawerOpen(true)} />
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 h-9 w-72 max-w-[40vw] px-3 rounded-[4px] border border-[#C99A2E]/25 text-[12.5px] text-[#E7D5A4]/45 hover:border-[#C99A2E]/50"
          >
            <Icon name="Search" size={15} /> <span className="flex-1 text-left">Search sections & actions</span>
            <kbd className="font-mono text-[10px] border border-[#E7D5A4]/20 rounded px-1">⌘K</kbd>
          </button>
          <Button variant="ghost" size="sm" icon="Search" className="sm:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)} />
          <div className="flex-1" />
          {can(P.CHECKIN) && (
            <Button to="/check-in" size="sm" variant="secondary" icon="ScanLine">
              <span className="hidden sm:inline">Check-in</span>
            </Button>
          )}
          {!isMock && <NotificationBell userId={user?.id} allHref="/admin/notifications" />}
          <div className="hidden md:flex flex-col items-end leading-tight px-2 border-l border-[#C99A2E]/15 ml-1">
            <span className="text-[12.5px] text-[#EFE2C0] max-w-[200px] truncate">{user?.full_name || user?.email}</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#C99A2E]">{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <Button variant="ghost" size="sm" icon="LogOut" aria-label="Sign out" title="Sign out" onClick={() => signOut()} />
        </header>

        <main id="admin-main" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {children}
        </main>
      </div>

      {paletteOpen && <CommandPalette nav={nav} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};
