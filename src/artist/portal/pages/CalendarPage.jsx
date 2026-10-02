import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { PageHeader, Card, Btn, StatusPill } from '../kit';
import { ArtistCalendar } from '../../../components/calendar/ArtistCalendar';
import { artistLinkFor } from '../../../components/calendar/calendarData';

// Upcoming confirmed sessions as an .ics file (opens in any calendar app).
function exportIcs(entries) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (t) => String(t).replace(/[,;\\]/g, (c) => `\\${c}`);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tangy Sessions//Artist portal//EN'];
  for (const e of entries) {
    lines.push('BEGIN:VEVENT', `UID:${e.day}-${e.event_id}@tangysessions`, `DTSTAMP:${stamp(Date.now())}`,
      e.starts_at ? `DTSTART:${stamp(e.starts_at)}` : `DTSTART;VALUE=DATE:${e.day.replace(/-/g, '')}`,
      ...(e.ends_at ? [`DTEND:${stamp(e.ends_at)}`] : []),
      `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.detail || '')}`, ...(e.venue ? [`LOCATION:${esc(e.venue)}`] : []), 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const a = document.createElement('a'); a.href = url; a.download = 'tangy-performances.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// /artist/calendar — Month / Week / Agenda (?view=week&date=2026-10-12).
export const CalendarPage = () => {
  usePageMeta({ title: 'Calendar', noindex: true });
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const view = ['month', 'week', 'agenda'].includes(params.get('view')) ? params.get('view') : 'month';
  const date = params.get('date') || undefined;
  const set = (next) => setParams(Object.fromEntries(Object.entries({ view: view === 'month' ? undefined : view, date, ...next }).filter(([, v]) => v)));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Calendar" description="Your sessions, requests and availability in one place — the same calendar the Tangy team sees." />
      <Card>
        {user?.id && (
          <ArtistCalendar artistId={user.id} linkFor={artistLinkFor} view={view} date={date}
            onViewChange={(v) => set({ view: v === 'month' ? undefined : v })} onDateChange={(d) => set({ date: d })}
            toolbar={(entries) => {
              const upcoming = entries.filter((e) => e.kind === 'confirmed' && e.day >= today);
              return <Btn size="sm" variant="ghost" disabled={!upcoming.length} onClick={() => exportIcs(upcoming)}>Export performances (.ics)</Btn>;
            }} />
        )}
      </Card>
      <p className="text-xs text-[#E7D5A4]/60 mt-3">Requests are shown dashed until you accept them. <StatusPill status="pending" label="Request" /> opens the request; a session opens its details. Update your days on <Link className="underline" to="/artist/availability">Availability</Link>.</p>
    </div>
  );
};
