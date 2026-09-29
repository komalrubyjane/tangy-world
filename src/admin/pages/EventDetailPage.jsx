import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { assignmentService } from '../../services/assignmentService';
import { useAdminSession } from '../AdminSession';
import { adminApi, friendlyError, update, remove, insert } from '../api';
import { useAsync } from '../hooks';
import { P, EVENT_STATUS_LABELS, TICKET_TIERS, TAX_RATE, eventPhase } from '../rbac';
import {
  Page, Panel, Grid, StatTile, Tabs, Badge, Button, KeyValue, AsyncBlock, ConfirmDialog, NotFound, Skeleton, Select, Input,
  Textarea, Field, Icon, fmt, useToast,
} from '../ui';
import { EventForm } from '../components/EventForm';
import { HEALTH } from './DashboardPage';
import { BookingsTable } from '../components/Bookings';
import { AttendeesTable } from '../components/Attendees';
import { TeamManager } from '../components/Team';
import { TasksTable } from '../components/Tasks';
import { AnnouncementsManager } from '../components/Announcements';
import { CheckinHistoryTable } from '../components/CheckinHistory';
import { CommandCenter, ScheduleTab, RequirementsTab, DocumentsTab, EventMessagesTab, ActivityTab } from '../components/EventOps';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'artists', label: 'Artists' },
  { id: 'venue', label: 'Venue' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'crew', label: 'Crew & vendors' },
  { id: 'volunteers', label: 'Volunteers' },
  { id: 'team', label: 'Staff team' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'attendees', label: 'Attendees' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'messages', label: 'Messages', requires: P.MESSAGES },
  { id: 'documents', label: 'Documents' },
  { id: 'content', label: 'Content' },
  { id: 'reports', label: 'Reports' },
  { id: 'activity', label: 'Activity', requires: P.AUDIT },
];

function usePerformance(evt) {
  return useAsync(async () => {
    if (!evt || evt.status === 'draft') return null;
    const rows = await adminApi.reportEventPerformance(evt.event_date, evt.event_date);
    return (rows || []).find((r) => r.event_id === evt.id) || null;
  }, [evt?.id, evt?.status, evt?.event_date]);
}

// ---------------------------------------------------------------------------

const OverviewTab = ({ evt, perf, stats, onTab, health }) => {
  const { can } = useAdminSession();
  const sold = Number(perf?.tickets_sold || 0);
  return (
    <div className="flex flex-col gap-4">
      {health && (
        <Panel title="Event health" subtitle="Rule-based: lineup, venue, staff, requirements, messages, access requests, tasks, logistics" flush>
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            <Badge tone={HEALTH[health.state]?.tone}>{HEALTH[health.state]?.label}</Badge>
            {health.reasons.length === 0 ? <span className="text-[13px] text-[#E7D5A4]/60">Nothing outstanding.</span>
              : <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#E7D5A4]/80" data-health-reasons>{health.reasons.map((r) => <li key={r} className="flex items-center gap-1.5"><Icon name="TriangleAlert" size={13} className="text-[#f5b544]" />{r}</li>)}</ul>}
          </div>
        </Panel>
      )}
      <CommandCenter evt={evt} onTab={onTab} />
      <Grid cols={5}>
        <StatTile label="Tickets sold" value={fmt.num(sold)} sub={`of ${fmt.num(evt.capacity)} capacity${perf?.sell_through != null ? ` · ${fmt.pct(perf.sell_through)}` : ''}`} />
        {can(P.PAYMENTS) && <StatTile label="Revenue" value={fmt.money(perf?.revenue ?? 0)} sub={perf?.complimentary ? `${perf.complimentary} complimentary` : 'Confirmed bookings'} />}
        <StatTile label="Checked in" value={fmt.num(stats?.checked_in ?? 0)} sub={stats ? `${fmt.num(stats.remaining)} still to arrive` : null} />
        <StatTile label="Check-in rate" value={perf?.check_in_rate != null ? fmt.pct(perf.check_in_rate) : '—'} sub={stats?.manual ? `${stats.manual} manual` : 'All via QR'} />
        <StatTile label="Pending checkouts" value={fmt.num(perf?.bookings_pending ?? 0)} tone={perf?.bookings_pending ? 'warn' : undefined} sub={`${fmt.num(perf?.bookings_cancelled ?? 0)} cancelled · ${fmt.num(perf?.bookings_refunded ?? 0)} refunded`} />
      </Grid>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Event" actions={can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" icon="Pencil" onClick={() => onTab('details')}>Edit</Button>}>
          <KeyValue items={[
            ['Date', fmt.date(evt.event_date)],
            ['Time', [evt.event_time, evt.end_time].filter(Boolean).join(' – ') || '—'],
            ['Venue', evt.venue],
            ['Status', <Badge key="status" status={evt.status}>{EVENT_STATUS_LABELS[evt.status]}</Badge>],
            ['Capacity', fmt.num(evt.capacity)],
            ['Base price', fmt.money(evt.price)],
            ['Public page', evt.status !== 'draft' ? <a key="page" className="underline" href={`/book/${evt.slug}`} target="_blank" rel="noreferrer">/book/{evt.slug}</a> : 'Not published'],
          ]} />
        </Panel>
        <Panel title="Description">
          <p className="text-[13px] text-[#E7D5A4]/75 whitespace-pre-line">{evt.description || <span className="text-[#E7D5A4]/35">No description yet.</span>}</p>
        </Panel>
      </div>
    </div>
  );
};

const ArtistsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const [artistId, setArtistId] = useState('');
  const [message, setMessage] = useState('');
  const [slot, setSlot] = useState({ start: '', end: '', fee: '', deadline: '' });
  const data = useAsync(async () => {
    const [{ data: linked, error: e1 }, { data: approved, error: e2 }, requests] = await Promise.all([
      supabase.from('event_artists').select('artist_id, artists(id, name, genre, city, user_id)').eq('event_id', evt.id),
      supabase.from('artists').select('id, name, user_id').eq('status', 'approved').order('name'),
      supabase.from('assignment_requests').select('id, artist_id, status, created_at, responded_at, proposed_start, proposed_end, fee_offer, expires_at, decline_reason, artists(name)')
        .eq('session_id', evt.id).order('created_at', { ascending: false }).then(({ data: rows, error }) => {
          if (error) throw friendlyError(error);
          return (rows || []).map((r) => ({ id: r.id, artistId: r.artist_id, artistName: r.artists?.name, status: r.status, createdAt: r.created_at,
            respondedAt: r.responded_at, start: r.proposed_start, end: r.proposed_end, fee: r.fee_offer, expiresAt: r.expires_at, reason: r.decline_reason }));
        }),
    ]);
    if (e1 || e2) throw friendlyError(e1 || e2);
    return { linked: (linked || []).map((l) => l.artists).filter(Boolean), approved: approved || [], requests };
  }, [evt.id]);
  const linkedIds = new Set((data.data?.linked || []).map((a) => a.id));
  const pendingIds = new Set((data.data?.requests || []).filter((r) => r.status === 'pending').map((r) => r.artistId));
  const selected = (data.data?.approved || []).find((a) => a.id === artistId);

  const request = async () => {
    try {
      const toIso = (v) => (v ? new Date(v).toISOString() : null);
      await adminApi.createBookingRequest({
        eventId: evt.id, artistId: selected.id, message: message.trim() || null, start: toIso(slot.start), end: toIso(slot.end),
        fee: slot.fee === '' ? null : Number(slot.fee), expiresAt: slot.deadline ? new Date(`${slot.deadline}T23:59:00`).toISOString() : null,
      });
      toast('Request sent — the artist answers from their portal');
      setArtistId(''); setMessage(''); setSlot({ start: '', end: '', fee: '', deadline: '' });
      data.reload();
    } catch (err) { toast(friendlyError(err).message, 'bad'); }
  };
  const addDirect = async () => {
    const { error } = await supabase.from('event_artists').insert({ event_id: evt.id, artist_id: selected.id });
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    toast(`${selected.name} added to the lineup`);
    setArtistId('');
    data.reload();
  };
  const removeArtist = async (a) => {
    const { error } = await supabase.from('event_artists').delete().eq('event_id', evt.id).eq('artist_id', a.id);
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    data.reload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Confirmed lineup" flush>
        <AsyncBlock loading={data.loading} error={data.error} onRetry={data.reload} empty={(data.data?.linked || []).length === 0}
          emptyProps={{ title: 'No artists confirmed', icon: 'Contact' }}>
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {(data.data?.linked || []).map((a) => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0"><div className="text-[13.5px] text-[#EFE2C0]">{a.name}</div><div className="text-[12px] text-[#E7D5A4]/45">{[a.genre, a.city].filter(Boolean).join(' · ')}</div></div>
                {can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Remove ${a.name}`} onClick={() => removeArtist(a)} />}
              </li>
            ))}
          </ul>
        </AsyncBlock>
      </Panel>
      <div className="flex flex-col gap-4">
        {can(P.EVENTS_MANAGE) && (
          <Panel title="Book an artist">
            <div className="flex flex-col gap-3">
              <Field label="Approved artist">
                <Select value={artistId} onChange={(e) => setArtistId(e.target.value)}>
                  <option value="">Select…</option>
                  {(data.data?.approved || []).filter((a) => !linkedIds.has(a.id)).map((a) => <option key={a.id} value={a.id} disabled={pendingIds.has(a.id)}>{a.name}{pendingIds.has(a.id) ? ' — request pending' : ''}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Proposed set starts"><Input type="datetime-local" value={slot.start} onChange={(e) => setSlot({ ...slot, start: e.target.value })} /></Field>
                <Field label="Proposed set ends"><Input type="datetime-local" value={slot.end} onChange={(e) => setSlot({ ...slot, end: e.target.value })} /></Field>
                <Field label="Fee offer (₹)"><Input type="number" min="0" value={slot.fee} onChange={(e) => setSlot({ ...slot, fee: e.target.value })} placeholder="Optional" /></Field>
                <Field label="Reply by" hint="Default: 7 days"><Input type="date" value={slot.deadline} onChange={(e) => setSlot({ ...slot, deadline: e.target.value })} /></Field>
              </div>
              <Field label="Message to artist"><Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional" /></Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={!selected || !selected.user_id} onClick={request}>Send request</Button>
                <Button disabled={!selected} onClick={addDirect}>Add directly</Button>
              </div>
              {selected && !selected.user_id && <p className="text-[12px] text-[#E7D5A4]/45">This artist has no portal account — add them directly.</p>}
            </div>
          </Panel>
        )}
        <Panel title="Requests" flush>
          {(data.data?.requests || []).length === 0 ? <div className="p-4 text-[12.5px] text-[#E7D5A4]/45">No requests sent for this event.</div> : (
            <ul className="divide-y divide-[#E7D5A4]/[0.06]">
              {data.data.requests.map((r) => (
                <li key={r.id} className="px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="flex-1 min-w-[140px]">{r.artistName}
                    <span className="block text-[11.5px] text-[#E7D5A4]/45">
                      {[r.start && `${fmt.dateTime(r.start)}${r.end ? `–${fmt.time(r.end)}` : ''}`, r.fee != null && fmt.money(r.fee),
                        r.status === 'pending' && r.expiresAt && `reply by ${fmt.date(r.expiresAt)}`, r.reason && `“${r.reason}”`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-[#E7D5A4]/40">{fmt.relative(r.createdAt)}</span>
                  <Badge status={r.status === 'accepted' ? 'approved' : r.status} />
                  {r.status === 'pending' && can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" onClick={async () => { await assignmentService.cancel(r.id); data.reload(); }}>Withdraw</Button>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

const VenueTab = ({ evt }) => {
  const venue = useAsync(async () => {
    const [v, partner] = await Promise.all([
      evt.venue_id ? supabase.from('venues').select('*').eq('id', evt.venue_id).maybeSingle() : Promise.resolve({ data: null }),
      evt.venue_partner_id ? supabase.from('venue_profiles').select('property_name, location, capacity, profiles(full_name, email, phone)').eq('id', evt.venue_partner_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { venue: v.data, partner: partner.data };
  }, [evt.venue_id, evt.venue_partner_id]);
  const v = venue.data?.venue;
  const p = venue.data?.partner;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Venue" actions={<Button size="sm" variant="ghost" to="/admin-portal/people/venues">Venue directory</Button>}>
        {venue.loading ? <Skeleton rows={3} /> : v ? (
          <KeyValue items={[['Name', v.name], ['Address', v.address], ['City', v.city], ['Capacity', v.capacity != null ? `${fmt.num(v.capacity)}${v.capacity < evt.capacity ? ' — below event capacity!' : ''}` : '—'], ['Contact', [v.contact_name, v.contact_phone, v.contact_email].filter(Boolean).join(' · ')], ['Notes', v.notes]]} />
        ) : <p className="text-[13px] text-[#E7D5A4]/55">{evt.venue ? `"${evt.venue}" isn't linked to the venue directory yet — pick it on the Details tab.` : 'No venue set.'}</p>}
      </Panel>
      <Panel title="Venue partner account">
        {p ? <KeyValue items={[['Property', p.property_name], ['Location', p.location], ['Capacity', p.capacity], ['Contact', p.profiles?.full_name], ['Email', p.profiles?.email], ['Phone', p.profiles?.phone]]} />
          : <p className="text-[13px] text-[#E7D5A4]/55">No venue partner linked to this event.</p>}
      </Panel>
    </div>
  );
};

const SponsorsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const [form, setForm] = useState({ sponsor: '', title: '', due: '' });
  const data = useAsync(async () => {
    const [{ data: rows, error }, { data: sponsors }] = await Promise.all([
      supabase.from('sponsor_deliverables').select('*, sponsor_profiles(organization_name)').eq('event_id', evt.id).order('created_at'),
      supabase.from('sponsor_profiles').select('id, organization_name, profiles(full_name, email)'),
    ]);
    if (error) throw friendlyError(error);
    return { rows: rows || [], sponsors: sponsors || [] };
  }, [evt.id]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('sponsor_deliverables', { sponsor_profile_id: form.sponsor, event_id: evt.id, title: form.title.trim(), due_date: form.due || null });
      setForm({ sponsor: '', title: '', due: '' });
      data.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const toggle = async (d) => {
    try { await update('sponsor_deliverables', d.id, { status: d.status === 'delivered' ? 'pending' : 'delivered' }); data.reload(); } catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <Panel title="Sponsors & deliverables" flush>
      {can(P.EVENTS_MANAGE) && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto_auto] gap-2 items-end">
          <Field label="Sponsor"><Select value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })}>
            <option value="">{(data.data?.sponsors || []).length ? 'Select…' : 'No approved sponsors'}</option>
            {(data.data?.sponsors || []).map((s) => <option key={s.id} value={s.id}>{s.organization_name || s.profiles?.full_name || s.profiles?.email}</option>)}
          </Select></Field>
          <Field label="Deliverable"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Logo on stage banner" /></Field>
          <Field label="Due"><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
          <Button type="submit" variant="primary" disabled={!form.sponsor || !form.title.trim()}>Add</Button>
        </form>
      )}
      <AsyncBlock loading={data.loading} error={data.error} onRetry={data.reload} empty={(data.data?.rows || []).length === 0}
        emptyProps={{ title: 'No sponsor deliverables for this event', icon: 'Contact' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(data.data?.rows || []).map((d) => (
            <li key={d.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
              <span className="text-[#C99A2E] w-40 truncate">{d.sponsor_profiles?.organization_name || 'Sponsor'}</span>
              <span className="flex-1 min-w-0 truncate">{d.title}</span>
              {d.due_date && <span className="font-mono text-[11px] text-[#E7D5A4]/40">due {fmt.date(d.due_date)}</span>}
              <Badge status={d.status === 'delivered' ? 'done' : 'pending'}>{d.status}</Badge>
              {can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" onClick={() => toggle(d)}>{d.status === 'delivered' ? 'Reopen' : 'Delivered'}</Button>}
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

const TicketsTab = ({ evt, perf }) => {
  const counts = useAsync(async () => {
    const { data, error } = await supabase.from('tickets').select('tier, status').eq('event_id', evt.id);
    if (error) throw friendlyError(error);
    const byTier = {};
    (data || []).forEach((t) => {
      const k = t.tier || 'gen';
      byTier[k] = byTier[k] || { issued: 0, checked_in: 0, cancelled: 0 };
      if (t.status === 'cancelled') byTier[k].cancelled += 1; else byTier[k].issued += 1;
      if (t.status === 'checked_in') byTier[k].checked_in += 1;
    });
    return byTier;
  }, [evt.id]);
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Ticket types" subtitle="Prices are computed server-side at checkout (base price + tier markup + 18% tax). Tiers are defined in the payment function." flush>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-[#C99A2E]/20 font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45 text-left">
              <th className="px-4 py-2">Type</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">With tax</th><th className="px-4 py-2 text-right">Issued</th><th className="px-4 py-2 text-right">Checked in</th><th className="px-4 py-2 text-right">Cancelled</th>
            </tr></thead>
            <tbody>
              {TICKET_TIERS.map((t) => {
                const c = counts.data?.[t.id] || { issued: 0, checked_in: 0, cancelled: 0 };
                const price = evt.price + t.markup;
                return (
                  <tr key={t.id} className="border-b border-[#E7D5A4]/[0.06]">
                    <td className="px-4 py-2.5 text-[#EFE2C0]">{t.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt.money(price)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#E7D5A4]/60">{fmt.money(Math.round(price * (1 + TAX_RATE)))}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt.num(c.issued)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt.num(c.checked_in)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#E7D5A4]/50">{fmt.num(c.cancelled)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Grid cols={3}>
        <StatTile label="Capacity" value={fmt.num(evt.capacity)} />
        <StatTile label="Sold (confirmed)" value={fmt.num(perf?.tickets_sold ?? 0)} />
        <StatTile label="Booking status" value={EVENT_STATUS_LABELS[evt.status]} sub={evt.status === 'on-sale' ? 'Checkout open' : 'Checkout closed'} />
      </Grid>
    </div>
  );
};

const CheckinTab = ({ evt, stats }) => (
  <div className="flex flex-col gap-4">
    <Grid cols={4}>
      <StatTile label="Tickets issued" value={fmt.num(stats?.tickets_issued ?? 0)} />
      <StatTile label="Checked in" value={fmt.num(stats?.checked_in ?? 0)} tone="good" />
      <StatTile label="Still to arrive" value={fmt.num(stats?.remaining ?? 0)} tone={stats?.remaining ? 'warn' : undefined} />
      <StatTile label="Manual check-ins" value={fmt.num(stats?.manual ?? 0)} />
    </Grid>
    <div><Button variant="primary" icon="ScanLine" to={`/check-in?event=${evt.id}`}>Open check-in terminal</Button></div>
    <CheckinHistoryTable eventId={evt.id} />
  </div>
);

const ReportsTab = ({ evt, perf }) => {
  const breakdown = useAsync(async () => {
    const { data, error } = await supabase.from('bookings').select('status, source, quantity, amount').eq('event_id', evt.id);
    if (error) throw friendlyError(error);
    const byStatus = {};
    (data || []).forEach((b) => {
      const k = b.source === 'complimentary' ? `${b.status} (comp)` : b.status;
      byStatus[k] = byStatus[k] || { bookings: 0, tickets: 0, amount: 0 };
      byStatus[k].bookings += 1; byStatus[k].tickets += b.quantity; byStatus[k].amount += b.amount;
    });
    return byStatus;
  }, [evt.id]);
  const { can } = useAdminSession();
  return (
    <div className="flex flex-col gap-4">
      {!perf ? <Panel><p className="text-[13px] text-[#E7D5A4]/55">{evt.status === 'draft' ? 'Reports are available once the event is published.' : 'No sales data yet.'}</p></Panel> : (
        <Grid cols={4}>
          <StatTile label="Sell-through" value={fmt.pct(perf.sell_through)} sub={`${fmt.num(perf.tickets_sold)} / ${fmt.num(perf.capacity)}`} />
          <StatTile label="Check-in rate" value={perf.check_in_rate != null ? fmt.pct(perf.check_in_rate) : '—'} sub={`${fmt.num(perf.checked_in)} attended`} />
          {can(P.PAYMENTS) && <StatTile label="Revenue" value={fmt.money(perf.revenue)} sub={perf.tickets_sold ? `${fmt.money(Math.round(perf.revenue / Math.max(1, perf.tickets_sold - perf.complimentary)))} per paid ticket` : null} />}
          <StatTile label="Complimentary" value={fmt.num(perf.complimentary)} />
        </Grid>
      )}
      <Panel title="Bookings by status" flush>
        <AsyncBlock loading={breakdown.loading} error={breakdown.error} empty={Object.keys(breakdown.data || {}).length === 0} emptyProps={{ title: 'No bookings yet', icon: 'Ticket' }}>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-[#C99A2E]/20 font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45 text-left"><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Bookings</th><th className="px-4 py-2 text-right">Tickets</th>{can(P.PAYMENTS) && <th className="px-4 py-2 text-right">Amount</th>}</tr></thead>
            <tbody>
              {Object.entries(breakdown.data || {}).map(([k, v]) => (
                <tr key={k} className="border-b border-[#E7D5A4]/[0.06]"><td className="px-4 py-2.5"><Badge status={k.split(' ')[0]}>{k}</Badge></td><td className="px-4 py-2.5 text-right tabular-nums">{v.bookings}</td><td className="px-4 py-2.5 text-right tabular-nums">{v.tickets}</td>{can(P.PAYMENTS) && <td className="px-4 py-2.5 text-right tabular-nums">{fmt.money(v.amount)}</td>}</tr>
              ))}
            </tbody>
          </table>
        </AsyncBlock>
      </Panel>
    </div>
  );
};

// ---------------------------------------------------------------------------

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAdminSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.requires || can(t.requires));
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (t) => setParams({ tab: t }, { replace: true });
  const [confirm, setConfirm] = useState(null);

  const eventQ = useAsync(async () => {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (error) throw friendlyError(error);
    return data;
  }, [id]);
  const evt = eventQ.data;
  const perf = usePerformance(evt);
  const stats = useAsync(() => (evt ? adminApi.eventCheckinStats(evt.id) : null), [evt?.id]);
  const health = useAsync(() => (evt ? adminApi.eventHealth(evt.id) : null), [evt?.id, evt?.status, evt?.event_date]);
  const refresh = () => { eventQ.reload(); perf.reload(); stats.reload(); };

  if (eventQ.loading && !evt) return <Skeleton rows={10} />;
  if (eventQ.error) return <Panel><AsyncBlock error={eventQ.error} onRetry={eventQ.reload} /></Panel>;
  if (!evt) return <NotFound what="event" />;

  const phase = eventPhase(evt);
  const setStatus = async (status, label) => {
    try { await update('events', evt.id, { status }); toast(label); refresh(); } catch (err) { toast(err.message, 'bad'); }
  };

  const actions = can(P.EVENTS_MANAGE) && (
    <>
      {evt.status === 'draft' && <Button variant="primary" icon="CircleCheck" onClick={() => setConfirm('publish')}>Publish</Button>}
      {evt.status === 'on-sale' && <Button onClick={() => setStatus('sold-out', 'Marked sold out')}>Mark sold out</Button>}
      {['on-sale', 'sold-out'].includes(evt.status) && phase === 'completed' && <Button onClick={() => setStatus('past', 'Marked completed')}>Mark completed</Button>}
      {['on-sale', 'sold-out'].includes(evt.status) && <Button variant="ghost" onClick={() => setStatus('draft', 'Unpublished')}>Unpublish</Button>}
      {evt.status !== 'cancelled' && evt.status !== 'past' && <Button variant="danger" icon="Ban" onClick={() => setConfirm('cancel')}>Cancel event</Button>}
      {evt.status === 'draft' && <Button variant="ghost" icon="Trash2" aria-label="Delete event" onClick={() => setConfirm('delete')} />}
    </>
  );

  return (
    <Page
      back={{ to: '/admin-portal/events', label: 'Events' }}
      title={evt.name}
      subtitle={<span className="inline-flex flex-wrap items-center gap-2">{fmt.date(evt.event_date)}{evt.event_time ? ` · ${evt.event_time}` : ''} · {evt.venue || 'Venue TBC'} <Badge status={evt.status}>{EVENT_STATUS_LABELS[evt.status]}</Badge>{phase === 'live' && <Badge status="live">Today</Badge>}{health.data && <Badge tone={HEALTH[health.data.state]?.tone}>{HEALTH[health.data.state]?.label}</Badge>}<span className="font-mono text-[11px] text-[#E7D5A4]/40">{evt.timezone}</span></span>}
      actions={actions}
    >
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'overview' && <OverviewTab evt={evt} perf={perf.data} stats={stats.data} onTab={setTab} health={health.data} />}
      {tab === 'details' && (
        <Panel title="Event details">
          {can(P.EVENTS_MANAGE) ? <EventForm key={evt.updated_at} initial={evt} onSaved={() => { toast('Event saved'); refresh(); }} /> : <p className="text-[13px]">Read only.</p>}
        </Panel>
      )}
      {tab === 'artists' && <ArtistsTab evt={evt} />}
      {tab === 'venue' && <VenueTab evt={evt} />}
      {tab === 'sponsors' && (
        <div className="flex flex-col gap-4">
          <TeamManager eventId={evt.id} roles={['sponsor']} title="Event sponsors" />
          <SponsorsTab evt={evt} />
        </div>
      )}
      {tab === 'crew' && <TeamManager eventId={evt.id} roles={['crew', 'vendor']} title="Crew & vendors" />}
      {tab === 'volunteers' && (
        <div className="flex flex-col gap-3">
          {can(P.VOLUNTEERS) && <Button to={`/admin-portal/volunteers`} size="sm" icon="KeyRound" className="self-start">Manage check-in access</Button>}
          <TeamManager eventId={evt.id} roles={['volunteer']} title="Volunteers" />
        </div>
      )}
      {tab === 'team' && <TeamManager eventId={evt.id} roles={['staff']} title="Staff team" />}
      {tab === 'tickets' && <TicketsTab evt={evt} perf={perf.data} />}
      {tab === 'bookings' && <BookingsTable eventId={evt.id} />}
      {tab === 'attendees' && <AttendeesTable eventId={evt.id} />}
      {tab === 'checkin' && <CheckinTab evt={evt} stats={stats.data} />}
      {tab === 'announcements' && <AnnouncementsManager eventId={evt.id} />}
      {tab === 'tasks' && <TasksTable eventId={evt.id} initialStatus="" />}
      {tab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <Panel title="Public content">
            {can(P.EVENTS_MANAGE)
              ? <EventForm key={evt.updated_at} initial={evt} fields={['description', 'story', 'image_url', 'tags']} submitLabel="Save content" onSaved={() => { toast('Content saved'); refresh(); }} />
              : <p className="text-[13px] whitespace-pre-line">{evt.story}</p>}
          </Panel>
          <Panel title="Cover image">
            {evt.image_url ? <img src={evt.image_url} alt="" className="w-full rounded" /> : <p className="text-[13px] text-[#E7D5A4]/45">No cover image set.</p>}
          </Panel>
        </div>
      )}
      {tab === 'reports' && <ReportsTab evt={evt} perf={perf.data} />}
      {tab === 'schedule' && <ScheduleTab evt={evt} />}
      {tab === 'requirements' && <RequirementsTab evt={evt} />}
      {tab === 'documents' && <DocumentsTab evt={evt} />}
      {tab === 'messages' && <EventMessagesTab evt={evt} />}
      {tab === 'activity' && <ActivityTab evt={evt} />}

      {confirm === 'publish' && (
        <ConfirmDialog title="Publish event?" message="The event becomes visible on the website and checkout opens." confirmLabel="Publish & open sales" tone="success"
          onConfirm={async () => { await update('events', evt.id, { status: 'on-sale' }); toast('Event published'); refresh(); }} onClose={() => setConfirm(null)} />
      )}
      {confirm === 'cancel' && (
        <ConfirmDialog title="Cancel this event?" confirmLabel="Cancel event" tone="danger"
          message={`Checkout closes and the event shows as cancelled. Existing bookings are NOT refunded automatically — cancel/refund them from the Bookings tab (${fmt.num(perf.data?.tickets_sold ?? 0)} tickets sold).`}
          onConfirm={async () => { await update('events', evt.id, { status: 'cancelled' }); toast('Event cancelled'); refresh(); }} onClose={() => setConfirm(null)} />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog title="Delete draft event?" message="This permanently removes the draft. Events with bookings can't be deleted." confirmLabel="Delete" tone="danger"
          onConfirm={async () => { await remove('events', evt.id); toast('Event deleted'); navigate('/admin-portal/events'); }} onClose={() => setConfirm(null)} />
      )}
    </Page>
  );
}
