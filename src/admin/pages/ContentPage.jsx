import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { localISODate, EVENT_STATUS_LABELS } from '../rbac';
import { Page, Panel, Tabs, Badge, AsyncBlock, fmt } from '../ui';
import { AnnouncementsManager } from '../components/Announcements';
import { TVChannelsSection } from '../sections/TVChannelsSection';

const TABS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'events', label: 'Event pages' },
  { id: 'tv', label: 'Tangy TV' },
];

const EventPages = () => {
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('events').select('id, name, slug, event_date, status, description, image_url')
      .gte('event_date', localISODate()).order('event_date');
    if (error) throw friendlyError(error);
    return data;
  }, []);
  return (
    <Panel title="Upcoming event pages" subtitle="Edit an event's public copy, story and cover image from its Content tab" flush>
      <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0} emptyProps={{ title: 'No upcoming events', icon: 'CalendarDays' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(q.data || []).map((e) => (
            <li key={e.id}>
              <Link to={`/admin-portal/events/${e.id}?tab=content`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#C99A2E]/[0.05] text-[13px]">
                <span className="font-mono text-[12px] text-[#C99A2E] w-24 shrink-0">{fmt.date(e.event_date)}</span>
                <span className="flex-1 min-w-0 truncate">{e.name}</span>
                {!e.description && <Badge tone="warn">No description</Badge>}
                {!e.image_url && <Badge tone="warn">No image</Badge>}
                <Badge status={e.status}>{EVENT_STATUS_LABELS[e.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

export default function ContentPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'announcements';
  return (
    <Page title="Content" subtitle="Announcements for the website and for staff, public event pages, and Tangy TV.">
      <Tabs tabs={TABS} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />
      {tab === 'announcements' && <AnnouncementsManager startNew={params.get('new') === '1'} />}
      {tab === 'events' && <EventPages />}
      {tab === 'tv' && (
        <>
          <Panel><p className="text-[12.5px] text-[#f5b544]">Tangy TV channels are still stored in this browser only (not yet in the database) — changes here don't reach other admins or visitors.</p></Panel>
          <TVChannelsSection />
        </>
      )}
    </Page>
  );
}
