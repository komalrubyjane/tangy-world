import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAdminSession, useSetting } from './AdminSession';
import { useDebounced } from './hooks';
import { adminApi } from './api';
import { buildNav, ROLE_LABELS, P, NAV } from './rbac';
import { Icon, Button, cx, CrumbContext } from './ui';
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
  }, [enabled, pathname.startsWith('/admin-portal/applications')]); // eslint-disable-line react-hooks/exhaustive-deps
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

// A section with pages of its own (Content → Sessions, TV, …): the children
// are listed under it while you're anywhere inside the section.
const NavGroupItem = ({ item, badges, onNavigate }) => {
  const { pathname } = useLocation();
  const inside = pathname === item.to || pathname.startsWith(`${item.to}/`);
  return (
    <div>
      <Link to={item.to} onClick={onNavigate} aria-current={pathname === item.to ? 'page' : undefined} data-active={inside ? 'true' : undefined}
        className={cx('group flex items-center gap-2.5 h-8 px-2.5 rounded-[4px] text-[13px] transition-colors',
          inside ? 'bg-[#C99A2E]/15 text-[#EFE2C0] shadow-[inset_2px_0_0_#C99A2E]' : 'text-[#E7D5A4]/65 hover:text-[#EFE2C0] hover:bg-[#E7D5A4]/[0.04]')}>
        <Icon name={item.icon} size={16} className="shrink-0 opacity-80" />
        <span className="truncate">{item.label}</span>
        <Icon name="ChevronDown" size={13} className={cx('ml-auto opacity-50 transition-transform', !inside && '-rotate-90')} />
      </Link>
      {inside && item.children.length > 0 && (
        <ul className="ml-4 pl-2 border-l border-[#C99A2E]/15 mt-0.5 flex flex-col gap-0.5 list-none" aria-label={`${item.label} sections`}>
          {item.children.map((c) => <li key={c.to}><NavItem item={c} badge={badges[c.badge]} onNavigate={onNavigate} /></li>)}
        </ul>
      )}
    </div>
  );
};

const Sidebar = ({ nav, badges, onNavigate }) => {
  const { pathname } = useLocation();
  const [openMore, setOpenMore] = useState(() => pathname.startsWith('/admin-portal/ops'));
  const orgName = useSetting('general.organization_name', 'Tangy Sessions');
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-[#C99A2E]/15 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#B94717]" />
        <div className="leading-none">
          <div className="font-condensed text-[15px] uppercase tracking-wide text-[#EFE2C0]">{orgName}</div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#C99A2E]/70 mt-1">Admin Portal</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-4" aria-label="Admin navigation">
        {nav.map((group) => {
          const collapsed = group.collapsible && !openMore;
          return (
            <div key={group.group}>
              {group.collapsible ? (
                <button onClick={() => setOpenMore((o) => !o)} className="w-full flex items-center justify-between px-2.5 mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#E7D5A4]/60 hover:text-[#E7D5A4]/70" aria-expanded={!collapsed}>
                  {group.group} <Icon name="ChevronDown" size={13} className={cx('transition-transform', collapsed && '-rotate-90')} />
                </button>
              ) : (
                <div className="px-2.5 mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#E7D5A4]/60">{group.group}</div>
              )}
              {!collapsed && (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (item.children
                    ? <NavGroupItem key={item.to} item={item} badges={badges} onNavigate={onNavigate} />
                    : <NavItem key={item.to} item={item} badge={badges[item.badge]} onNavigate={onNavigate} />))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

// Admin / <section> / <sub-section> / <page crumbs> — the first part comes from
// the permission-built nav, the rest from the page (<Page crumbs>). The last
// crumb is the current page and isn't a link. Also sets document.title.
const Breadcrumbs = ({ nav, extra }) => {
  const { pathname } = useLocation();
  const flat = nav.flatMap((g) => g.items.flatMap((i) => [{ ...i, parent: null }, ...(i.children || []).map((c) => ({ ...c, parent: i }))]));
  const match = flat.filter((i) => !i.external && (pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const trail = [
    { label: 'Admin', to: '/admin-portal' },
    ...(match && match.to !== '/admin-portal' ? [...(match.parent ? [{ label: match.parent.label, to: match.parent.to }] : []), { label: match.label, to: match.to }] : []),
    ...(extra.crumbs || []),
  ];
  const title = extra.title || (match && match.to !== '/admin-portal' ? match.label : 'Dashboard');
  useEffect(() => { document.title = `Tangy Admin — ${title}`; }, [title]);
  if (trail.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E7D5A4]/60" data-breadcrumbs>
      <ol className="flex flex-wrap items-center gap-1.5 list-none m-0 p-0">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${c.to || c.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last || !c.to
                ? <span aria-current={last ? 'page' : undefined} className={cx('truncate max-w-[16rem]', last && 'text-[#E7D5A4]/70')}>{c.label}</span>
                : <Link to={c.to} className="hover:text-[#E7D5A4]">{c.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const initials = (user?.full_name || user?.email || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative ml-1" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
        className="flex items-center gap-2 h-10 pl-1 pr-2 rounded hover:bg-[#C99A2E]/10">
        <span className="w-8 h-8 rounded-full bg-[#C99A2E]/20 border border-[#C99A2E]/40 text-[#EFE2C0] font-mono text-[11px] inline-flex items-center justify-center">{initials}</span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-[12.5px] text-[#EFE2C0] max-w-[180px] truncate">{user?.full_name || user?.email}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#C99A2E]">{ROLE_LABELS[user?.role] || user?.role}</span>
        </span>
        <Icon name="ChevronDown" size={14} className="text-[#E7D5A4]/60" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 z-[500] bg-[#15110D] border border-[#C99A2E]/35 rounded-md shadow-[0_18px_50px_rgba(0,0,0,0.6)] py-1.5">
          <div className="px-3.5 py-2 border-b border-[#C99A2E]/15 mb-1">
            <div className="text-[13px] text-[#EFE2C0] truncate">{user?.full_name || '—'}</div>
            <div className="text-[11.5px] text-[#E7D5A4]/60 truncate">{user?.email}</div>
          </div>
          <Link role="menuitem" to="/admin-portal/notifications" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 h-9 text-[13px] text-[#E7D5A4]/80 hover:bg-[#C99A2E]/10"><Icon name="Bell" size={15} />Notifications</Link>
          <Link role="menuitem" to="/admin-portal/notifications/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 h-9 text-[13px] text-[#E7D5A4]/80 hover:bg-[#C99A2E]/10"><Icon name="Settings" size={15} />Notification settings</Link>
          <button role="menuitem" onClick={() => { setOpen(false); onSignOut(); }} className="w-full flex items-center gap-2.5 px-3.5 h-9 text-[13px] text-[#ef6b5e] hover:bg-[#a8322a]/10"><Icon name="LogOut" size={15} />Sign out</button>
        </div>
      )}
    </div>
  );
};

const QUICK_ACTIONS = [
  { label: 'Create event', to: '/admin-portal/events?new=1', requires: P.EVENTS_MANAGE, icon: 'Plus' },
  { label: 'Review pending applications', to: '/admin-portal/applications?status=pending', requires: P.APPLICATIONS_REVIEW, icon: 'Inbox' },
  { label: 'Add complimentary booking', to: '/admin-portal/bookings?comp=1', requires: P.BOOKINGS_MANAGE, icon: 'Ticket' },
  { label: 'New announcement', to: '/admin-portal/content/announcements?new=1', requires: P.CONTENT, icon: 'Megaphone' },
  { label: 'Open check-in terminal', to: '/check-in', requires: P.CHECKIN, icon: 'ScanLine' },
  { label: 'Invite a team member', to: '/admin-portal/users?invite=1', anyOf: [P.USERS_MANAGE, P.STAFF_INVITE], icon: 'UserPlus' },
];

const RESULT_ICON = { event: 'CalendarDays', artist: 'Mic', sponsor: 'Handshake', vendor: 'Store', 'venue host': 'Building2', volunteer: 'HeartHandshake', booking: 'Ticket', attendee: 'Users', message: 'MessagesSquare' };

// ⌘K: global, permission-scoped search (admin_search RPC — the database
// decides what each role may find) plus section jumps and quick actions.
const CommandPalette = ({ nav, onClose }) => {
  const { can, isMock } = useAdminSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const dq = useDebounced(q, 220);
  const [results, setResults] = useState({ q: '', rows: [], loading: false });
  useEffect(() => {
    const term = dq.trim();
    if (term.length < 2 || isMock) { setResults({ q: term, rows: [], loading: false }); return undefined; }
    let cancelled = false;
    setResults((r) => ({ ...r, loading: true }));
    adminApi.search(term).then(
      (rows) => { if (!cancelled) setResults({ q: term, rows: rows || [], loading: false }); },
      () => { if (!cancelled) setResults({ q: term, rows: [], loading: false }); });
    return () => { cancelled = true; };
  }, [dq, isMock]);
  const items = useMemo(() => {
    const all = [
      ...nav.flatMap((g) => g.items.flatMap((i) => [{ label: i.label, to: i.to, icon: i.icon, hint: g.group },
        ...(i.children || []).map((c) => ({ label: `${i.label} · ${c.label}`, to: c.to, icon: c.icon, hint: g.group }))])),
      ...QUICK_ACTIONS.filter((a) => can(a.requires, a.anyOf)).map((a) => ({ ...a, hint: 'Action' })),
    ];
    const t = q.trim().toLowerCase();
    const found = results.q && t.startsWith(results.q.toLowerCase().slice(0, 2))
      ? results.rows.map((r) => ({ label: r.title, sub: r.subtitle, to: r.link, icon: RESULT_ICON[r.kind] || 'Search', hint: r.kind, key: `${r.kind}-${r.id}` }))
      : [];
    return t ? [...found, ...all.filter((i) => i.label.toLowerCase().includes(t) || i.hint.toLowerCase().includes(t))] : all;
  }, [nav, q, can, results]);

  const go = (item) => { onClose(); navigate(item.to); };

  return (
    <div className="fixed inset-0 z-[480] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#17130F] border border-[#C99A2E]/40 rounded-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 border-b border-[#C99A2E]/20">
          <Icon name="Search" size={16} className="text-[#E7D5A4]/60" />
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
            placeholder="Search events, people, bookings — or jump to a section…"
            aria-label="Search the admin portal"
            className="flex-1 h-12 bg-transparent text-[14px] text-[#EFE2C0] placeholder:text-[#E7D5A4]/35 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-[#E7D5A4]/60 border border-[#E7D5A4]/20 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto py-1.5" role="listbox">
          {results.loading && <li className="px-4 py-2 text-[12px] text-[#E7D5A4]/60">Searching…</li>}
          {items.length === 0 && !results.loading && <li className="px-4 py-6 text-center text-[13px] text-[#E7D5A4]/60">No matches</li>}
          {items.map((item, i) => (
            <li key={item.key || `${item.hint}-${item.to}`} role="option" aria-selected={i === idx}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(item)}
                className={cx('w-full flex items-center gap-3 px-4 h-10 text-left text-[13px]', i === idx ? 'bg-[#C99A2E]/15 text-[#EFE2C0]' : 'text-[#E7D5A4]/75')}
              >
                <Icon name={item.icon} size={15} className="opacity-70" />
                <span className="flex-1 min-w-0 truncate">{item.label}{item.sub && <span className="ml-2 text-[#E7D5A4]/60">{item.sub}</span>}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[#E7D5A4]/60">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Each console section has its own material (globals.css .admin-bg-*): the
// page's navigation group decides which, by the longest matching nav link.
const SECTION_BG = { Operate: 'operate', People: 'people', Communicate: 'communicate', Insight: 'insight', System: 'system', 'More operations': 'more' };
function sectionBackground(pathname) {
  if (pathname === '/admin-portal' || pathname === '/admin-portal/') return 'dashboard';
  let best = null;
  for (const g of NAV) {
    for (const item of g.items) {
      if ((pathname === item.to || pathname.startsWith(`${item.to}/`)) && (!best || item.to.length > best.len)) best = { len: item.to.length, group: g.group };
    }
  }
  return SECTION_BG[best?.group] || 'operate';
}

export const AdminShell = ({ children }) => {
  const { user, perms, can, isMock } = useAdminSession();
  const signOut = useConsoleSignOut();
  const nav = useMemo(() => buildNav(perms ? [...perms] : []), [perms]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [crumbState, setCrumbState] = useState({ crumbs: [], title: null });
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
    <div data-lenis-prevent className="min-h-[100dvh] ui-texture text-[#E7D5A4] font-sans flex">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[600] bg-[#C99A2E] text-[#11100C] px-3 py-2 rounded">Skip to content</a>

      <aside className="hidden lg:block w-[236px] shrink-0 h-[100dvh] sticky top-0 ui-texture-deep border-r border-[#C99A2E]/15">
        <Sidebar nav={nav} badges={badges} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[420] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[270px] max-w-[85vw] ui-texture-deep border-r border-[#C99A2E]/25 animate-[drawerIn_0.18s_ease]">
            <Sidebar nav={nav} badges={badges} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className={`flex-1 min-w-0 flex flex-col admin-bg-${sectionBackground(pathname)}`} data-admin-section={sectionBackground(pathname)}>
        <header className="sticky top-0 z-[200] h-14 shrink-0 bg-[#11100C]/95 backdrop-blur-sm border-b border-[#C99A2E]/15 flex items-center gap-2 px-3 sm:px-5">
          <Button variant="ghost" size="sm" icon="Menu" className="lg:hidden" aria-label="Open navigation" onClick={() => setDrawerOpen(true)} />
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 h-9 w-72 max-w-[40vw] px-3 rounded-[4px] border border-[#C99A2E]/25 text-[12.5px] text-[#E7D5A4]/60 hover:border-[#C99A2E]/50"
          >
            <Icon name="Search" size={15} /> <span className="flex-1 text-left">Search the portal</span>
            <kbd className="font-mono text-[10px] border border-[#E7D5A4]/20 rounded px-1">⌘K</kbd>
          </button>
          <Button variant="ghost" size="sm" icon="Search" className="sm:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)} />
          <div className="flex-1" />
          {can(P.CHECKIN) && (
            <Button to="/check-in" size="sm" variant="secondary" icon="ScanLine">
              <span className="hidden sm:inline">Check-in</span>
            </Button>
          )}
          {!isMock && <NotificationBell userId={user?.id} allHref="/admin-portal/notifications" />}
          <UserMenu user={user} onSignOut={() => signOut()} />
        </header>

        <main id="admin-main" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <Breadcrumbs nav={nav} extra={crumbState} />
          <CrumbContext.Provider value={setCrumbState}>{children}</CrumbContext.Provider>
        </main>
      </div>

      {paletteOpen && <CommandPalette nav={nav} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};
