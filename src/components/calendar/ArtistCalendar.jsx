import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { iso, parseDay, monthGrid, WEEKDAYS, fmtDay } from '../../lib/calendarDates';
import { ENTRY } from './availabilityMeta';
import { useArtistCalendar } from './calendarData';

const cx = (...a) => a.filter(Boolean).join(' ');

// What a day "is" at a glance: booked beats the artist's own mark.
function dayState(entries) {
  if (entries.some((e) => e.kind === 'confirmed')) return 'confirmed';
  for (const k of ['unavailable', 'tentative', 'available']) if (entries.some((e) => e.kind === k)) return k;
  if (entries.some((e) => e.kind === 'pending')) return 'pending';
  return null;
}
const DAY_LABEL = { confirmed: 'Booked', unavailable: 'Unavailable', tentative: 'Tentative', available: 'Available', pending: 'Request' };
const DAY_TINT = { confirmed: 'bg-[#3E8E5E]/15', unavailable: 'bg-[#B5532A]/12', tentative: 'bg-[#4F6D8A]/15', available: 'bg-[#1f8a5b]/8', pending: '' };

const Entry = ({ e, to, compact }) => {
  const meta = ENTRY[e.kind] || ENTRY.tentative;
  const body = (
    <>
      <span className="sr-only">{meta.label}: </span>
      <span className="block truncate font-medium">{e.title}</span>
      {!compact && e.detail && <span className="block opacity-80">{e.detail}</span>}
      {!compact && e.venue && <span className="block opacity-70">{e.venue}</span>}
    </>
  );
  const cls = cx('block rounded px-1.5 py-1 text-[11px] leading-tight', meta.cls);
  return to
    ? <Link to={to} data-cal-entry={e.kind} className={cx(cls, 'hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]')}>{body}</Link>
    : <span data-cal-entry={e.kind} className={cls}>{body}</span>;
};

export function ArtistCalendar({ artistId, linkFor = () => null, view: viewProp, onViewChange, date: dateProp, onDateChange, toolbar, defaultView = 'month' }) {
  const [viewState, setViewState] = useState(defaultView);
  const [dateState, setDateState] = useState(() => iso(new Date()));
  const view = viewProp || viewState;
  const anchorKey = dateProp || dateState;
  const anchor = parseDay(anchorKey);
  const setView = onViewChange || setViewState;
  const setDate = onDateChange || setDateState;

  const grid = useMemo(() => monthGrid(anchor.getFullYear(), anchor.getMonth()), [anchor.getFullYear(), anchor.getMonth()]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - ((anchor.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const today = iso(new Date());
  const from = view === 'week' ? iso(week[0]) : view === 'agenda' ? today : iso(grid[0]);
  const to = view === 'week' ? iso(week[6]) : view === 'agenda' ? iso(new Date(Date.now() + 180 * 864e5)) : iso(grid[41]);
  const { entries, loading, error } = useArtistCalendar(artistId, from, to);
  const byDay = useMemo(() => {
    const m = {};
    for (const e of entries) (m[e.day] ||= []).push(e);
    return m;
  }, [entries]);
  const shift = (n) => {
    const d = view === 'week' ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * n) : new Date(anchor.getFullYear(), anchor.getMonth() + n, 1);
    setDate(iso(d));
  };
  const heading = view === 'week' ? `${fmtDay(iso(week[0]))} – ${fmtDay(iso(week[6]))}` : view === 'agenda' ? 'Next six months'
    : anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  // Month cells list sessions and requests; the artist's own marks show as the day's label.
  const listed = (k) => (byDay[k] || []).filter((e) => !['available', 'tentative', 'unavailable'].includes(e.kind));

  return (
    <div className="min-w-0" data-artist-calendar>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div role="group" aria-label="Calendar view" className="flex rounded-md border border-[#E7D5A4]/20 overflow-hidden">
          {['month', 'week', 'agenda'].map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={cx('min-h-[44px] px-4 text-sm capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]', view === v ? 'bg-[#C99A2E] text-[#14110D]' : 'hover:bg-[#E7D5A4]/5')}>{v}</button>
          ))}
        </div>
        <span className="flex-1" />
        {toolbar?.(entries)}
      </div>
      <div className="flex flex-wrap gap-2 mb-3 text-[11px]" aria-label="Legend">
        {Object.entries(ENTRY).map(([k, v]) => <span key={k} className={cx('px-2 py-0.5 rounded', v.cls)}>{v.label}</span>)}
      </div>
      <div className="flex items-center justify-between mb-3">
        {view !== 'agenda' ? <button type="button" onClick={() => shift(-1)} aria-label={view === 'week' ? 'Previous week' : 'Previous month'} className="min-w-[44px] min-h-[44px] rounded-md hover:bg-[#E7D5A4]/5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">‹</button> : <span />}
        <h2 className="font-condensed text-xl uppercase text-[#F3E7C9] m-0" aria-live="polite">{heading}</h2>
        {view !== 'agenda' ? <button type="button" onClick={() => shift(1)} aria-label={view === 'week' ? 'Next week' : 'Next month'} className="min-w-[44px] min-h-[44px] rounded-md hover:bg-[#E7D5A4]/5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">›</button> : <span />}
      </div>
      {error && <p role="alert" className="text-sm text-[#ef6b5e]">{error.message || 'The calendar could not be loaded.'}</p>}
      {loading ? <p className="text-sm text-[#E7D5A4]/70" role="status">Loading calendar…</p> : view === 'month' ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[560px]" data-calendar-view="month">
            {WEEKDAYS.map((w) => <div key={w} className="text-center text-[11px] text-[#E7D5A4]/60 pb-1" aria-hidden="true">{w}</div>)}
            {grid.map((d) => {
              const k = iso(d);
              const st = dayState(byDay[k] || []);
              const items = listed(k);
              return (
                <div key={k} data-day={k} data-day-state={st || ''} className={cx('min-h-[92px] rounded-md border border-[#E7D5A4]/10 p-1 flex flex-col gap-1', st && DAY_TINT[st], d.getMonth() !== anchor.getMonth() && 'opacity-40', k === today && 'border-[#C99A2E]')}>
                  <span className="flex items-center justify-between gap-1">
                    <span className={cx('text-xs', k === today ? 'text-[#C99A2E] font-bold' : 'text-[#E7D5A4]/70')}>{d.getDate()}</span>
                    {st && st !== 'pending' && <span className="text-[9px] uppercase tracking-wide text-[#E7D5A4]/75">{DAY_LABEL[st]}</span>}
                  </span>
                  {items.slice(0, 3).map((e, i) => <Entry key={i} e={e} to={linkFor(e)} compact />)}
                  {items.length > 3 && <button type="button" className="text-[10px] text-left text-[#E7D5A4]/70 underline" onClick={() => { setView('week'); setDate(k); }}>+{items.length - 3} more</button>}
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'week' ? (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2" data-calendar-view="week">
          {week.map((d) => {
            const k = iso(d);
            return (
              <div key={k} data-day={k} className={cx('rounded-md border border-[#E7D5A4]/10 p-2 min-h-[120px] flex flex-col gap-1.5', k === today && 'border-[#C99A2E]')}>
                <span className="text-xs text-[#E7D5A4]/70">{d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                {(byDay[k] || []).map((e, i) => <Entry key={i} e={e} to={linkFor(e)} />)}
              </div>
            );
          })}
        </div>
      ) : (
        entries.length === 0 ? <p className="text-sm text-[#E7D5A4]/70">Nothing in the next six months.</p> : (
          <ol className="list-none m-0 p-0 flex flex-col gap-3" data-calendar-view="agenda">
            {Object.keys(byDay).sort().map((k) => (
              <li key={k} className="grid grid-cols-[100px_1fr] gap-3">
                <span className="text-sm text-[#E7D5A4]/80 pt-1">{fmtDay(k)}</span>
                <div className="flex flex-col gap-1.5 min-w-0">{byDay[k].map((e, i) => <Entry key={i} e={e} to={linkFor(e)} />)}</div>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
