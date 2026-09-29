import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { adminApi, friendlyError } from '../api';
import { useAsync } from '../hooks';
import { P, localISODate, eventPhase, ROLE_LABELS } from '../rbac';
import { auditLabel, auditSummary } from '../auditLabels';
import { Page, Panel, Grid, StatTile, Badge, AsyncBlock, Button, Icon, fmt, cx, useToast } from '../ui';

const APP_TYPE_LABEL = { artist: 'Artists', vendor: 'Vendors', sponsor: 'Sponsors', venue: 'Venues', crew: 'Crew', volunteer: 'Volunteers' };

function useSummary() {
  return useAsync(() => adminApi.dashboardSummary(), []);
}

function useUpcomingPerformance() {
  // Event performance for today onward — real sold/checked-in numbers.
  return useAsync(async () => {
    const rows = await adminApi.reportEventPerformance(localISODate(), null);
    return (rows || []).filter((r) => r.status !== 'cancelled').sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 6);
  }, []);
}

const Progress = ({ value, max }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-[#E7D5A4]/10 overflow-hidden">
        <div className="h-full bg-[#C99A2E]" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-[#E7D5A4]/60 w-[70px] text-right">{fmt.num(value)}/{fmt.num(max)}</span>
    </div>
  );
};

const UpcomingEventsPanel = () => {
  const { data, loading, error, reload } = useUpcomingPerformance();
  return (
    <Panel title="Upcoming & live events" actions={<Button size="sm" variant="ghost" to="/admin/events">All events</Button>} flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={data?.length === 0}
        emptyProps={{ title: 'No upcoming events', hint: 'Published events dated today or later appear here.', icon: 'CalendarDays', action: <Button size="sm" to="/admin/events?new=1" icon="Plus">Create event</Button> }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data || []).map((e) => {
            const phase = eventPhase(e);
            return (
              <li key={e.event_id}>
                <Link to={`/admin/events/${e.event_id}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-[#C99A2E]/[0.05]">
                  <div className="w-24 shrink-0 font-mono text-[11.5px] text-[#C99A2E]">{fmt.date(e.event_date)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] text-[#EFE2C0] truncate">{e.name}</div>
                    <div className="text-[12px] text-[#E7D5A4]/45 truncate">{e.venue || 'Venue TBC'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={phase === 'live' ? 'live' : e.status} >{phase === 'live' ? 'Today' : undefined}</Badge>
                    <div className="hidden md:block"><Progress value={Number(e.tickets_sold)} max={e.capacity} /></div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

function attentionItems(s, can) {
  if (!s) return [];
  const h = s.health || {};
  const items = [];
  const pending = s.applications?.pending || 0;
  if (pending && can(P.APPLICATIONS_VIEW)) {
    const byType = Object.entries(s.applications.by_type || {}).map(([t, n]) => `${n} ${APP_TYPE_LABEL[t] || t}`).join(', ');
    items.push({ tone: 'warn', label: `${pending} application${pending === 1 ? '' : 's'} awaiting review`, sub: byType, to: '/admin/applications?status=pending' });
  }
  if (h.ticket_emails_failed) items.push({ tone: 'bad', label: `${h.ticket_emails_failed} ticket email${h.ticket_emails_failed === 1 ? '' : 's'} failed to send`, to: '/admin/bookings?tab=payments&email=failed' });
  if (h.approval_emails_failed && can(P.OPERATIONS)) items.push({ tone: 'bad', label: `${h.approval_emails_failed} approval email${h.approval_emails_failed === 1 ? '' : 's'} failed`, to: '/admin/ops/notifications' });
  if (h.webhooks_unprocessed && can(P.PAYMENTS)) items.push({ tone: 'bad', label: `${h.webhooks_unprocessed} payment webhook${h.webhooks_unprocessed === 1 ? '' : 's'} not processed`, to: '/admin/bookings?tab=webhooks' });
  if (h.stale_pending_bookings) items.push({ tone: 'warn', label: `${h.stale_pending_bookings} checkout${h.stale_pending_bookings === 1 ? '' : 's'} pending over 30 min`, sub: 'Abandoned checkouts still hold capacity', to: '/admin/bookings?status=pending' });
  if (h.on_sale_past_date) items.push({ tone: 'warn', label: `${h.on_sale_past_date} event${h.on_sale_past_date === 1 ? '' : 's'} still on sale after the date`, sub: 'Mark as completed', to: '/admin/events?when=past&status=on-sale' });
  if (h.open_tasks_overdue) items.push({ tone: 'warn', label: `${h.open_tasks_overdue} overdue event task${h.open_tasks_overdue === 1 ? '' : 's'}`, to: '/admin/tasks?status=open' });
  return items;
}

// Partner-side work waiting on the Tangy team (0018). Each count is RLS-scoped,
// so a role only ever counts what it may act on.
function useOpsAttention(can) {
  return useAsync(async () => {
    const head = (q) => q.then(({ count }) => count || 0);
    const [messages, requests, reviews] = await Promise.all([
      can(P.MESSAGES) ? head(supabase.from('conversations').select('id', { count: 'exact', head: true }).neq('conversation_type', 'general').eq('status', 'open')) : 0,
      can(P.VOLUNTEERS) ? head(supabase.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')) : 0,
      can(P.EVENTS_MANAGE) ? head(supabase.from('event_requirements').select('id', { count: 'exact', head: true }).eq('status', 'submitted')) : 0,
    ]);
    return [
      messages && { label: `${messages} partner message${messages === 1 ? '' : 's'} awaiting reply`, sub: 'Artists, sponsors, vendors and venue hosts', to: '/admin/messages', tone: 'warn' },
      requests && { label: `${requests} volunteer check-in request${requests === 1 ? '' : 's'}`, sub: 'Grant or decline time-limited access', to: '/admin/volunteers?requests=1', tone: 'warn' },
      reviews && { label: `${reviews} partner response${reviews === 1 ? '' : 's'} to review`, sub: 'Submitted requirements', to: '/admin/events', tone: 'warn' },
    ].filter(Boolean);
  }, []);
}

const AttentionPanel = ({ summary, loading, error, reload }) => {
  const { can } = useAdminSession();
  const ops = useOpsAttention(can);
  const items = [...(ops.data || []), ...attentionItems(summary, can)];
  return (
    <Panel title="Needs attention" flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={items.length === 0}
        emptyProps={{ title: 'All clear', hint: 'No pending reviews, failed emails or stuck payments.', icon: 'CircleCheck' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {items.map((i) => (
            <li key={i.label}>
              <Link to={i.to} className="flex items-start gap-3 px-4 py-3 hover:bg-[#C99A2E]/[0.05]">
                <span className={cx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', i.tone === 'bad' ? 'bg-[#ef6b5e]' : 'bg-[#f5b544]')} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#EFE2C0]">{i.label}</div>
                  {i.sub && <div className="text-[12px] text-[#E7D5A4]/45 mt-0.5">{i.sub}</div>}
                </div>
                <Icon name="ChevronRight" size={15} className="text-[#E7D5A4]/30 mt-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

const PeoplePanel = ({ summary }) => {
  const p = summary?.people;
  const rows = p ? [
    ['Super admins', p.super_admins, '/admin/users?role=super_admin'],
    ['Admins / managers', p.admins, '/admin/users?role=admin'],
    ['Staff', p.staff, '/admin/users?role=staff'],
    ['Approved artists', p.artists, '/admin/people/artists'],
    ['Venues', p.venues, '/admin/people/venues'],
    ['Sponsors', p.sponsors, '/admin/people/sponsors'],
    ['Vendors', p.vendors, '/admin/people/vendors'],
    ['Crew', p.crew, '/admin/people/crew'],
    ['Volunteers', p.volunteers, '/admin/people/volunteers'],
  ] : [];
  const { can } = useAdminSession();
  return (
    <Panel title="People" subtitle={p ? `${fmt.num(p.users_total)} accounts · ${fmt.num(p.deactivated)} deactivated` : undefined} flush>
      {!p ? <div className="p-4 text-[12px] text-[#E7D5A4]/40">—</div> : (
        <ul className="grid grid-cols-2 sm:grid-cols-3">
          {rows.map(([label, n, to]) => {
            const linkable = to.startsWith('/admin/users') ? can(P.USERS_MANAGE) : can(P.ENTITIES);
            const inner = (<><div className="font-condensed text-xl tabular-nums text-[#EFE2C0]">{fmt.num(n)}</div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45 mt-0.5">{label}</div></>);
            return (
              <li key={label} className="border-b border-r border-[#E7D5A4]/[0.06]">
                {linkable ? <Link to={to} className="block px-4 py-3 hover:bg-[#C99A2E]/[0.05]">{inner}</Link> : <div className="px-4 py-3">{inner}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

const RecentActivityPanel = () => {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('audit_logs')
      .select('id, created_at, actor_email, actor_role, action, resource_type, resource_id, metadata')
      .order('created_at', { ascending: false })
      .limit(8);
    if (err) throw friendlyError(err);
    return rows;
  }, []);
  return (
    <Panel title="Recent activity" actions={<Button size="sm" variant="ghost" to="/admin/audit">Audit log</Button>} flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={data?.length === 0}
        emptyProps={{ title: 'No activity recorded yet', hint: 'Sign-ins, approvals, event edits, check-ins and settings changes are logged here.', icon: 'ScrollText' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data || []).map((r) => (
            <li key={r.id} className="px-4 py-2.5 flex gap-3 text-[12.5px]">
              <span className="w-14 shrink-0 font-mono text-[11px] text-[#E7D5A4]/40 pt-px">{fmt.relative(r.created_at)}</span>
              <div className="min-w-0">
                <span className="text-[#EFE2C0]">{r.actor_email || 'System'}</span>
                <span className="text-[#E7D5A4]/60"> · {auditLabel(r.action)}</span>
                {auditSummary(r) && <div className="text-[#E7D5A4]/40 truncate">{auditSummary(r)}</div>}
              </div>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

const RecentBookingsPanel = () => {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('bookings')
      .select('id, registration_code, attendee_name, amount, quantity, status, source, created_at, events(name)')
      .order('created_at', { ascending: false })
      .limit(6);
    if (err) throw friendlyError(err);
    return rows;
  }, []);
  return (
    <Panel title="Latest bookings" actions={<Button size="sm" variant="ghost" to="/admin/bookings">All bookings</Button>} flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={data?.length === 0} emptyProps={{ title: 'No bookings yet', icon: 'Ticket' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data || []).map((b) => (
            <li key={b.id}>
              <Link to={`/admin/bookings?booking=${b.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] hover:bg-[#C99A2E]/[0.05]">
                <span className="font-mono text-[11.5px] text-[#C99A2E] w-24 shrink-0">{b.registration_code}</span>
                <span className="flex-1 min-w-0 truncate">{b.attendee_name} <span className="text-[#E7D5A4]/40">· {b.events?.name}</span></span>
                <span className="tabular-nums text-[#E7D5A4]/70">{b.source === 'complimentary' ? 'Comp' : fmt.money(b.amount)}</span>
                <Badge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

const KpiRow = ({ s, can }) => {
  const checkRate = s?.tickets?.issued ? `${Math.round((100 * s.tickets.checked_in) / s.tickets.issued)}% checked in` : 'No tickets issued yet';
  return (
    <Grid cols={5}>
      {can(P.PAYMENTS) && <StatTile label="Revenue" value={s ? fmt.money(s.revenue?.total) : '…'} sub={s ? `${fmt.money(s.revenue?.last_30_days)} in the last 30 days` : null} to="/admin/reports" />}
      <StatTile label="Confirmed bookings" value={s ? fmt.num(s.bookings?.confirmed) : '…'} sub={s ? `${fmt.num(s.bookings?.last_7_days)} this week · ${fmt.num(s.bookings?.pending)} pending` : null} to="/admin/bookings" />
      <StatTile label="Tickets issued" value={s ? fmt.num(s.tickets?.issued) : '…'} sub={s ? `${fmt.num(s.tickets?.checked_in)} attended · ${checkRate}` : null} to="/admin/attendees" />
      <StatTile label="Pending applications" value={s ? fmt.num(s.applications?.pending) : '…'} tone={s?.applications?.pending ? 'warn' : undefined} sub="Artists, partners, crew" to="/admin/applications?status=pending" />
      <StatTile label="Upcoming events" value={s ? fmt.num(s.events?.upcoming) : '…'} sub={s ? `${fmt.num(s.events?.today)} today · ${fmt.num(s.events?.draft)} drafts · ${fmt.num(s.events?.past)} past` : null} to="/admin/events" />
    </Grid>
  );
};

const SystemHealthPanel = ({ summary }) => {
  const h = summary?.health;
  const rows = h ? [
    ['Payment webhooks unprocessed', h.webhooks_unprocessed],
    ['Ticket emails failed', h.ticket_emails_failed],
    ['Approval emails failed', h.approval_emails_failed],
    ['Checkouts pending > 30 min', h.stale_pending_bookings],
    ['Events on sale past their date', h.on_sale_past_date],
    ['Overdue event tasks', h.open_tasks_overdue],
  ] : [];
  return (
    <Panel title="System health" subtitle="Computed live from the database" flush>
      <ul className="divide-y divide-[#E7D5A4]/[0.06]">
        {rows.map(([label, n]) => (
          <li key={label} className="flex items-center justify-between px-4 py-2.5 text-[12.5px]">
            <span className="text-[#E7D5A4]/70">{label}</span>
            <Badge tone={n ? 'bad' : 'good'}>{n ? fmt.num(n) : 'OK'}</Badge>
          </li>
        ))}
      </ul>
    </Panel>
  );
};

const OrgDashboard = ({ superAdmin }) => {
  const { can, user } = useAdminSession();
  const { data: s, loading, error, reload } = useSummary();
  return (
    <Page
      title={superAdmin ? 'System overview' : 'Operations'}
      subtitle={`${ROLE_LABELS[user?.role]} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      actions={
        <>
          {can(P.EVENTS_MANAGE) && <Button icon="Plus" to="/admin/events?new=1">New event</Button>}
          {can(P.APPLICATIONS_REVIEW) && <Button variant="primary" icon="Inbox" to="/admin/applications?status=pending">Review applications</Button>}
        </>
      }
    >
      {error && <Panel><AsyncBlock error={error} onRetry={reload} /></Panel>}
      <KpiRow s={s} can={can} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 flex flex-col gap-4 min-w-0">
          <UpcomingEventsPanel />
          {superAdmin ? <RecentActivityPanel /> : <RecentBookingsPanel />}
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <AttentionPanel summary={s} loading={loading} error={error} reload={reload} />
          <PeoplePanel summary={s} />
          {superAdmin && <SystemHealthPanel summary={s} />}
        </div>
      </div>
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Staff — "what do I need to do today?"
// ---------------------------------------------------------------------------

const StaffDashboard = () => {
  const { user } = useAdminSession();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminApi.staffDashboard(), []);
  const announcements = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('announcements')
      .select('id, title, body, priority, publish_at, event_id, events(name)')
      .eq('audience', 'staff')
      .order('publish_at', { ascending: false })
      .limit(5);
    if (err) throw friendlyError(err);
    return rows;
  }, []);

  const completeTask = async (task) => {
    const { error: err } = await supabase.from('event_tasks').update({ status: 'done' }).eq('id', task.id);
    if (err) { toast(friendlyError(err).message, 'bad'); return; }
    toast('Task marked done');
    reload();
  };

  const today = localISODate();
  const events = data?.events || [];
  const todays = events.filter((e) => e.event_date === today);

  return (
    <Page
      title={`Hello${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
      subtitle={todays.length ? `You're working ${todays.length === 1 ? todays[0].name : `${todays.length} events`} today.` : 'No event on your schedule today.'}
      actions={<Button variant="primary" size="lg" icon="ScanLine" to="/check-in">Open QR check-in</Button>}
    >
      <Grid cols={3}>
        <StatTile label="Assigned events" value={loading ? '…' : events.length} sub="From yesterday onward" to="/admin/my-events" />
        <StatTile label="Open tasks" value={loading ? '…' : (data?.tasks || []).length} sub="Due today or for upcoming events" to="/admin/tasks" />
        <StatTile label="My check-ins today" value={loading ? '…' : data?.checkins_by_me_today} to="/admin/check-ins?mine=1" />
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="My events" flush>
          <AsyncBlock loading={loading} error={error} onRetry={reload} empty={events.length === 0}
            emptyProps={{ title: 'No assigned events', hint: 'An admin assigns you to events from the Team page.', icon: 'CalendarDays' }}>
            <ul className="divide-y divide-[#E7D5A4]/[0.06]">
              {events.map((e) => (
                <li key={e.id} className="px-4 py-3.5 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-[#C99A2E]">{e.event_date === today ? 'TODAY' : fmt.date(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ''}</div>
                      <div className="text-[14px] text-[#EFE2C0] mt-0.5">{e.name}</div>
                      <div className="text-[12px] text-[#E7D5A4]/50">{e.venue || 'Venue TBC'} · Your role: {e.assignment_title}</div>
                    </div>
                    <Badge status={e.assignment_status} />
                  </div>
                  <Progress value={Number(e.checked_in)} max={Number(e.tickets_issued)} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={e.event_date === today ? 'primary' : 'secondary'} icon="ScanLine" to={`/check-in?event=${e.id}`}>Check-in</Button>
                    <Button size="sm" icon="Users" to={`/admin/attendees?event=${e.id}`}>Attendees</Button>
                    <Button size="sm" variant="ghost" icon="Info" to={`/admin/my-events/${e.id}`}>Event info</Button>
                  </div>
                </li>
              ))}
            </ul>
          </AsyncBlock>
        </Panel>

        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Today's tasks" flush>
            <AsyncBlock loading={loading} error={error} onRetry={reload} empty={(data?.tasks || []).length === 0}
              emptyProps={{ title: 'Nothing due', hint: "You're all caught up.", icon: 'CircleCheck' }}>
              <ul className="divide-y divide-[#E7D5A4]/[0.06]">
                {(data?.tasks || []).map((t) => (
                  <li key={t.id} className="px-4 py-3 flex items-start gap-3">
                    <button onClick={() => completeTask(t)} aria-label={`Mark "${t.title}" done`}
                      className="group mt-0.5 w-5 h-5 shrink-0 rounded border border-[#C99A2E]/60 hover:bg-[#C99A2E]/20 flex items-center justify-center">
                      <Icon name="Check" size={13} className="opacity-0 group-hover:opacity-100 text-[#C99A2E]" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] text-[#EFE2C0]">{t.title}</div>
                      <div className="text-[12px] text-[#E7D5A4]/45">{t.event_name}{t.due_at ? ` · due ${fmt.dateTime(t.due_at)}` : ''}</div>
                    </div>
                    {t.priority === 'high' && <Badge tone="bad">High</Badge>}
                  </li>
                ))}
              </ul>
            </AsyncBlock>
          </Panel>

          <Panel title="Announcements" actions={<Button size="sm" variant="ghost" to="/admin/announcements">All</Button>} flush>
            <AsyncBlock loading={announcements.loading} error={announcements.error} onRetry={announcements.reload} empty={(announcements.data || []).length === 0}
              emptyProps={{ title: 'No announcements', icon: 'Megaphone' }}>
              <ul className="divide-y divide-[#E7D5A4]/[0.06]">
                {(announcements.data || []).map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] text-[#EFE2C0]">{a.title}</span>
                      {a.priority === 'high' && <Badge tone="bad">Important</Badge>}
                    </div>
                    <p className="text-[12.5px] text-[#E7D5A4]/60 mt-1 whitespace-pre-line">{a.body}</p>
                    <div className="font-mono text-[10.5px] text-[#E7D5A4]/35 mt-1">{a.events?.name ? `${a.events.name} · ` : ''}{fmt.relative(a.publish_at)}</div>
                  </li>
                ))}
              </ul>
            </AsyncBlock>
          </Panel>
        </div>
      </div>
    </Page>
  );
};

export default function DashboardPage() {
  const { kind } = useAdminSession();
  if (kind === 'super_admin') return <OrgDashboard superAdmin />;
  if (kind === 'admin') return <OrgDashboard />;
  return <StaffDashboard />;
}
