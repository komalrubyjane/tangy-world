import { Link } from 'react-router-dom';
import { useEvents, isUpcomingEvent } from '../../hooks/useEvents';

const MONTH = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
const DAY = (d) => new Date(`${d}T00:00:00`).getDate();
const WEEKDAY = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();

// Tangy Calendar on the homepage — the next dates from the same events table
// as /sessions and /sessions/calendar (useEvents), so a session the team
// publishes appears here on the next visit; drafts and cancelled sessions never do.
export const TangyCalendar = () => {
  const { events, loading, error } = useEvents();
  const upcoming = events.filter(isUpcomingEvent).slice(0, 6);
  return (
    <section id="calendar" className="t-section theme-sessions" aria-labelledby="home-calendar-title">
      <div className="t-container">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b-[3px] border-double border-[#EFE2C0]/25">
          <div>
            <p className="t-label sec-accent m-0">Upcoming dates // Sessions, workshops &amp; events</p>
            <h2 id="home-calendar-title" className="t-h1 text-[#EFE2C0] mt-4 mb-0">Tangy Calendar</h2>
          </div>
          <Link to="/sessions/calendar" className="t-btn t-btn-light self-start md:self-auto" data-calendar-all>View full calendar →</Link>
        </header>
        {loading && <p className="t-label text-[#EFE2C0]/70 mt-8" role="status">Loading dates…</p>}
        {!loading && (error || upcoming.length === 0) && <p className="t-label text-[#EFE2C0]/70 mt-8">New dates are being scheduled — <Link className="underline" to="/sessions/waitlist">join the waitlist</Link>.</p>}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px mt-8 list-none m-0 p-0 bg-[#EFE2C0]/15 border border-[#EFE2C0]/15" data-home-calendar>
          {upcoming.map((e) => (
            <li key={e.id} className="bg-[#1d1813]">
              <Link to={`/sessions/${e.slug || e.id}`} data-home-calendar-event={e.slug} className="flex items-center gap-4 p-4 min-h-[88px] hover:bg-[#EFE2C0]/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                <span className="w-14 shrink-0 text-center border-r border-[#EFE2C0]/20 pr-3" aria-hidden="true">
                  <span className="block font-mono text-[10px] tracking-widest text-[#C99A2E]">{MONTH(e.rawDate)}</span>
                  <span className="block font-condensed text-3xl leading-none text-[#EFE2C0]">{DAY(e.rawDate)}</span>
                  <span className="block font-mono text-[9px] tracking-widest text-[#EFE2C0]/60">{WEEKDAY(e.rawDate)}</span>
                </span>
                <span className="min-w-0">
                  <span className="sr-only">{new Date(`${e.rawDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}: </span>
                  <span className="block font-condensed text-lg uppercase text-[#EFE2C0] leading-tight truncate">{e.title}</span>
                  <span className="block font-mono text-[11px] text-[#EFE2C0]/70 truncate">{[e.time, e.venue].filter(Boolean).join(' · ')}</span>
                  {e.status === 'SOLD OUT' && <span className="block font-mono text-[10px] text-[#E4BD5C] mt-0.5">SOLD OUT · WAITLIST OPEN</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
