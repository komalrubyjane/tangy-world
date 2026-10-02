import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useDebounced } from '../hooks';
import { Button, Drawer, Field, Input, SearchInput, Skeleton, ErrorState, EmptyState, fmt } from '../ui';
import { AvailabilityPill } from '../../components/calendar/availability';
import { AVAILABILITY, AVAILABILITY_ORDER } from '../../components/calendar/availabilityMeta';
import { ArtistCalendar } from '../../components/calendar/ArtistCalendar';
import { adminLinkFor } from '../../components/calendar/calendarData';
import { iso } from '../../lib/calendarDates';

const cx = (...a) => a.filter(Boolean).join(' ');

// Every approved artist on a date, as the server sees them (find_available_artists, 0034).
function useArtistAvailability({ date, start, end, eventId, search, genre, city }) {
  const [state, setState] = useState({ loading: false, rows: [] });
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!date) { setState({ loading: false, rows: [] }); return undefined; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    supabase.rpc('find_available_artists', {
      p_date: date, p_start: start || null, p_end: end || null, p_search: search || null,
      p_genre: genre || null, p_city: city || null, p_event_id: eventId || null,
    }).then(({ data, error }) => {
      if (!cancelled) setState(error ? { loading: false, rows: [], error: friendlyError(error) } : { loading: false, rows: data || [] });
    });
    return () => { cancelled = true; };
  }, [date, start, end, eventId, search, genre, city, key]);
  return { ...state, reload: () => setKey((k) => k + 1) };
}

// The same calendar the artist sees, in a drawer (no second copy).
export const ArtistCalendarDrawer = ({ artist, date, onClose }) => (
  <Drawer title={artist.stage_name || artist.name} subtitle={[artist.genre, artist.city].filter(Boolean).join(' · ')} onClose={onClose} width="sm:max-w-3xl">
    <ArtistCalendar artistId={artist.artist_id || artist.id} linkFor={adminLinkFor} date={date} />
    <Button to={`/admin-portal/people/artists/${artist.artist_id || artist.id}/calendar`} icon="ArrowUpRight">Open the artist's page</Button>
  </Drawer>
);

const FILTERS = [['', 'All'], ...AVAILABILITY_ORDER.map((k) => [k, AVAILABILITY[k].label])];

// Grouped, searchable, filterable list. `selectable` turns rows into
// checkboxes and shows "Add selected artists"; busy artists can't be chosen.
export const ArtistAvailabilityList = ({ date, start, end, eventId, genre, city, selectable = false, exclude = new Set(), onAdd, addLabel = 'Add selected artists', initialFilter = '' }) => {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [filter, setFilter] = useState(initialFilter);
  const [picked, setPicked] = useState({});
  const [calendarOf, setCalendarOf] = useState(null);
  const data = useArtistAvailability({ date, start, end, eventId, search: q, genre, city });
  const rows = useMemo(() => data.rows.filter((r) => !exclude.has(r.artist_id)), [data.rows, exclude]);
  const counts = useMemo(() => rows.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {}), [rows]);
  const shown = rows.filter((r) => !filter || r.status === filter);
  const groups = AVAILABILITY_ORDER.map((k) => [k, shown.filter((r) => r.status === k)]).filter(([, list]) => list.length);
  const chosen = rows.filter((r) => picked[r.artist_id]);

  if (!date) return <EmptyState icon="CalendarDays" title="Choose a date first" hint="Availability is checked against the event date (and set times, if you add them)." />;
  return (
    <div className="flex flex-col gap-3 min-w-0" data-artist-picker>
      <SearchInput value={search} onChange={setSearch} placeholder="Name, genre, instrument or city…" className="sm:w-full" />
      <div role="group" aria-label="Filter by availability" className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button key={k || 'all'} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} data-filter={k || 'all'}
            className={cx('min-h-[36px] max-sm:min-h-[44px] px-3 rounded-full border text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]',
              filter === k ? 'bg-[#C99A2E] border-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/25 text-[#E7D5A4]/85 hover:border-[#C99A2E]/60')}>
            {label} <span className="opacity-70">{k ? counts[k] || 0 : rows.length}</span>
          </button>
        ))}
      </div>
      {data.loading ? <Skeleton rows={5} /> : data.error ? <ErrorState error={data.error} onRetry={data.reload} /> : groups.length === 0 ? (
        <EmptyState icon="Contact" title="No artists match" hint={q ? 'Try another name, genre, instrument or city.' : 'No approved artists in this group.'} />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([k, list]) => (
            <section key={k} aria-label={AVAILABILITY[k].label} data-availability-group={k}>
              <h3 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E]/85 mb-1.5">{AVAILABILITY[k].label} · {list.length}</h3>
              <ul className="flex flex-col divide-y divide-[#E7D5A4]/[0.06] border border-[#C99A2E]/15 rounded-md">
                {list.map((r) => {
                  const blocked = r.status === 'busy' || r.on_event;
                  const name = r.stage_name || r.name;
                  return (
                    <li key={r.artist_id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-3 py-2" data-artist-row={name}>
                      {selectable && (
                        <label className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center shrink-0 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 accent-[#C99A2E]" disabled={blocked} checked={!!picked[r.artist_id]}
                            aria-label={`Select ${name}${blocked ? ` (${r.on_event ? 'already on this event' : 'busy'})` : ''}`}
                            onChange={(e) => setPicked((p) => ({ ...p, [r.artist_id]: e.target.checked }))} />
                        </label>
                      )}
                      <div className="flex-1 min-w-[160px]">
                        <div className="text-[13.5px] text-[#EFE2C0] flex flex-wrap items-center gap-2">{name}<AvailabilityPill status={r.status} detail={r.detail} />{r.on_event && <span className="text-[11px] text-[#E7D5A4]/60">on this event</span>}</div>
                        <div className="text-[12px] text-[#E7D5A4]/60">{[r.genre, r.city, (r.instruments || []).slice(0, 2).join(', ')].filter(Boolean).join(' · ') || '—'}</div>
                        <div className="text-[11.5px] text-[#E7D5A4]/70" data-availability-detail>{r.detail}{r.next_booking ? ` · Next booking: ${fmt.date(r.next_booking)}` : ''}{!r.has_account ? ' · No portal account' : ''}</div>
                      </div>
                      <Button size="sm" variant="ghost" icon="CalendarDays" className="max-sm:h-11" onClick={() => setCalendarOf(r)} aria-label={`View ${name}'s calendar`}>Calendar</Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {selectable && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-[#15110D] border-t border-[#C99A2E]/15 pt-3">
          <span className="text-[12.5px] text-[#E7D5A4]/75 flex-1">{chosen.length ? `${chosen.length} selected` : 'Select one or more artists'}</span>
          <Button variant="primary" icon="Plus" disabled={!chosen.length} onClick={() => { onAdd(chosen); setPicked({}); }}>{addLabel}</Button>
        </div>
      )}
      {calendarOf && <ArtistCalendarDrawer artist={calendarOf} date={date} onClose={() => setCalendarOf(null)} />}
    </div>
  );
};

// Standalone "Find available artists": date, optional window, genre, city.
export const FindAvailableArtists = ({ initialDate }) => {
  const [f, setF] = useState({ date: initialDate || iso(new Date()), start: '', end: '', genre: '', city: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="flex flex-col gap-3" data-find-available>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Field label="Date"><Input type="date" value={f.date} onChange={set('date')} /></Field>
        <Field label="Start time"><Input type="time" value={f.start} onChange={set('start')} /></Field>
        <Field label="End time"><Input type="time" value={f.end} onChange={set('end')} /></Field>
        <Field label="Genre"><Input value={f.genre} onChange={set('genre')} placeholder="Any" /></Field>
        <Field label="City"><Input value={f.city} onChange={set('city')} placeholder="Any" /></Field>
      </div>
      <FilteredList {...f} />
    </div>
  );
};

const FilteredList = ({ date, start, end, genre, city }) => {
  const g = useDebounced(genre);
  const c = useDebounced(city);
  // Genre / city narrow the server query; the list's own search covers name and instrument.
  return <ArtistAvailabilityList key={`${g}|${c}`} date={date} start={start && end ? start : null} end={start && end ? end : null} genre={g} city={c} />;
};
