import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { useAdminSession } from '../AdminSession';
import { P, EVENT_STATUSES, EVENT_STATUS_LABELS } from '../rbac';
import { Page, Panel, Toolbar, FilterSelect, Badge, Button, AsyncBlock, fmt } from '../ui';
import { iso, parseDay, monthGrid, WEEKDAYS } from '../../lib/calendarDates';
import { ArtistAvailabilityList } from '../components/ArtistAvailability';

const cx = (...a) => a.filter(Boolean).join(' ');
const STATE_LABEL = { confirmed: 'Confirmed', pending: 'Pending', draft: 'Draft request', declined: 'Declined' };

// /admin-portal/calendar — every event with its line-up, filterable, plus who
// is free on a chosen day. Same event data as the public calendar; artist
// states from the same server functions as the event editor (0034).
export default function CalendarPage() {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || iso(new Date()).slice(0, 7);
  const day = params.get('day');
  const artist = params.get('artist') || '';
  const venue = params.get('venue') || '';
  const status = params.get('status') || '';
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: k !== 'month' && k !== 'day' }); };
  const anchor = parseDay(`${month}-01`);
  const grid = useMemo(() => monthGrid(anchor.getFullYear(), anchor.getMonth()), [month]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = useAsync(async () => {
    const { data, error } = await supabase.rpc('admin_calendar', { p_from: iso(grid[0]), p_to: iso(grid[41]) });
    if (error) throw friendlyError(error);
    return data || [];
  }, [month]);
  const all = useMemo(() => q.data || [], [q.data]);
  const artists = useMemo(() => {
    const m = new Map();
    all.forEach((e) => e.artists.forEach((a) => m.set(a.artist_id, a.name)));
    return [...m].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);
  const venues = useMemo(() => [...new Set(all.map((e) => e.venue).filter(Boolean))].sort(), [all]);
  const events = all.filter((e) => (!status || e.status === status) && (!venue || e.venue === venue) && (!artist || e.artists.some((a) => a.artist_id === artist)));
  const byDay = events.reduce((m, e) => ({ ...m, [e.event_date]: [...(m[e.event_date] || []), e] }), {});
  const today = iso(new Date());
  const shift = (n) => { const d = new Date(anchor.getFullYear(), anchor.getMonth() + n, 1); set('month', iso(d).slice(0, 7)); };
  const dayEvents = day ? byDay[day] || [] : [];

  return (
    <Page title="Calendar" subtitle="Every session, its artists and who is free — from the same event and availability data the site and artists see."
      actions={can(P.EVENTS_MANAGE) && <Button variant="primary" icon="Plus" to="/admin-portal/events/new">New event</Button>}>
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/60">{events.length} event{events.length === 1 ? '' : 's'}</span>}>
            <FilterSelect className="sm:w-56" label="Artist" value={artist} onChange={(v) => set('artist', v)} options={[{ value: '', label: 'Any artist' }, ...artists.map(([id, n]) => ({ value: id, label: n }))]} />
            <FilterSelect className="sm:w-56" label="Venue" value={venue} onChange={(v) => set('venue', v)} options={[{ value: '', label: 'Any venue' }, ...venues.map((v) => ({ value: v, label: v }))]} />
            <FilterSelect className="sm:w-48" label="Status" value={status} onChange={(v) => set('status', v)} options={[{ value: '', label: 'Any status' }, ...EVENT_STATUSES.map((s) => ({ value: s, label: EVENT_STATUS_LABELS[s] }))]} />
          </Toolbar>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" icon="ChevronLeft" onClick={() => shift(-1)} aria-label="Previous month" className="max-sm:h-11" />
            <h2 className="font-condensed text-xl uppercase text-[#EFE2C0] m-0" aria-live="polite">{anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            <Button variant="ghost" icon="ChevronRight" onClick={() => shift(1)} aria-label="Next month" className="max-sm:h-11" />
          </div>
          <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload}>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[640px]" data-admin-calendar>
                {WEEKDAYS.map((w) => <div key={w} className="text-center font-mono text-[10px] uppercase text-[#E7D5A4]/55 pb-1" aria-hidden="true">{w}</div>)}
                {grid.map((d) => {
                  const k = iso(d);
                  const list = byDay[k] || [];
                  return (
                    <div key={k} data-day={k} className={cx('min-h-[104px] rounded border p-1 flex flex-col gap-1', k === day ? 'border-[#C99A2E]' : 'border-[#E7D5A4]/10', d.getMonth() !== anchor.getMonth() && 'opacity-40')}>
                      <button type="button" onClick={() => set('day', k === day ? '' : k)} aria-pressed={k === day} aria-label={`${d.toDateString()}: ${list.length} event${list.length === 1 ? '' : 's'}. Show who is available`}
                        className={cx('self-start min-w-[32px] min-h-[32px] max-sm:min-h-[44px] rounded text-[12px] hover:bg-[#C99A2E]/10', k === today ? 'text-[#C99A2E] font-bold' : 'text-[#E7D5A4]/75')}>{d.getDate()}</button>
                      {list.slice(0, 3).map((e) => (
                        <Link key={e.event_id} to={`/admin-portal/events/${e.event_id}/artists`} data-cal-event={e.slug}
                          className={cx('block rounded px-1.5 py-1 text-[11px] leading-tight border-l-2 bg-[#C99A2E]/10 hover:bg-[#C99A2E]/20', e.status === 'cancelled' ? 'border-[#a8322a] line-through opacity-70' : e.status === 'draft' ? 'border-[#E7D5A4]/40' : 'border-[#C99A2E]')}>
                          <span className="block truncate text-[#EFE2C0]">{e.name}</span>
                          <span className="block truncate text-[#E7D5A4]/65">{e.artists.length ? e.artists.map((a) => `${a.name}${a.state !== 'confirmed' ? ` (${(STATE_LABEL[a.state] || a.state).toLowerCase()})` : ''}`).join(', ') : 'No artists yet'}</span>
                        </Link>
                      ))}
                      {list.length > 3 && <button type="button" onClick={() => set('day', k)} className="text-[10px] text-left underline text-[#E7D5A4]/70">+{list.length - 3} more</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </AsyncBlock>
        </div>
      </Panel>
      {day && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4" data-calendar-day={day}>
          <Panel title={`${fmt.date(day)} · events`} flush>
            {dayEvents.length === 0 ? <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">No events this day.</div> : (
              <ul className="divide-y divide-[#E7D5A4]/[0.06]">
                {dayEvents.map((e) => (
                  <li key={e.event_id} className="px-4 py-3">
                    <Link to={`/admin-portal/events/${e.event_id}/artists`} className="flex flex-wrap items-center gap-2 text-[13.5px] text-[#EFE2C0] hover:underline">{e.name}<Badge status={e.status}>{EVENT_STATUS_LABELS[e.status]}</Badge></Link>
                    <div className="text-[12px] text-[#E7D5A4]/60">{[e.event_time, e.venue].filter(Boolean).join(' · ')}</div>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5 list-none p-0">
                      {e.artists.map((a) => <li key={a.artist_id}><Badge status={a.state === 'confirmed' ? 'confirmed' : a.state}>{a.name} · {STATE_LABEL[a.state] || a.state}</Badge></li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={`Artists on ${fmt.date(day)}`} subtitle="From each artist's own calendar and existing bookings.">
            <ArtistAvailabilityList key={day} date={day} />
          </Panel>
        </div>
      )}
    </Page>
  );
}
