import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { localISODate } from '../rbac';
import { Page, Panel, Badge, Button, AsyncBlock, Icon, fmt } from '../ui';

// Staff: the events they're assigned to (RLS returns only their own
// event_assignments rows, and events they can read).
export function useMyAssignments() {
  const { user } = useAdminSession();
  return useAsync(async () => {
    const { data, error } = await supabase
      .from('event_assignments')
      .select('id, title, status, assignee_role, events(id, name, event_date, event_time, end_time, venue, status)')
      .eq('assignee_id', user.id)
      .neq('status', 'declined');
    if (error) throw friendlyError(error);
    return (data || []).filter((a) => a.events).sort((a, b) => a.events.event_date.localeCompare(b.events.event_date));
  }, [user?.id]);
}

const EventRow = ({ a, today }) => (
  <li>
    <Link to={`/admin-portal/my-events/${a.events.id}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3.5 hover:bg-[#C99A2E]/[0.05]">
      <div className="w-28 shrink-0 font-mono text-[12px] text-[#C99A2E]">{a.events.event_date === today ? 'TODAY' : fmt.date(a.events.event_date)}{a.events.event_time ? <div className="text-[#E7D5A4]/60">{a.events.event_time}</div> : null}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-[#EFE2C0]">{a.events.name}</div>
        <div className="text-[12.5px] text-[#E7D5A4]/60">{a.events.venue || 'Venue TBC'} · {a.title}</div>
      </div>
      <div className="flex items-center gap-2">
        {a.events.status === 'cancelled' && <Badge status="cancelled">Event cancelled</Badge>}
        <Badge status={a.status} />
        <Icon name="ChevronRight" size={16} className="text-[#E7D5A4]/60 hidden sm:block" />
      </div>
    </Link>
  </li>
);

export default function MyEventsPage({ infoMode = false }) {
  const q = useMyAssignments();
  const today = localISODate();
  const rows = q.data || [];
  const upcoming = rows.filter((a) => a.events.event_date >= today);
  const past = rows.filter((a) => a.events.event_date < today).reverse();

  return (
    <Page
      title={infoMode ? 'Event info' : 'My events'}
      subtitle={infoMode ? 'Times, venue, your role, tasks and announcements for each event you work.' : 'Events you are assigned to work.'}
      actions={<Button variant="primary" icon="ScanLine" to="/check-in">QR check-in</Button>}
    >
      <Panel title="Upcoming" flush>
        <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={upcoming.length === 0}
          emptyProps={{ title: 'No upcoming assignments', hint: 'When an admin adds you to an event team it will appear here.', icon: 'CalendarDays' }}>
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">{upcoming.map((a) => <EventRow key={a.id} a={a} today={today} />)}</ul>
        </AsyncBlock>
      </Panel>
      {past.length > 0 && (
        <Panel title="Past" flush>
          <ul className="divide-y divide-[#E7D5A4]/[0.06] opacity-80">{past.map((a) => <EventRow key={a.id} a={a} today={today} />)}</ul>
        </Panel>
      )}
    </Page>
  );
}
