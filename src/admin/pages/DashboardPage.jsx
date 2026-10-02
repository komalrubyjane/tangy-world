import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { adminApi, friendlyError } from '../api';
import { useAsync } from '../hooks';
import { P, localISODate, ROLE_LABELS } from '../rbac';
import { auditLabel, auditSummary } from '../auditLabels';
import { Page, Panel, Grid, StatTile, Badge, AsyncBlock, Button, Icon, EmptyState, Skeleton, fmt, cx, useToast } from '../ui';

const APP_TYPE_LABEL = { artist: 'Artists', vendor: 'Vendors', sponsor: 'Sponsors', venue: 'Venues', crew: 'Crew', volunteer: 'Volunteers' };

function useSummary() {
  return useAsync(() => adminApi.dashboardSummary(), []);
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


function attentionItems(s, can) {
  if (!s) return [];
  const h = s.health || {};
  const items = [];
  const pending = s.applications?.pending || 0;
  if (pending && can(P.APPLICATIONS_VIEW)) {
    const byType = Object.entries(s.applications.by_type || {}).map(([t, n]) => `${n} ${APP_TYPE_LABEL[t] || t}`).join(', ');
    items.push({ tone: 'warn', label: `${pending} application${pending === 1 ? '' : 's'} awaiting review`, sub: byType, to: '/admin-portal/applications?status=pending' });
  }
  if (h.ticket_emails_failed) items.push({ tone: 'bad', label: `${h.ticket_emails_failed} ticket email${h.ticket_emails_failed === 1 ? '' : 's'} failed to send`, to: '/admin-portal/payments?email=failed' });
  if (h.approval_emails_failed && can(P.OPERATIONS)) items.push({ tone: 'bad', label: `${h.approval_emails_failed} approval email${h.approval_emails_failed === 1 ? '' : 's'} failed`, to: '/admin-portal/ops/notifications' });
  if (h.webhooks_unprocessed && can(P.PAYMENTS)) items.push({ tone: 'bad', label: `${h.webhooks_unprocessed} payment webhook${h.webhooks_unprocessed === 1 ? '' : 's'} not processed`, to: '/admin-portal/payments/webhooks' });
  if (h.stale_pending_bookings) items.push({ tone: 'warn', label: `${h.stale_pending_bookings} checkout${h.stale_pending_bookings === 1 ? '' : 's'} pending over 30 min`, sub: 'Abandoned checkouts still hold capacity', to: '/admin-portal/bookings?status=pending' });
  if (h.on_sale_past_date) items.push({ tone: 'warn', label: `${h.on_sale_past_date} event${h.on_sale_past_date === 1 ? '' : 's'} still on sale after the date`, sub: 'Mark as completed', to: '/admin-portal/events?when=past&status=on-sale' });
  if (h.open_tasks_overdue) items.push({ tone: 'warn', label: `${h.open_tasks_overdue} overdue event task${h.open_tasks_overdue === 1 ? '' : 's'}`, to: '/admin-portal/tasks?status=open' });
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
      messages && { label: `${messages} partner message${messages === 1 ? '' : 's'} awaiting reply`, sub: 'Artists, sponsors, vendors and venue hosts', to: '/admin-portal/messages', tone: 'warn' },
      requests && { label: `${requests} volunteer check-in request${requests === 1 ? '' : 's'}`, sub: 'Grant or decline time-limited access', to: '/admin-portal/volunteers?requests=1', tone: 'warn' },
      reviews && { label: `${reviews} partner response${reviews === 1 ? '' : 's'} to review`, sub: 'Submitted requirements', to: '/admin-portal/events', tone: 'warn' },
    ].filter(Boolean);
  }, []);
}

const AttentionPanel = ({ summary, loading, error, reload, extra = [] }) => {
  const { can } = useAdminSession();
  const ops = useOpsAttention(can);
  const items = [...(ops.data || []), ...extra, ...attentionItems(summary, can)];
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
                  {i.sub && <div className="text-[12px] text-[#E7D5A4]/60 mt-0.5">{i.sub}</div>}
                </div>
                <Icon name="ChevronRight" size={15} className="text-[#E7D5A4]/60 mt-0.5" />
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
    ['Super admins', p.super_admins, '/admin-portal/users?role=super_admin'],
    ['Admins / managers', p.admins, '/admin-portal/users?role=admin'],
    ['Staff', p.staff, '/admin-portal/users?role=staff'],
    ['Approved artists', p.artists, '/admin-portal/people/artists'],
    ['Venues', p.venues, '/admin-portal/people/venues'],
    ['Sponsors', p.sponsors, '/admin-portal/people/sponsors'],
    ['Vendors', p.vendors, '/admin-portal/people/vendors'],
    ['Crew', p.crew, '/admin-portal/people/crew'],
    ['Volunteers', p.volunteers, '/admin-portal/people/volunteers'],
  ] : [];
  const { can } = useAdminSession();
  return (
    <Panel title="People" subtitle={p ? `${fmt.num(p.users_total)} accounts · ${fmt.num(p.deactivated)} deactivated` : undefined} flush>
      {!p ? <div className="p-4 text-[12px] text-[#E7D5A4]/60">—</div> : (
        <ul className="grid grid-cols-2 sm:grid-cols-3">
          {rows.map(([label, n, to]) => {
            const linkable = to.startsWith('/admin-portal/users') ? can(P.USERS_MANAGE) : can(P.ENTITIES);
            const inner = (<><div className="font-condensed text-xl tabular-nums text-[#EFE2C0]">{fmt.num(n)}</div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60 mt-0.5">{label}</div></>);
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
    <Panel title="Recent activity" actions={<Button size="sm" variant="ghost" to="/admin-portal/audit">Audit log</Button>} flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={data?.length === 0}
        emptyProps={{ title: 'No activity recorded yet', hint: 'Sign-ins, approvals, event edits, check-ins and settings changes are logged here.', icon: 'ScrollText' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data || []).map((r) => (
            <li key={r.id} className="px-4 py-2.5 flex gap-3 text-[12.5px]">
              <span className="w-14 shrink-0 font-mono text-[11px] text-[#E7D5A4]/60 pt-px">{fmt.relative(r.created_at)}</span>
              <div className="min-w-0">
                <span className="text-[#EFE2C0]">{r.actor_email || 'System'}</span>
                <span className="text-[#E7D5A4]/60"> · {auditLabel(r.action)}</span>
                {auditSummary(r) && <div className="text-[#E7D5A4]/60 truncate">{auditSummary(r)}</div>}
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
    <Panel title="Latest bookings" actions={<Button size="sm" variant="ghost" to="/admin-portal/bookings">All bookings</Button>} flush>
      <AsyncBlock loading={loading} error={error} onRetry={reload} empty={data?.length === 0} emptyProps={{ title: 'No bookings yet', icon: 'Ticket' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data || []).map((b) => (
            <li key={b.id}>
              <Link to={`/admin-portal/bookings/${b.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] hover:bg-[#C99A2E]/[0.05]">
                <span className="font-mono text-[11.5px] text-[#C99A2E] w-24 shrink-0">{b.registration_code}</span>
                <span className="flex-1 min-w-0 truncate">{b.attendee_name} <span className="text-[#E7D5A4]/60">· {b.events?.name}</span></span>
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
      {can(P.PAYMENTS) && <StatTile label="Revenue" value={s ? fmt.money(s.revenue?.total) : '…'} sub={s ? `${fmt.money(s.revenue?.last_30_days)} in the last 30 days` : null} to="/admin-portal/reports" />}
      <StatTile label="Confirmed bookings" value={s ? fmt.num(s.bookings?.confirmed) : '…'} sub={s ? `${fmt.num(s.bookings?.last_7_days)} this week · ${fmt.num(s.bookings?.pending)} pending` : null} to="/admin-portal/bookings" />
      <StatTile label="Tickets issued" value={s ? fmt.num(s.tickets?.issued) : '…'} sub={s ? `${fmt.num(s.tickets?.checked_in)} attended · ${checkRate}` : null} to="/admin-portal/attendees" />
      <StatTile label="Pending applications" value={s ? fmt.num(s.applications?.pending) : '…'} tone={s?.applications?.pending ? 'warn' : undefined} sub="Artists, partners, crew" to="/admin-portal/applications?status=pending" />
      <StatTile label="Upcoming events" value={s ? fmt.num(s.events?.upcoming) : '…'} sub={s ? `${fmt.num(s.events?.today)} today · ${fmt.num(s.events?.draft)} drafts · ${fmt.num(s.events?.past)} past` : null} to="/admin-portal/events" />
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

export const HEALTH = {
  ready: { label: 'Ready', tone: 'good' },
  needs_attention: { label: 'Needs attention', tone: 'warn' },
  at_risk: { label: 'At risk', tone: 'bad' },
  live: { label: 'Live', tone: 'gold' },
  completed: { label: 'Completed', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Metric tile that only renders when the database returned a value for it.
const Metric = ({ label, value, sub, to, tone }) => (value == null ? null : <StatTile label={label} value={fmt.num(value)} sub={sub} to={to} tone={tone} />);

const TodayPanel = ({ today }) => (
  <Panel title="Today's operations" subtitle={today.length ? `${today.length} event${today.length === 1 ? '' : 's'} today` : undefined} flush>
    {today.length === 0 ? (
      <p className="px-4 py-6 text-[13px] text-[#E7D5A4]/60">No events today. Upcoming events and anything that needs attention are listed alongside.</p>
    ) : (
      <ul className="divide-y divide-[#E7D5A4]/[0.06]">
        {today.map((e) => {
          const pct = e.tickets ? Math.round((100 * e.checked_in) / e.tickets) : 0;
          return (
            <li key={e.id} className="px-4 py-4 flex flex-col gap-3" data-today-event>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link to={`/admin-portal/events/${e.id}`} className="text-[15px] text-[#EFE2C0] hover:underline">{e.name}</Link>
                  <div className="text-[12.5px] text-[#E7D5A4]/55">{[e.event_time, e.venue].filter(Boolean).join(' · ')}{e.doors_at ? ` · doors ${fmt.time(e.doors_at)}` : ''}</div>
                </div>
                <div className="flex gap-1.5"><Badge status="live">Live today</Badge>{e.open_tasks > 0 && <Badge tone="warn">{e.open_tasks} open task{e.open_tasks === 1 ? '' : 's'}</Badge>}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12.5px]">
                <div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60">Checked in</div><div className="text-[#EFE2C0] tabular-nums">{fmt.num(e.checked_in)} / {fmt.num(e.tickets)} <span className="text-[#E7D5A4]/60">({pct}%)</span></div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60">Capacity</div><div className="text-[#EFE2C0] tabular-nums">{fmt.num(e.capacity)}</div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60">Staff</div><div className="text-[#EFE2C0] tabular-nums">{fmt.num(e.staff)}</div></div>
                <div><div className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60">Volunteers</div><div className="text-[#EFE2C0] tabular-nums">{fmt.num(e.volunteers)}</div></div>
              </div>
              <div className="h-1.5 rounded-full bg-[#E7D5A4]/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Check-in progress for ${e.name}`}>
                <div className="h-full bg-[#2fb877]" style={{ width: `${pct}%` }} />
              </div>
              {e.artists.length > 0 ? (
                <table className="w-full text-[12.5px]">
                  <thead><tr className="text-left font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/60"><th className="font-normal py-1">Artist</th><th className="font-normal">Call</th><th className="font-normal">Soundcheck</th><th className="font-normal">Performance</th></tr></thead>
                  <tbody>{e.artists.map((a) => (
                    <tr key={a.name} className="border-t border-[#E7D5A4]/[0.05]">
                      <td className="py-1.5 text-[#EFE2C0]">{a.name}</td>
                      <td className="tabular-nums">{a.call_time ? fmt.time(a.call_time) : '—'}</td>
                      <td className="tabular-nums">{a.soundcheck_at ? fmt.time(a.soundcheck_at) : '—'}</td>
                      <td className="tabular-nums">{a.performance_start ? `${fmt.time(a.performance_start)}${a.performance_end ? `–${fmt.time(a.performance_end)}` : ''}` : <span className="text-[#f5b544]">Not set</span>}</td>
                    </tr>))}
                  </tbody>
                </table>
              ) : <p className="text-[12.5px] text-[#f5b544]">No artist on the lineup.</p>}
            </li>
          );
        })}
      </ul>
    )}
  </Panel>
);

const UpcomingPanel = ({ upcoming }) => (
  <Panel title="Upcoming (next 30 days)" actions={<Button size="sm" variant="ghost" to="/admin-portal/events">All events</Button>} flush>
    {upcoming.length === 0 ? (
      <EmptyState icon="CalendarDays" title="No upcoming events" hint="Create an event to start selling tickets." action={<Button size="sm" to="/admin-portal/events/new" icon="Plus">Create event</Button>} />
    ) : (
      <ul className="divide-y divide-[#E7D5A4]/[0.06]">
        {upcoming.map((e) => {
          const h = HEALTH[e.health] || HEALTH.ready;
          const d = new Date(`${e.event_date}T00:00:00`);
          return (
            <li key={e.id}>
              <Link to={`/admin-portal/events/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#C99A2E]/[0.05]">
                <div className="w-12 shrink-0 text-center bg-[#11100C] border border-[#C99A2E]/25 rounded py-1">
                  <div className="font-mono text-[9.5px] uppercase text-[#C99A2E]">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                  <div className="font-condensed text-[18px] leading-none text-[#EFE2C0]">{d.getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-[#EFE2C0] truncate">{e.name}</div>
                  <div className="text-[12px] text-[#E7D5A4]/60 truncate">{[d.toLocaleDateString('en-IN', { weekday: 'short' }), e.event_time, e.venue || 'Venue TBC'].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="hidden sm:block"><Progress value={Number(e.tickets)} max={e.capacity} /></div>
                <Badge tone={h.tone}>{h.label}</Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </Panel>
);

const OPS_ATTENTION = [
  ['expiring_access', 'volunteer check-in grant(s) ending within 30 min', '/admin-portal/volunteers?access=active', 'warn'],
  ['failed_ticket_emails', 'ticket email(s) failed to send', '/admin-portal/bookings', 'bad'],
  ['failed_webhooks', 'payment webhook(s) failed in the last 30 days', '/admin-portal/bookings', 'bad'],
  ['stale_pending_bookings', 'unpaid checkout(s) past the hold time (expire automatically)', '/admin-portal/bookings?status=pending', 'warn'],
  ['events_without_venue', 'upcoming event(s) without a venue', '/admin-portal/events', 'warn'],
  ['events_without_artists', 'event(s) in the next 14 days without an artist', '/admin-portal/events', 'bad'],
  ['artists_missing_logistics', 'artist slot(s) without a performance time', '/admin-portal/events', 'warn'],
  ['sponsor_deliverables_due', 'sponsor deliverable(s) due within 7 days', '/admin-portal/people/sponsors', 'warn'],
  ['events_without_documents', 'event(s) in the next 14 days without documents', '/admin-portal/events', 'warn'],
];

const QuickActions = ({ can }) => {
  const actions = [
    [P.EVENTS_MANAGE, 'Create event', '/admin-portal/events/new', 'Plus'],
    [P.ENTITIES, 'Add artist', '/admin-portal/people/artists?new=1', 'Mic'],
    [P.APPLICATIONS_REVIEW, 'Review applications', '/admin-portal/applications?status=pending', 'Inbox'],
    [P.CONTENT, 'Send announcement', '/admin-portal/content?new=1', 'Megaphone'],
    [P.CHECKIN, 'Open check-in', '/check-in', 'ScanLine'],
    [P.EVENTS_MANAGE, 'Create requirement', '/admin-portal/events', 'ClipboardList'],
    [P.STAFF_INVITE, 'Invite staff', '/admin-portal/users?invite=1', 'UserPlus'],
    [P.MESSAGES, 'Open messages', '/admin-portal/messages', 'MessagesSquare'],
  ].filter(([perm]) => can(perm));
  return (
    <Panel title="Quick actions">
      <div className="grid grid-cols-2 gap-2">
        {actions.map(([, label, to, icon]) => (
          <Link key={label} to={to} className="flex items-center gap-2 h-10 px-3 rounded border border-[#C99A2E]/25 text-[12.5px] text-[#E7D5A4]/85 hover:border-[#C99A2E]/60 hover:bg-[#C99A2E]/[0.06]">
            <Icon name={icon} size={15} className="text-[#C99A2E]" />{label}
          </Link>
        ))}
      </div>
    </Panel>
  );
};

// Today at a glance for artists — artist_day_summary (0034).
const ArtistsTodayPanel = () => {
  const day = localISODate();
  const q = useAsync(async () => {
    const { data, error } = await supabase.rpc('artist_day_summary', { p_date: day });
    if (error) throw error;
    return data;
  }, []);
  const d = q.data;
  return (
    <Panel title="Today · artists" subtitle="From the event line-ups and each artist's calendar.">
      <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload}>
        <div className="grid grid-cols-2 gap-2" data-artist-today>
          <StatTile label="Sessions" value={d?.sessions} to="/admin-portal/events?when=today" />
          <StatTile label="Artists booked" value={d?.artists_booked} to={`/admin-portal/calendar?day=${day}`} />
          <StatTile label="Artists available" value={d?.artists_available} to={`/admin-portal/calendar?day=${day}`} tone="good" />
          <StatTile label="Pending requests" value={d?.pending_requests} tone={d?.pending_requests ? 'warn' : undefined} to="/admin-portal/calendar" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" icon="Plus" to="/admin-portal/events/new">Create event</Button>
          <Button size="sm" icon="CalendarDays" to={`/admin-portal/calendar?day=${day}`}>Find available artists</Button>
          <Button size="sm" icon="Send" to="/admin-portal/events?when=upcoming">Send artist request</Button>
        </div>
      </AsyncBlock>
    </Panel>
  );
};

const OrgDashboard = ({ superAdmin }) => {
  const { can, user } = useAdminSession();
  const { data: s, loading, error, reload } = useSummary();
  const ops = useAsync(() => adminApi.operationsOverview(), []);
  // Waitlist and payment-review counts (0026/0027) — read under the admin's RLS.
  const queue = useAsync(async () => {
    const head = (table, build) => build(supabase.from(table).select('id', { count: 'exact', head: true })).then((r) => r.count ?? 0);
    const [waiting, offered, review] = await Promise.all([
      head('waitlist', (q) => q.eq('status', 'waiting').not('user_id', 'is', null)),
      head('waitlist', (q) => q.eq('status', 'offered')),
      can(P.PAYMENTS) ? head('bookings', (q) => q.eq('payment_status', 'needs_review')) : Promise.resolve(null),
    ]);
    return { waiting, offered, review };
  }, []);
  const o = ops.data;
  const m = o?.metrics || {};
  const extra = o ? OPS_ATTENTION.filter(([k]) => o.attention[k] > 0).map(([k, label, to, tone]) => ({ label: `${o.attention[k]} ${label}`, to, tone })) : [];
  const urgent = extra.length + [m.pending_applications, m.partner_messages_waiting, m.access_requests, m.overdue_requirements, m.overdue_tasks].filter((n) => n > 0).length;
  const status = !o ? 'Loading operations…'
    : `${m.live_events ? `${m.live_events} event${m.live_events === 1 ? '' : 's'} live today` : 'No events today'} · ${urgent ? `${urgent} area${urgent === 1 ? '' : 's'} need attention` : 'all clear'}`;
  return (
    <Page
      title={`${greeting()}${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
      subtitle={<span data-ops-status>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {superAdmin ? 'Super Admin' : ROLE_LABELS[user?.role]} · {status}</span>}
      actions={
        <>
          {can(P.EVENTS_MANAGE) && <Button icon="Plus" to="/admin-portal/events/new">New event</Button>}
          {can(P.APPLICATIONS_REVIEW) && <Button variant="primary" icon="Inbox" to="/admin-portal/applications?status=pending">Review applications</Button>}
        </>
      }
    >
      {(error || ops.error) && <Panel><AsyncBlock error={error || ops.error} onRetry={() => { reload(); ops.reload(); }} /></Panel>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5" data-metrics>
        <Metric label="Upcoming events" value={m.upcoming_events} to="/admin-portal/events" />
        <Metric label="Live today" value={m.live_events} tone={m.live_events ? "good" : undefined} to="/admin-portal/events" />
        <Metric label="Tickets sold" value={m.tickets_sold_upcoming} sub="for today & upcoming" to="/admin-portal/bookings" />
        <Metric label="Checked in today" value={m.checked_in_today} sub={m.tickets_today ? `of ${fmt.num(m.tickets_today)} · ${fmt.pct((100 * m.checked_in_today) / m.tickets_today)}` : 'no tickets today'} to="/admin-portal/check-ins" />
        <Metric label="Pending applications" value={m.pending_applications} tone={m.pending_applications ? 'warn' : undefined} to="/admin-portal/applications?status=pending" />
        <Metric label="Pending payments" value={m.pending_payments} to="/admin-portal/bookings?status=pending" />
        <Metric label="Open requirements" value={m.open_requirements} sub={m.overdue_requirements ? `${m.overdue_requirements} overdue` : undefined} tone={m.overdue_requirements ? 'warn' : undefined} to="/admin-portal/events" />
        <Metric label="Partner messages" value={m.partner_messages_waiting} sub="awaiting reply" tone={m.partner_messages_waiting ? 'warn' : undefined} to="/admin-portal/messages?status=open" />
        <Metric label="Access requests" value={m.access_requests} tone={m.access_requests ? 'warn' : undefined} to="/admin-portal/volunteers?requests=1" />
        <Metric label="Overdue tasks" value={m.overdue_tasks} tone={m.overdue_tasks ? 'danger' : undefined} to="/admin-portal/tasks?status=overdue" />
        <Metric label="Waitlist" value={queue.data?.waiting} sub={queue.data ? `${fmt.num(queue.data.offered)} holding an offer` : undefined} to="/admin-portal/waitlist" />
        {queue.data?.review != null && <Metric label="Payments to review" value={queue.data.review} tone={queue.data.review ? 'danger' : undefined} sub="late / mismatched" to="/admin-portal/payments" />}
      </div>
      <KpiRow s={s} can={can} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 flex flex-col gap-4 min-w-0">
          {ops.loading && !o ? <Panel><Skeleton rows={4} /></Panel> : o && <TodayPanel today={o.today} />}
          {o && <UpcomingPanel upcoming={o.upcoming} />}
          {superAdmin ? <RecentActivityPanel /> : <RecentBookingsPanel />}
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          {can(P.EVENTS_MANAGE) && <ArtistsTodayPanel />}
          <AttentionPanel summary={s} loading={loading} error={error} reload={reload} extra={extra} />
          <QuickActions can={can} />
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
      actions={<>
        {/* Volunteer access is applied for per session and approved by an admin; it never changes the staff role. */}
        <Button variant="ghost" size="lg" icon="HeartHandshake" to="/volunteer/apply">Volunteer at a session</Button>
        <Button variant="primary" size="lg" icon="ScanLine" to="/check-in">Open QR check-in</Button>
      </>}
    >
      <Grid cols={3}>
        <StatTile label="Assigned events" value={loading ? '…' : events.length} sub="From yesterday onward" to="/admin-portal/my-events" />
        <StatTile label="Open tasks" value={loading ? '…' : (data?.tasks || []).length} sub="Due today or for upcoming events" to="/admin-portal/tasks" />
        <StatTile label="My check-ins today" value={loading ? '…' : data?.checkins_by_me_today} to="/admin-portal/check-ins?mine=1" />
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
                      <div className="text-[12px] text-[#E7D5A4]/60">{e.venue || 'Venue TBC'} · Your role: {e.assignment_title}</div>
                    </div>
                    <Badge status={e.assignment_status} />
                  </div>
                  <Progress value={Number(e.checked_in)} max={Number(e.tickets_issued)} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={e.event_date === today ? 'primary' : 'secondary'} icon="ScanLine" to={`/check-in?event=${e.id}`}>Check-in</Button>
                    <Button size="sm" icon="Users" to={`/admin-portal/attendees?event=${e.id}`}>Attendees</Button>
                    <Button size="sm" variant="ghost" icon="Info" to={`/admin-portal/my-events/${e.id}`}>Event info</Button>
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
                      <div className="text-[12px] text-[#E7D5A4]/60">{t.event_name}{t.due_at ? ` · due ${fmt.dateTime(t.due_at)}` : ''}</div>
                    </div>
                    {t.priority === 'high' && <Badge tone="bad">High</Badge>}
                  </li>
                ))}
              </ul>
            </AsyncBlock>
          </Panel>

          <Panel title="Announcements" actions={<Button size="sm" variant="ghost" to="/admin-portal/announcements">All</Button>} flush>
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
                    <div className="font-mono text-[10.5px] text-[#E7D5A4]/60 mt-1">{a.events?.name ? `${a.events.name} · ` : ''}{fmt.relative(a.publish_at)}</div>
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
