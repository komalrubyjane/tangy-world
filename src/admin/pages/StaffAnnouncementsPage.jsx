import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { Page, Panel, Badge, AsyncBlock, fmt } from '../ui';

// RLS returns only live staff announcements for the caller's events plus
// general staff notes (see "announcements: staff read relevant").
export default function StaffAnnouncementsPage() {
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('announcements')
      .select('id, title, body, priority, publish_at, events(name)')
      .eq('audience', 'staff').order('publish_at', { ascending: false }).limit(100);
    if (error) throw friendlyError(error);
    return data;
  }, []);
  return (
    <Page title="Announcements" subtitle="Team updates for the events you work.">
      <Panel flush>
        <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0}
          emptyProps={{ title: 'No announcements', hint: 'Admins post event updates and briefings here.', icon: 'Megaphone' }}>
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {(q.data || []).map((a) => (
              <li key={a.id} className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] text-[#EFE2C0]">{a.title}</span>
                  {a.priority === 'high' && <Badge tone="bad">Important</Badge>}
                  <Badge tone={a.events ? 'gold' : 'muted'}>{a.events?.name || 'All staff'}</Badge>
                </div>
                <p className="text-[13px] text-[#E7D5A4]/65 mt-1.5 whitespace-pre-line">{a.body}</p>
                <div className="font-mono text-[10.5px] text-[#E7D5A4]/35 mt-1.5">{fmt.dateTime(a.publish_at)}</div>
              </li>
            ))}
          </ul>
        </AsyncBlock>
      </Panel>
    </Page>
  );
}
