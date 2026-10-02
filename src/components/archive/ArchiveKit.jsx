import { Link, useSearchParams } from 'react-router-dom';
import { MediaImg } from '../ui/Media';
import { formatDate } from '../../hooks/useContent';

// Shared pieces for the archive listings (previous sessions, gallery archive,
// programmes). Filter state lives in the URL (?year=2025&tag=Monsoon&q=…&page=2)
// so a filtered view can be linked, reloaded and stepped through with
// Back/Forward.

export function useArchiveParams() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== 'page') next.delete('page');
    // Typing a search replaces the entry; filters and pages are steps in history.
    setParams(next, { replace: k === 'q' });
  };
  return { get, set, page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1) };
}

// A row of single-choice filter buttons ("All" + options).
export const FilterGroup = ({ label, name, options, value, onChange }) => (
  <fieldset className="border-0 m-0 p-0 min-w-0">
    <legend className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold mb-2">{label}</legend>
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" data-filter={name}>
      {[['', 'All'], ...options.map((o) => (Array.isArray(o) ? o : [o, o]))].map(([v, text]) => (
        <button
          key={v || 'all'}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`whitespace-nowrap min-h-[36px] px-3 font-mono text-[10px] font-bold uppercase tracking-widest border-2 flex-shrink-0 transition-colors ${
            value === v ? 'bg-[#C99A2E] border-[#C99A2E] text-[#11100C]' : 'border-[#C99A2E]/50 text-[#E7D5A4] hover:border-[#C99A2E]'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  </fieldset>
);

export const ArchiveSearch = ({ id, label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 w-full sm:w-80">
    <label htmlFor={id} className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold">{label}</label>
    <input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[44px] bg-[#191410] border border-[#C99A2E]/60 text-[#E7D5A4] px-3 font-mono text-xs focus:outline-none focus:border-[#C99A2E]"
    />
  </div>
);

export const PAGE_SIZE = 12;

export const Pagination = ({ page, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-center gap-3 mt-10 font-mono text-xs">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-[44px] px-4 border-2 border-[#C99A2E]/60 text-[#C99A2E] disabled:opacity-40">← Newer</button>
      <span aria-live="polite">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="min-h-[44px] px-4 border-2 border-[#C99A2E]/60 text-[#C99A2E] disabled:opacity-40">Older →</button>
    </nav>
  );
};

export const yearOf = (iso) => (iso ? String(iso).slice(0, 4) : '');

// A past-session card (previous sessions, programme pages).
export const PastSessionCard = ({ s }) => (
  <Link
    to={`/sessions/archive/${s.slug}`}
    data-past-session={s.slug}
    className="flex flex-col h-full bg-[#EFE2C0] text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]"
  >
    <div className="aspect-[16/10] bg-[#11100C]/10 overflow-hidden">
      {s.image_url && <MediaImg src={s.image_url} alt="" loading="lazy" className="w-full h-full object-cover grayscale-[40%]" />}
    </div>
    <div className="p-4 flex flex-col gap-1 flex-1">
      <div className="flex justify-between gap-2 font-mono text-[10px] font-bold uppercase text-[#7C2D18]">
        <span>{formatDate(s.event_date)}</span>
        {s.status === 'cancelled' && <span>Cancelled</span>}
      </div>
      <h3 className="font-condensed text-xl font-bold uppercase leading-tight m-0">{s.name}</h3>
      <p className="font-mono text-[11px] text-[#11100C]/75 m-0">{s.venue}</p>
      {s.artists?.length > 0 && <p className="font-body text-sm text-[#11100C]/80 m-0 mt-1">{s.artists.map((a) => a.stage_name || a.name).join(' · ')}</p>}
      {s.attendance_recorded != null && <p className="font-mono text-[10px] text-[#11100C]/70 m-0 mt-auto pt-2">{s.attendance_recorded} attended</p>}
    </div>
  </Link>
);
