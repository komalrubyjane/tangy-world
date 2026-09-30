import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, CalendarDays, Ticket, Users, ScanLine, History, ListChecks, Contact, UsersRound,
  ShieldCheck, Megaphone, Info, BarChart3, ScrollText, Settings, Sparkles, MessagesSquare, Mail, Hourglass,
  BellRing, DoorOpen, Tv, Search, LogOut, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, Menu, Plus,
  Check, TriangleAlert, Lock, RefreshCw, Download, QrCode, ArrowUpRight, MapPin, Clock, Pencil, Trash2, Ban,
  CircleCheck, CircleX, Eye, UserPlus, Activity, Command,
  Bell, Send, FileText, ClipboardList, KeyRound, Timer, Music, Handshake, Store, Building2, HeartHandshake, CheckCheck,
  Plane, Utensils, Wallet, CalendarClock, Mic, User, Link2, ShieldAlert, Gauge,
  Upload, Image, Video, Paperclip, Columns3, List, Receipt, Filter, UserCheck, ArrowUp, ArrowDown,
} from 'lucide-react';

// Tangy admin UI kit. Palette + type follow the site's design system
// (ink #11100C, gold #C99A2E, cream #E7D5A4; Oswald headings, DM Mono
// metadata) but tuned for dense, scannable operational screens.

const ICONS = {
  LayoutDashboard, Inbox, CalendarDays, Ticket, Users, ScanLine, History, ListChecks, Contact, UsersRound,
  ShieldCheck, Megaphone, Info, BarChart3, ScrollText, Settings, Sparkles, MessagesSquare, Mail, Hourglass,
  BellRing, DoorOpen, Tv, Search, LogOut, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, Menu, Plus,
  Check, TriangleAlert, Lock, RefreshCw, Download, QrCode, ArrowUpRight, MapPin, Clock, Pencil, Trash2, Ban,
  CircleCheck, CircleX, Eye, UserPlus, Activity, Command,
  Bell, Send, FileText, ClipboardList, KeyRound, Timer, Music, Handshake, Store, Building2, HeartHandshake, CheckCheck,
  Plane, Utensils, Wallet, CalendarClock, Mic, User, Link2, ShieldAlert, Gauge,
  Upload, Image, Video, Paperclip, Columns3, List, Receipt, Filter, UserCheck, ArrowUp, ArrowDown,
};

export const Icon = ({ name, size = 16, className = '', ...rest }) => {
  const Cmp = ICONS[name];
  return Cmp ? <Cmp size={size} strokeWidth={1.75} className={className} aria-hidden="true" {...rest} /> : null;
};

export const cx = (...parts) => parts.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// Deep pages add their own breadcrumbs (e.g. the resource's name) and title;
// AdminShell renders them after the nav-derived trail.
export const CrumbContext = createContext(() => {});

export const Page = ({ title, subtitle, actions, children, back, crumbs, docTitle }) => {
  const setCrumbs = useContext(CrumbContext);
  const key = JSON.stringify(crumbs || null) + (docTitle || '');
  useEffect(() => {
    setCrumbs({ crumbs: crumbs || [], title: docTitle || (crumbs?.length ? crumbs[crumbs.length - 1].label : null) });
    return () => setCrumbs({ crumbs: [], title: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setCrumbs]);
  return (
  <div className="flex flex-col gap-5 min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[#E7D5A4]/55 hover:text-[#E7D5A4] mb-1.5">
            <Icon name="ChevronLeft" size={14} /> {back.label}
          </Link>
        )}
        <h1 className="font-condensed text-2xl md:text-[28px] leading-none font-semibold tracking-tight uppercase text-[#EFE2C0] m-0">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-[#E7D5A4]/60 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
    {children}
  </div>
  );
};

export const Panel = ({ title, subtitle, actions, children, className = '', bodyClassName = '', flush = false }) => (
  <section className={cx('bg-[#17130F] border border-[#C99A2E]/20 rounded-md min-w-0', className)}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#C99A2E]/15">
        <div className="min-w-0">
          {title && <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#C99A2E] m-0">{title}</h2>}
          {subtitle && <p className="text-[12px] text-[#E7D5A4]/60 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    <div className={cx(flush ? '' : 'p-4', bodyClassName)}>{children}</div>
  </section>
);

export const Grid = ({ cols = 4, children, className = '' }) => {
  const map = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
  };
  return <div className={cx('grid gap-3', map[cols], className)}>{children}</div>;
};

export const StatTile = ({ label, value, sub, to, tone }) => {
  const toneClass = { warn: 'text-[#f5b544]', danger: 'text-[#ef6b5e]', good: 'text-[#5fd3a0]' }[tone] || 'text-[#EFE2C0]';
  const body = (
    <>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#E7D5A4]/55">{label}</div>
      <div className={cx('mt-1.5 font-condensed text-[26px] leading-none font-medium tabular-nums', toneClass)}>{value ?? '—'}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-[#E7D5A4]/60 leading-snug">{sub}</div>}
    </>
  );
  const cls = 'block bg-[#17130F] border border-[#C99A2E]/20 rounded-md p-3.5 min-w-0';
  return to ? (
    <Link to={to} className={cx(cls, 'hover:border-[#C99A2E]/60 transition-colors')}>{body}</Link>
  ) : <div className={cls}>{body}</div>;
};

export const KeyValue = ({ items }) => (
  <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-[13px]">
    {items.filter(Boolean).map(([k, v]) => (
      <div key={k} className="contents">
        <dt className="font-mono text-[10.5px] uppercase tracking-wider text-[#E7D5A4]/60 pt-0.5">{k}</dt>
        <dd className="m-0 text-[#E7D5A4] break-words min-w-0">{v ?? '—'}</dd>
      </div>
    ))}
  </dl>
);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

const BTN = {
  primary: 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] hover:bg-[#dcb14a]',
  secondary: 'bg-transparent text-[#E7D5A4] border-[#C99A2E]/35 hover:border-[#C99A2E] hover:bg-[#C99A2E]/10',
  ghost: 'bg-transparent text-[#E7D5A4]/75 border-transparent hover:text-[#E7D5A4] hover:bg-[#C99A2E]/10',
  danger: 'bg-[#a8322a] text-white border-[#a8322a] hover:bg-[#c23b31]',
  success: 'bg-[#1f8a5b] text-white border-[#1f8a5b] hover:bg-[#25a06a]',
};

export const Button = ({ variant = 'secondary', size = 'md', icon, children, className = '', to, type = 'button', ...rest }) => {
  const sizes = { sm: 'h-8 px-2.5 text-[11px] gap-1.5', md: 'h-9 px-3.5 text-[12px] gap-2', lg: 'h-11 px-5 text-[13px] gap-2' };
  const cls = cx(
    'inline-flex items-center justify-center rounded-[4px] border font-mono uppercase tracking-[0.08em] font-medium whitespace-nowrap transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A2E]',
    BTN[variant], sizes[size], className
  );
  const content = <>{icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}{children}</>;
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  return <button type={type} className={cls} {...rest}>{content}</button>;
};

const FIELD = 'w-full bg-[#11100C] border border-[#C99A2E]/30 rounded-[4px] px-3 text-[13px] text-[#EFE2C0] placeholder:text-[#E7D5A4]/30 focus:outline-none focus:border-[#C99A2E] focus:ring-1 focus:ring-[#C99A2E]/40 disabled:opacity-50';

export const Input = ({ className = '', ...rest }) => <input className={cx(FIELD, 'h-9', className)} {...rest} />;
export const Textarea = ({ className = '', rows = 3, ...rest }) => <textarea rows={rows} className={cx(FIELD, 'py-2 leading-relaxed', className)} {...rest} />;
export const Select = ({ className = '', children, ...rest }) => (
  <select className={cx(FIELD, 'h-9 pr-8 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23C99A2E%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_10px_center]', className)} {...rest}>
    {children}
  </select>
);

export const Field = ({ label, hint, error, children, className = '' }) => (
  <label className={cx('flex flex-col gap-1.5 min-w-0', className)}>
    <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#C99A2E]/85">{label}</span>
    {children}
    {hint && !error && <span className="text-[11.5px] text-[#E7D5A4]/60">{hint}</span>}
    {error && <span className="text-[11.5px] text-[#ef6b5e]">{error}</span>}
  </label>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={cx('relative w-full sm:w-72', className)}>
    <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#E7D5A4]/60 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(FIELD, 'h-9 pl-8')}
    />
  </div>
);

export const Toolbar = ({ children, right }) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">{children}</div>
    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </div>
);

export const FilterSelect = ({ label, value, onChange, options, className = '' }) => (
  <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx('w-auto min-w-[140px]', className)}>
    {options.map((o) => {
      const opt = typeof o === 'string' ? { value: o, label: o } : o;
      return <option key={opt.value} value={opt.value}>{opt.label}</option>;
    })}
  </Select>
);

// Tabs with `to` are real links (each subsection has its own URL); without
// `to` they switch local state (for in-page views only).
const TAB_CLS = (active) => cx(
  'shrink-0 h-9 px-3 inline-flex items-center font-mono text-[11px] uppercase tracking-[0.1em] border-b-2 -mb-px transition-colors whitespace-nowrap',
  active ? 'border-[#C99A2E] text-[#EFE2C0]' : 'border-transparent text-[#E7D5A4]/60 hover:text-[#E7D5A4]'
);
export const Tabs = ({ tabs, value, onChange }) => (tabs.some((t) => t.to) ? (
  <nav aria-label="Sections" className="flex gap-0.5 overflow-x-auto border-b border-[#C99A2E]/20 -mx-1 px-1 scrollbar-none">
    {tabs.map((t) => (
      <NavLink key={t.id} to={t.to} end={t.end ?? true} className={({ isActive }) => TAB_CLS(t.active ?? isActive)}>
        {t.label}
        {typeof t.count === 'number' && <span className="ml-1.5 text-[#E7D5A4]/60">{t.count}</span>}
      </NavLink>
    ))}
  </nav>
) : (
  <div role="tablist" className="flex gap-0.5 overflow-x-auto border-b border-[#C99A2E]/20 -mx-1 px-1 scrollbar-none">
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={value === t.id}
        onClick={() => onChange(t.id)}
        className={cx(
          'shrink-0 h-9 px-3 font-mono text-[11px] uppercase tracking-[0.1em] border-b-2 -mb-px transition-colors',
          value === t.id ? 'border-[#C99A2E] text-[#EFE2C0]' : 'border-transparent text-[#E7D5A4]/60 hover:text-[#E7D5A4]'
        )}
      >
        {t.label}
        {typeof t.count === 'number' && <span className="ml-1.5 text-[#E7D5A4]/60">{t.count}</span>}
      </button>
    ))}
  </div>
));

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

const TONE = {
  good: 'bg-[#1f8a5b]/15 text-[#5fd3a0] border-[#1f8a5b]/40',
  warn: 'bg-[#d4911c]/15 text-[#f5b544] border-[#d4911c]/40',
  bad: 'bg-[#a8322a]/15 text-[#ef6b5e] border-[#a8322a]/45',
  info: 'bg-[#465667]/25 text-[#9fb6cc] border-[#465667]/60',
  gold: 'bg-[#C99A2E]/15 text-[#e4bd5c] border-[#C99A2E]/45',
  muted: 'bg-[#E7D5A4]/5 text-[#E7D5A4]/60 border-[#E7D5A4]/20',
};

const STATUS_TONE = {
  approved: 'good', confirmed: 'good', valid: 'good', published: 'good', done: 'good', active: 'good',
  checked_in: 'info', 'on-sale': 'good', live: 'gold', upcoming: 'info', completed: 'muted', past: 'muted',
  pending: 'warn', assigned: 'warn', in_progress: 'info', scheduled: 'info', 'sold-out': 'gold',
  rejected: 'bad', cancelled: 'bad', refunded: 'bad', failed: 'bad', declined: 'bad', deactivated: 'bad',
  draft: 'muted', archived: 'muted', expired: 'muted', complimentary: 'gold', manual: 'gold', qr: 'muted',
  super_admin: 'gold', admin: 'info', staff: 'good',
};

export const Badge = ({ status, tone, children }) => {
  const t = tone || STATUS_TONE[status] || 'muted';
  return (
    <span className={cx('inline-flex items-center h-5 px-1.5 rounded-[3px] border font-mono text-[10px] uppercase tracking-[0.06em] whitespace-nowrap', TONE[t])}>
      {children ?? String(status || '').replace(/_/g, ' ')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const EmptyState = ({ title = 'Nothing here yet', hint, action, icon = 'Inbox' }) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-12 px-4">
    <Icon name={icon} size={22} className="text-[#C99A2E]/50" />
    <div className="font-condensed text-base uppercase tracking-wide text-[#E7D5A4]/80">{title}</div>
    {hint && <p className="text-[12.5px] text-[#E7D5A4]/60 max-w-sm">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div role="alert" className="flex flex-col items-center justify-center text-center gap-2 py-10 px-4">
    <Icon name={error?.forbidden ? 'Lock' : 'TriangleAlert'} size={22} className="text-[#ef6b5e]" />
    <div className="text-[13px] text-[#E7D5A4]/85">{error?.message || 'Something went wrong.'}</div>
    {onRetry && !error?.forbidden && <Button size="sm" icon="RefreshCw" onClick={onRetry}>Retry</Button>}
  </div>
);

export const Forbidden = ({ message = "You don't have permission to access this section." }) => (
  <div className="flex flex-col items-center justify-center text-center gap-3 py-20 px-4">
    <Icon name="Lock" size={28} className="text-[#C99A2E]/70" />
    <div className="font-condensed text-xl uppercase tracking-wide text-[#EFE2C0]">Access restricted</div>
    <p className="text-[13px] text-[#E7D5A4]/55 max-w-sm">{message}</p>
    <Button to="/admin-portal" size="sm">Back to dashboard</Button>
  </div>
);

export const NotFound = ({ what = 'page' }) => (
  <div className="flex flex-col items-center justify-center text-center gap-3 py-20 px-4">
    <div className="font-condensed text-xl uppercase tracking-wide text-[#EFE2C0]">Not found</div>
    <p className="text-[13px] text-[#E7D5A4]/55">This {what} doesn't exist or you can't access it.</p>
    <Button to="/admin-portal" size="sm">Back to dashboard</Button>
  </div>
);

export const Skeleton = ({ rows = 5 }) => (
  <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-7 rounded-[3px] bg-[#E7D5A4]/[0.04]" style={{ opacity: 1 - i * 0.12 }} />
    ))}
  </div>
);

// Wraps an async section: loading → error → empty → content.
export const AsyncBlock = ({ loading, error, empty, emptyProps, onRetry, children, rows }) => {
  if (loading) return <Skeleton rows={rows} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (empty) return <EmptyState {...emptyProps} />;
  return children;
};

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

// Real <table> from md up, stacked cards below — same columns config.
export const DataTable = ({ columns, rows, rowKey = 'id', onRowClick, loading, error, onRetry, empty, dense = false }) => {
  if (loading && rows.length === 0) return <Skeleton rows={6} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (rows.length === 0) return <EmptyState {...(empty || {})} />;
  const visible = columns.filter((c) => !c.hidden);
  return (
    <div className={cx('relative', loading && 'opacity-60 transition-opacity')}>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-[#C99A2E]/20">
              {visible.map((c) => (
                <th key={c.key} scope="col" className={cx('px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#E7D5A4]/60 whitespace-nowrap', c.align === 'right' && 'text-right', c.width)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cx('border-b border-[#E7D5A4]/[0.06] last:border-0', onRowClick && 'cursor-pointer hover:bg-[#C99A2E]/[0.06] focus:outline-none focus:bg-[#C99A2E]/[0.08]')}
              >
                {visible.map((c) => (
                  <td key={c.key} className={cx('px-4 align-middle', dense ? 'py-1.5' : 'py-2.5', c.align === 'right' && 'text-right tabular-nums', c.cellClass)}>
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden flex flex-col divide-y divide-[#E7D5A4]/[0.06]">
        {rows.map((row) => (
          <li
            key={row[rowKey]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cx('px-4 py-3 flex flex-col gap-1.5', onRowClick && 'active:bg-[#C99A2E]/10')}
          >
            {visible.filter((c) => !c.mobileHidden).map((c, i) => (
              <div key={c.key} className={cx('flex justify-between gap-3 text-[13px]', i === 0 && 'font-medium')}>
                {i > 0 && <span className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60 shrink-0 pt-0.5">{c.header}</span>}
                <span className={cx('min-w-0 break-words', i > 0 && 'text-right')}>{c.render ? c.render(row) : row[c.key] ?? '—'}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Pagination = ({ page, pageCount, count, pageSize, setPage }) => {
  if (!count) return null;
  const from = page * pageSize + 1;
  const to = Math.min(count, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#C99A2E]/15 font-mono text-[11px] text-[#E7D5A4]/55">
      <span className="tabular-nums">{from}–{to} of {count.toLocaleString('en-IN')}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" icon="ChevronLeft" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} />
        <span className="tabular-nums px-1">{page + 1} / {pageCount}</span>
        <Button size="sm" variant="ghost" icon="ChevronRight" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

function useEscape(onClose, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, active]);
}

export { useFocusTrap } from '../hooks/useFocusTrap';
import { useFocusTrap } from '../hooks/useFocusTrap';

// `inline` renders the same content as a section of a detail page (used when
// the URL names the resource, e.g. /admin-portal/bookings/:id).
export const Drawer = ({ title, subtitle, onClose, children, footer, width = 'sm:max-w-xl', inline = false }) => {
  const ref = useRef(null);
  useEscape(onClose, !inline);
  useFocusTrap(ref, !inline);
  if (inline) {
    return (
      <section className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md min-w-0 flex flex-col" aria-label={typeof title === 'string' ? title : undefined} data-detail-page>
        <header className="px-5 py-4 border-b border-[#C99A2E]/15">
          <h2 className="font-condensed text-lg uppercase tracking-wide text-[#EFE2C0] m-0">{title}</h2>
          {subtitle && <div className="text-[12px] text-[#E7D5A4]/55 mt-0.5">{subtitle}</div>}
        </header>
        <div className="px-5 py-4 flex flex-col gap-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-[#C99A2E]/15 flex flex-wrap justify-end gap-2">{footer}</footer>}
      </section>
    );
  }
  return (
    <div className="fixed inset-0 z-[10020] flex justify-end" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cx('relative w-full h-full bg-[#15110D] border-l border-[#C99A2E]/30 flex flex-col animate-[drawerIn_0.18s_ease] outline-none', width)}>
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#C99A2E]/15">
          <div className="min-w-0">
            <h2 className="font-condensed text-lg uppercase tracking-wide text-[#EFE2C0] m-0 truncate">{title}</h2>
            {subtitle && <div className="text-[12px] text-[#E7D5A4]/55 mt-0.5">{subtitle}</div>}
          </div>
          <Button variant="ghost" size="sm" icon="X" aria-label="Close" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-[#C99A2E]/15 flex flex-wrap justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );
};

export const Modal = ({ title, onClose, children, footer, wide = false }) => {
  const ref = useRef(null);
  useEscape(onClose);
  useFocusTrap(ref);
  return (
    <div className="fixed inset-0 z-[10030] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cx('relative w-full bg-[#15110D] border border-[#C99A2E]/35 rounded-t-lg sm:rounded-md max-h-[92dvh] flex flex-col outline-none', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#C99A2E]/15">
          <h2 className="font-condensed text-base uppercase tracking-wide text-[#EFE2C0] m-0">{title}</h2>
          <Button variant="ghost" size="sm" icon="X" aria-label="Close" onClick={onClose} />
        </header>
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-[#C99A2E]/15 flex flex-wrap justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );
};

// Confirmation with optional required reason/extra fields. `onConfirm`
// receives the field values and may throw — the error is shown inline.
export const ConfirmDialog = ({ title, message, confirmLabel = 'Confirm', tone = 'primary', fields = [], onConfirm, onClose }) => {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.initial || ''])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const missing = fields.some((f) => f.required && !String(values[f.name] || '').trim());

  const submit = async (e) => {
    e?.preventDefault();
    if (missing || busy) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm(values);
      onClose();
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={busy ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={tone} onClick={submit} disabled={missing || busy}>{busy ? 'Working…' : confirmLabel}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {message && <div className="text-[13px] text-[#E7D5A4]/80 leading-relaxed">{message}</div>}
        {fields.map((f) => (
          <Field key={f.name} label={`${f.label}${f.required ? ' *' : ''}`} hint={f.hint}>
            {f.multiline ? (
              <Textarea autoFocus={f.autoFocus} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} />
            ) : (
              <Input autoFocus={f.autoFocus} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} />
            )}
          </Field>
        ))}
        {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e] bg-[#a8322a]/10 border border-[#a8322a]/40 rounded px-3 py-2">{error}</div>}
      </form>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((message, tone = 'good') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[10040] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          // Toasts carry no controls, so they never block clicks on what's underneath (e.g. a modal's Save).
          <div key={t.id} className={cx('pointer-events-none max-w-sm w-full sm:w-auto px-4 py-2.5 rounded-md border text-[13px] shadow-lg bg-[#1b1611]', t.tone === 'bad' ? 'border-[#a8322a]/60 text-[#ef6b5e]' : 'border-[#1f8a5b]/50 text-[#9fe6c2]')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const fmt = {
  money: (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`),
  num: (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN')),
  date: (d) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'),
  dateTime: (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'),
  time: (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'),
  pct: (n) => (n == null ? '—' : `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`),
  relative: (d) => {
    if (!d) return '—';
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
    return fmt.date(d);
  },
};
