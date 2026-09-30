import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { adminApi, friendlyError, update } from '../api';
import { useAsync } from '../hooks';
import { eventPhase } from '../rbac';
import { Page, Panel, Grid, StatTile, KeyValue, Badge, Button, AsyncBlock, NotFound, Skeleton, fmt, useToast } from '../ui';
import { TasksTable } from '../components/Tasks';

export default function StaffEventPage() {
  const { id } = useParams();
  const { user } = useAdminSession();
  const toast = useToast();
  const q = useAsync(async () => {
    const [{ data: evt, error }, { data: assignment }] = await Promise.all([
      supabase.from('events').select('id, name, description, event_date, event_time, end_time, venue, venue_id, status, capacity').eq('id', id).maybeSingle(),
      supabase.from('event_assignments').select('id, title, status, notes').eq('event_id', id).eq('assignee_id', user.id).maybeSingle(),
    ]);
    if (error) throw friendlyError(error);
    let venue = null;
    if (evt?.venue_id) venue = (await supabase.from('venues').select('name, address, city, contact_name, contact_phone, notes').eq('id', evt.venue_id).maybeSingle()).data;
    return { evt, assignment, venue };
  }, [id, user?.id]);
  const stats = useAsync(() => adminApi.eventCheckinStats(id).catch(() => null), [id]);
  const announcements = useAsync(async () => {
    const { data, error } = await supabase.from('announcements').select('id, title, body, priority, publish_at')
      .eq('event_id', id).order('publish_at', { ascending: false });
    if (error) throw friendlyError(error);
    return data;
  }, [id]);

  if (q.loading && !q.data) return <Skeleton rows={8} />;
  if (q.error) return <Panel><AsyncBlock error={q.error} onRetry={q.reload} /></Panel>;
  const { evt, assignment, venue } = q.data || {};
  if (!evt || !assignment) return <NotFound what="event assignment" />;

  const respond = async (status) => {
    try { await update('event_assignments', assignment.id, { status }); toast(status === 'confirmed' ? 'Assignment confirmed' : 'Assignment declined'); q.reload(); } catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <Page
      back={{ to: '/admin-portal/my-events', label: 'My events' }}
      title={evt.name}
      subtitle={`${fmt.date(evt.event_date)}${evt.event_time ? ` · ${evt.event_time}` : ''}${evt.end_time ? `–${evt.end_time}` : ''} · ${evt.venue || 'Venue TBC'}`}
      actions={
        <>
          <Button icon="Users" to={`/admin-portal/attendees?event=${evt.id}`}>Attendees</Button>
          {evt.status !== 'cancelled' && <Button variant="primary" icon="ScanLine" to={`/check-in?event=${evt.id}`}>Check-in</Button>}
        </>
      }
    >
      {evt.status === 'cancelled' && <Panel><p className="text-[13px] text-[#ef6b5e]">This event has been cancelled.</p></Panel>}
      <Grid cols={3}>
        <StatTile label="Tickets issued" value={fmt.num(stats.data?.tickets_issued)} />
        <StatTile label="Checked in" value={fmt.num(stats.data?.checked_in)} tone="good" />
        <StatTile label="Still to arrive" value={fmt.num(stats.data?.remaining)} />
      </Grid>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Your role">
          <KeyValue items={[
            ['Responsibility', assignment.title],
            ['Status', <Badge status={assignment.status} />],
            assignment.notes && ['Notes', assignment.notes],
            ['Event phase', eventPhase(evt)],
          ]} />
          {assignment.status === 'assigned' && (
            <div className="flex gap-2 mt-4">
              <Button variant="success" onClick={() => respond('confirmed')}>Confirm I'll be there</Button>
              <Button variant="ghost" onClick={() => respond('declined')}>Decline</Button>
            </div>
          )}
        </Panel>
        <Panel title="Venue">
          <KeyValue items={[
            ['Venue', venue?.name || evt.venue],
            venue?.address && ['Address', venue.address],
            venue?.city && ['City', venue.city],
            venue?.contact_name && ['On-site contact', [venue.contact_name, venue.contact_phone].filter(Boolean).join(' · ')],
            venue?.notes && ['Notes', venue.notes],
          ]} />
        </Panel>
      </div>
      <Panel title="Event announcements" flush>
        <AsyncBlock loading={announcements.loading} error={announcements.error} empty={(announcements.data || []).length === 0} emptyProps={{ title: 'No announcements for this event', icon: 'Megaphone' }}>
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {(announcements.data || []).map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2"><span className="text-[13.5px] text-[#EFE2C0]">{a.title}</span>{a.priority === 'high' && <Badge tone="bad">Important</Badge>}</div>
                <p className="text-[12.5px] text-[#E7D5A4]/60 mt-1 whitespace-pre-line">{a.body}</p>
                <div className="font-mono text-[10.5px] text-[#E7D5A4]/60 mt-1">{fmt.dateTime(a.publish_at)}</div>
              </li>
            ))}
          </ul>
        </AsyncBlock>
      </Panel>
      {evt.description && <Panel title="About this event"><p className="text-[13px] text-[#E7D5A4]/70 whitespace-pre-line">{evt.description}</p></Panel>}
      <TasksTable eventId={evt.id} initialStatus="" />
    </Page>
  );
}
