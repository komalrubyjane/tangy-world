import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Music, CalendarDays, Inbox, CalendarCheck, Image, MessagesSquare, Bell, UserRound, FileText, Settings,
  Menu, X, LogOut, ExternalLink, ChevronRight, MapPin, Clock, AlertTriangle, CheckCircle2, Upload, Plus, Trash2, Play,
} from 'lucide-react';
import { cx } from './util';

// Artist Portal UI kit — a calm workspace: clear cards, subtle borders,
// restrained shadows, strong type, status pills. Tangy palette.
const ICONS = { LayoutDashboard, Music, CalendarDays, Inbox, CalendarCheck, Image, MessagesSquare, Bell, UserRound, FileText, Settings,
  Menu, X, LogOut, ExternalLink, ChevronRight, MapPin, Clock, AlertTriangle, CheckCircle2, Upload, Plus, Trash2, Play };
export const PIcon = ({ name, size = 18, className = '' }) => {
  const C = ICONS[name];
  return C ? <C size={size} strokeWidth={1.75} className={className} aria-hidden="true" /> : null;
};


export const PageHeader = ({ title, kicker, description, actions }) => (
  <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
    <div className="min-w-0">
      {kicker && <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C99A2E] m-0 mb-1">{kicker}</p>}
      <h1 className="font-condensed text-3xl sm:text-4xl uppercase tracking-wide text-[#F3E7C9] m-0 leading-none">{title}</h1>
      {description && <p className="text-sm text-[#E7D5A4]/75 mt-2 mb-0 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);

export const Card = ({ title, action, children, className = '', as: As = 'section', ...rest }) => (
  <As className={cx('bg-[#1C1814] border border-[#E7D5A4]/12 rounded-lg p-4 sm:p-5 shadow-[0_1px_0_rgba(0,0,0,0.3)]', className)} {...rest}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-3">
        {title && <h2 className="font-condensed text-lg uppercase tracking-wide text-[#F3E7C9] m-0">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </As>
);

const PILL = {
  good: 'bg-[#3E8E5E]/15 text-[#7FD3A0] border-[#3E8E5E]/40',
  warn: 'bg-[#C99A2E]/15 text-[#E9C46A] border-[#C99A2E]/45',
  bad: 'bg-[#B5532A]/15 text-[#F08A6A] border-[#B5532A]/45',
  info: 'bg-[#4F6D8A]/20 text-[#A9C4DE] border-[#4F6D8A]/50',
  muted: 'bg-[#E7D5A4]/5 text-[#E7D5A4]/70 border-[#E7D5A4]/20',
};
const STATUS = {
  // requests
  pending: ['Pending', 'warn'], viewed: ['Viewed', 'warn'], accepted: ['Accepted', 'good'], confirmed: ['Confirmed', 'good'],
  declined: ['Declined', 'bad'], expired: ['Expired', 'muted'], cancelled: ['Cancelled', 'bad'], completed: ['Completed', 'muted'], draft: ['Draft', 'muted'],
  // applications
  submitted: ['Submitted', 'info'], under_review: ['Under review', 'info'], needs_information: ['Needs information', 'warn'],
  approved: ['Approved', 'good'], rejected: ['Not selected', 'bad'], withdrawn: ['Withdrawn', 'muted'],
  // media
  uploaded: ['Draft', 'muted'], archived: ['Archived', 'muted'],
  // availability
  available: ['Available', 'good'], tentative: ['Tentative', 'warn'], unavailable: ['Unavailable', 'bad'],
  // sessions
  upcoming: ['Upcoming', 'info'], past: ['Past', 'muted'],
};
export const StatusPill = ({ status, label }) => {
  const [text, tone] = STATUS[status] || [status, 'muted'];
  return <span className={cx('inline-flex items-center h-6 px-2 rounded-full border text-[11px] font-medium whitespace-nowrap', PILL[tone])} data-status={status}>{label || text}</span>;
};

export const StatTile = ({ to, label, value, hint, icon }) => {
  const body = (
    <>
      <div className="flex items-center justify-between text-[#E7D5A4]/70 text-xs uppercase tracking-wider">{label}{icon && <PIcon name={icon} size={16} />}</div>
      <div className="font-condensed text-4xl text-[#F3E7C9] leading-none mt-2">{value}</div>
      {hint && <div className="text-xs text-[#E7D5A4]/65 mt-1">{hint}</div>}
    </>
  );
  const cls = 'block bg-[#1C1814] border border-[#E7D5A4]/12 rounded-lg p-4 hover:border-[#C99A2E]/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]';
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
};

export const Btn = ({ to, href, variant = 'default', size = 'md', icon, children, className = '', ...rest }) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A2E]';
  const sizes = { sm: 'min-h-[36px] px-3 text-xs', md: 'min-h-[44px] px-4 text-sm' };
  const variants = {
    primary: 'bg-[#C99A2E] text-[#14110D] hover:bg-[#E0B44A]',
    default: 'bg-[#2A241D] text-[#F3E7C9] border border-[#E7D5A4]/20 hover:border-[#C99A2E]/60',
    ghost: 'text-[#E7D5A4] hover:bg-[#E7D5A4]/5',
    danger: 'bg-[#B5532A]/90 text-[#F3E7C9] hover:bg-[#B5532A]',
    success: 'bg-[#3E8E5E] text-[#F3E7C9] hover:bg-[#4BA06C]',
  };
  const cls = cx(base, sizes[size], variants[variant], className);
  const inner = <>{icon && <PIcon name={icon} size={16} />}{children}</>;
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
};

export const Loading = ({ label = 'Loading…' }) => <p role="status" className="text-sm text-[#E7D5A4]/70 py-6 m-0">{label}</p>;
export const ErrorNote = ({ error, onRetry }) => (
  <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-[#F08A6A] bg-[#B5532A]/10 border border-[#B5532A]/40 rounded-md p-3">
    <PIcon name="AlertTriangle" size={16} />{error?.message || 'Something went wrong.'}
    {onRetry && <Btn size="sm" onClick={onRetry}>Try again</Btn>}
  </div>
);
export const Empty = ({ title, children, action }) => (
  <div className="text-center py-10 px-4 border border-dashed border-[#E7D5A4]/20 rounded-lg">
    <p className="font-condensed text-lg uppercase text-[#F3E7C9] m-0">{title}</p>
    {children && <p className="text-sm text-[#E7D5A4]/70 mt-1 mb-0">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const FIELD = 'w-full min-h-[44px] bg-[#14110D] border border-[#E7D5A4]/20 rounded-md px-3 text-sm text-[#F3E7C9] placeholder:text-[#E7D5A4]/40 focus:outline-none focus:border-[#C99A2E]';
export const Field = ({ label, hint, error, children, id }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-medium text-[#E7D5A4]/85">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-[#E7D5A4]/60 m-0">{hint}</p>}
    {error && <p role="alert" className="text-xs text-[#F08A6A] m-0">{error}</p>}
  </div>
);
export const Input = (props) => <input className={FIELD} {...props} />;
export const Textarea = (props) => <textarea className={cx(FIELD, 'py-2 min-h-[96px]')} {...props} />;
export const Select = ({ children, ...props }) => <select className={FIELD} {...props}>{children}</select>;

// Selectable chips (multi- or single-select), keyboard accessible.
export const Chips = ({ label, options, value, onChange, multiple = true, name }) => (
  <fieldset className="border-0 m-0 p-0 min-w-0">
    <legend className="text-xs font-medium text-[#E7D5A4]/85 mb-2">{label}</legend>
    <div className="flex flex-wrap gap-2" data-chips={name}>
      {options.map((o) => {
        const on = multiple ? (value || []).includes(o) : value === o;
        return (
          <button key={o} type="button" aria-pressed={on}
            onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o) : [...(value || []), o]) : (on ? '' : o))}
            className={cx('min-h-[36px] px-3 rounded-full border text-xs transition-colors', on ? 'bg-[#C99A2E] border-[#C99A2E] text-[#14110D]' : 'border-[#E7D5A4]/25 text-[#E7D5A4] hover:border-[#C99A2E]/70')}>
            {o}
          </button>
        );
      })}
    </div>
  </fieldset>
);
