import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { localISODate, ROLE_LABELS } from '../rbac';
import { Page, Panel, Field, Select, Badge, AsyncBlock, fmt } from '../ui';
import { TeamManager } from '../components/Team';

// Event → assigned team. Assigning staff here is what grants them access to
// that event's check-in and attendee list (enforced by is_assigned_to_event()).
export default function TeamPage() {
  const [params, setParams] = useSearchParams();
  const events = useAsync(async () => {
    const { data, error } = await supabase.from('events').select('id, name, event_date, status')
      .neq('status', 'cancelled').order('event_date', { ascending: false }).limit(200);
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
  const roster = useAsync(async () => {
    const today = localISODate();
    const [{ data: staff, error }, { data: assignments }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, is_active').in('role', ['staff', 'admin', 'super_admin']).order('full_name'),
      supabase.from('event_assignments').select('assignee_id, events!inner(event_date)').eq('assignee_role', 'staff').gte('events.event_date', today),
    ]);
    if (error) throw friendlyError(error);
    const upcoming = {};
    (assignments || []).forEach((a) => { upcoming[a.assignee_id] = (upcoming[a.assignee_id] || 0) + 1; });
    return (staff || []).map((s) => ({ ...s, upcoming: upcoming[s.id] || 0 }));
  }, []);

  const eventId = params.get('event') || '';
  const list = events.data || [];
  // Default to the next upcoming event (or the most recent one).
  useEffect(() => {
    const all = events.data || [];
    if (eventId || all.length === 0) return;
    const today = localISODate();
    const next = [...all].filter((e) => e.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date))[0] || all[0];
    setParams({ event: next.id }, { replace: true });
  }, [eventId, events.data, setParams]);
  const selected = list.find((e) => e.id === eventId);

  return (
    <Page title="Team" subtitle="Assign staff, crew, volunteers and vendors to events. Staff only see the events they’re assigned to.">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Panel>
            <Field label="Event">
              <Select value={eventId} onChange={(e) => setParams({ event: e.target.value }, { replace: true })}>
                {list.length === 0 && <option value="">{events.loading ? 'Loading…' : 'No events'}</option>}
                {list.map((e) => <option key={e.id} value={e.id}>{fmt.date(e.event_date)} · {e.name}{e.status === 'draft' ? ' (draft)' : ''}</option>)}
              </Select>
            </Field>
            {selected && <Link to={`/admin-portal/events/${selected.id}?tab=team`} className="inline-block mt-2 text-[12px] underline text-[#E7D5A4]/55">Open event →</Link>}
          </Panel>
          {eventId && <TeamManager key={eventId} eventId={eventId} />}
        </div>
        <Panel title="Staff roster" subtitle="Upcoming staff assignments" flush>
          <AsyncBlock loading={roster.loading} error={roster.error} onRetry={roster.reload} empty={(roster.data || []).length === 0}
            emptyProps={{ title: 'No staff accounts', hint: 'A Super Admin creates staff accounts under Users & Roles.', icon: 'UsersRound' }}>
            <ul className="divide-y divide-[#E7D5A4]/[0.06]">
              {(roster.data || []).map((s) => (
                <li key={s.id} className="px-4 py-2.5 flex items-center gap-2 text-[12.5px]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[#EFE2C0] truncate">{s.full_name || s.email}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/40">{ROLE_LABELS[s.role]}</div>
                  </div>
                  {!s.is_active && <Badge status="deactivated" />}
                  <span className="font-mono text-[11px] text-[#E7D5A4]/55 tabular-nums">{s.upcoming} upcoming</span>
                </li>
              ))}
            </ul>
          </AsyncBlock>
        </Panel>
      </div>
    </Page>
  );
}
