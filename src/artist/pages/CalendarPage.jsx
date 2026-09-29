import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../services/workspaceApi';
import { ArtistEventDrawer, performanceIcsItem } from '../components/ArtistEventDrawer';
import { downloadIcs } from '../../lib/ics';
import { Button, Badge, ErrorState, cx } from '../../admin/ui';
import '../calendar.css';

// Artist scheduling workspace: confirmed performances (with call/soundcheck),
// tentative booking requests, other Tangy events and self-set availability —
// all real data. Availability writes are RLS-protected and the database
// refuses to overwrite a date that has a confirmed performance.

const VIEWS = [['dayGridMonth', 'Month'], ['timeGridWeek', 'Week'], ['listMonth', 'Agenda']];
const AVAIL = [['available', 'Available'], ['tentative', 'Tentative'], ['unavailable', 'Unavailable'], ['clear', 'Clear']];
const LEGEND = [
  ['tc-perf', 'Confirmed performance'], ['tc-call', 'Call time'], ['tc-soundcheck', 'Soundcheck'],
  ['tc-request', 'Booking request (tentative)'], ['tc-other', 'Other Tangy event'],
  ['tc-avail-available', 'Available'], ['tc-avail-tentative', 'Tentative'], ['tc-avail-unavailable', 'Unavailable'],
];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const calRef = useRef(null);
  const [range, setRange] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'listMonth' : 'dayGridMonth'));
  const [mode, setMode] = useState('available');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id || !range) return;
    try {
      setData(await workspaceApi.calendar(user.id, range.from, range.to));
      setError(null);
    } catch (err) { setError(err); }
  }, [user?.id, range]);
  useEffect(() => { load(); }, [load]);

  const booked = useMemo(() => new Set((data?.performances || []).filter((p) => p.event_status !== 'cancelled').map((p) => p.event_date)), [data]);

  const events = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const p of data.performances) {
      const cancelled = p.event_status === 'cancelled';
      const base = { extendedProps: { perf: p }, classNames: cancelled ? ['tc-cancelled'] : [] };
      if (p.starts_at) out.push({ ...base, id: `perf-${p.event_id}`, title: `${cancelled ? 'Cancelled · ' : ''}${p.name}`, start: p.starts_at, end: p.ends_at || undefined, classNames: [...base.classNames, 'tc-perf'] });
      else out.push({ ...base, id: `perf-${p.event_id}`, title: `${cancelled ? 'Cancelled · ' : ''}${p.name} (time TBC)`, start: p.event_date, allDay: true, classNames: [...base.classNames, 'tc-perf'] });
      if (!cancelled && p.call_time) out.push({ ...base, id: `call-${p.event_id}`, title: `Call · ${p.name}`, start: p.call_time, classNames: ['tc-call'] });
      if (!cancelled && p.soundcheck_at) out.push({ ...base, id: `sc-${p.event_id}`, title: `Soundcheck · ${p.name}`, start: p.soundcheck_at, classNames: ['tc-soundcheck'] });
    }
    for (const r of data.requests) {
      out.push({ id: `req-${r.id}`, title: `Requested · ${r.event_name}`, start: r.proposed_start || r.event_date, end: r.proposed_end || undefined, allDay: !r.proposed_start, classNames: ['tc-request'], extendedProps: { request: r } });
    }
    for (const o of data.otherEvents) {
      out.push({ id: `other-${o.event_id}-${o.member_kind}`, title: `${o.name} (${o.member_kind})`, start: o.event_date, allDay: true, classNames: ['tc-other'], extendedProps: { perf: o } });
    }
    for (const a of data.availability) {
      if (booked.has(a.date)) continue;
      out.push({ id: `av-${a.date}`, start: a.date, allDay: true, display: 'background', classNames: [`tc-avail-${a.status}`] });
    }
    return out;
  }, [data, booked]);

  const api = () => calRef.current?.getApi();
  const changeView = (v) => { setView(v); api()?.changeView(v); };

  const onDateClick = async (info) => {
    const date = info.dateStr.slice(0, 10);
    setNotice('');
    if (booked.has(date)) { setNotice('That date has a confirmed performance — it stays booked.'); return; }
    try {
      await workspaceApi.setAvailability(user.id, date, mode === 'clear' ? null : mode);
      setNotice(mode === 'clear' ? `Cleared ${date}.` : `${date} marked ${mode}.`);
      load();
    } catch (err) { setNotice(err.message); }
  };

  const upcoming = (data?.performances || []).filter((p) => p.event_status !== 'cancelled' && p.event_date >= iso(new Date()));

  return (
    <div className="w-full p-3 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-4 text-left font-sans">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d1a437]">Artist workspace</p>
          <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] m-0 leading-none">Calendar</h1>
          <p className="text-[13px] text-[#ecdcaf]/65 mt-1">Performances, requests and your availability in one place.</p>
        </div>
        <Button icon="CalendarDays" disabled={!upcoming.length} onClick={() => downloadIcs(upcoming.map(performanceIcsItem), 'tangy-performances.ics')}>Export performances (.ics)</Button>
      </header>

      <section className="bg-[#11100C] border border-[#C99A2E]/25 rounded-md p-3 sm:p-4 flex flex-col gap-3 text-[#E7D5A4]" data-artist-calendar>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" icon="ChevronLeft" aria-label="Previous" onClick={() => api()?.prev()} />
            <Button size="sm" onClick={() => api()?.today()}>Today</Button>
            <Button size="sm" variant="ghost" icon="ChevronRight" aria-label="Next" onClick={() => api()?.next()} />
          </div>
          <h2 className="font-condensed text-[20px] uppercase tracking-wide text-[#EFE2C0] m-0 mr-auto" aria-live="polite">{title}</h2>
          <div role="tablist" aria-label="Calendar view" className="flex rounded border border-[#C99A2E]/30 overflow-hidden">
            {VIEWS.map(([v, label]) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => changeView(v)}
                className={cx('h-8 px-3 font-mono text-[11px] uppercase tracking-[0.1em]', view === v ? 'bg-[#C99A2E] text-[#11100C]' : 'text-[#E7D5A4]/70 hover:bg-[#C99A2E]/10')}>{label}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="text-[#E7D5A4]/55">Click a day to mark it:</span>
          {AVAIL.map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k}
              className={cx('h-8 px-3 rounded-full border font-mono text-[11px] uppercase tracking-[0.08em]', mode === k ? 'border-[#C99A2E] bg-[#C99A2E]/20 text-[#EFE2C0]' : 'border-[#E7D5A4]/20 text-[#E7D5A4]/65')}>{label}</button>
          ))}
          {notice && <span role="status" className="ml-1 text-[#f5b544]">{notice}</span>}
        </div>

        {error ? <ErrorState error={error} onRetry={load} /> : (
          <div className="tangy-cal">
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={view}
              headerToolbar={false}
              height="auto"
              firstDay={1}
              nowIndicator
              dayMaxEvents={3}
              events={events}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              noEventsContent="No performances, requests or availability in this period."
              datesSet={(arg) => {
                setTitle(arg.view.title);
                const from = iso(arg.start); const to = iso(new Date(arg.end.getTime() - 86400000));
                setRange((r) => (r && r.from === from && r.to === to ? r : { from, to }));
              }}
              dateClick={onDateClick}
              eventClick={(info) => {
                const p = info.event.extendedProps.perf;
                if (p) setOpen(p);
                else if (info.event.extendedProps.request) navigate('/artist/requests');
              }}
            />
          </div>
        )}

        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-[#E7D5A4]/65" aria-label="Legend">
          {LEGEND.map(([cls, label]) => <li key={cls} className="flex items-center gap-1.5"><span className={cx('tc-swatch', cls)} aria-hidden="true" />{label}</li>)}
        </ul>
        <p className="text-[11.5px] text-[#E7D5A4]/45">Grid times use your device's timezone; each event's detail shows its local time.</p>
      </section>

      {data && data.requests.length > 0 && (
        <div className="flex items-center gap-2 text-[13px] text-[#ecdcaf]">
          <Badge tone="warn">{data.requests.length} pending</Badge> booking request{data.requests.length === 1 ? '' : 's'} — <Link to="/artist/requests" className="underline">review requests</Link>
        </div>
      )}
      {open && <ArtistEventDrawer event={open} onClose={() => setOpen(null)} />}
    </div>
  );
};
