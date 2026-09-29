import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { rpc, friendlyError, insert, update, remove } from '../api';
import { useAsync } from '../hooks';
import { P } from '../rbac';
import {
  Panel, Badge, Button, AsyncBlock, Drawer, Field, Input, Select, Textarea, ConfirmDialog, Icon,
  DataTable, fmt, useToast, cx,
} from '../ui';
import { MessagesPanel } from '../../portal/MessagesPanel';
import { auditLabel } from '../auditLabels';
import { uploadWithProgress, openPrivateFile, removeFile, safeFileName, formatBytes } from '../../lib/storage';

// Event-level operations for the admin console: the command center and the
// partner-facing tabs (schedule & logistics, requirements, documents,
// messages, activity). All data is real; every write is re-checked by RLS.

const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v) => (v ? new Date(v).toISOString() : null);
const FEE_STATUSES = [['not_applicable', 'Not applicable'], ['pending', 'Pending'], ['invoiced', 'Invoiced'], ['paid', 'Paid']];
const KIND_LABEL = { artist: 'Artist', sponsor: 'Sponsor', vendor: 'Vendor', venue: 'Venue host', volunteer: 'Volunteer', crew: 'Crew', staff: 'Staff' };

// ---------------------------------------------------------------------------
// Command center
// ---------------------------------------------------------------------------

export const CommandCenter = ({ evt, onTab }) => {
  const cc = useAsync(() => rpc('event_command_center', { p_event_id: evt.id }), [evt.id]);
  const d = cc.data;
  const tile = (label, value, sub, tab, tone) => (
    <button key={label} onClick={() => onTab(tab)} className="text-left bg-[#17130F] border border-[#C99A2E]/20 hover:border-[#C99A2E]/60 rounded-md p-3.5 min-w-0 transition-colors">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#E7D5A4]/55">{label}</div>
      <div className={cx('mt-1.5 font-condensed text-[24px] leading-none tabular-nums', tone === 'warn' ? 'text-[#f5b544]' : 'text-[#EFE2C0]')}>{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-[#E7D5A4]/50 leading-snug">{sub}</div>}
    </button>
  );
  return (
    <Panel title="Event command center" subtitle="Live counts — select a tile to drill in">
      <AsyncBlock loading={cc.loading} error={cc.error} onRetry={cc.reload} rows={3}>
        {d && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5" data-command-center>
            {tile('Artists', d.artists, `${d.artists_confirmed} approved`, 'artists')}
            {tile('Sponsors', d.sponsors, null, 'sponsors')}
            {tile('Vendors', d.vendors, `${d.vendors_confirmed} confirmed`, 'crew')}
            {tile('Venue', d.venue?.name ? 'Set' : '—', d.venue?.name ? `${d.venue.name}${d.venue.host_linked ? ' · host linked' : ''}` : 'Not set', 'venue', d.venue?.name ? undefined : 'warn')}
            {tile('Staff', d.staff, `${d.crew} crew`, 'team')}
            {tile('Volunteers', d.volunteers, d.volunteer_access_active ? `${d.volunteer_access_active} with check-in now` : d.access_requests_pending ? `${d.access_requests_pending} access request(s)` : null, 'volunteers', d.access_requests_pending ? 'warn' : undefined)}
            {tile('Tickets', fmt.num(d.tickets_sold), `of ${fmt.num(d.capacity)} capacity`, 'tickets')}
            {tile('Check-in', `${fmt.num(d.checked_in)} / ${fmt.num(d.tickets_sold)}`, d.tickets_sold ? fmt.pct((100 * d.checked_in) / d.tickets_sold) : null, 'checkin')}
            {tile('Messages', d.messages_awaiting_reply, 'awaiting reply', 'messages', d.messages_awaiting_reply ? 'warn' : undefined)}
            {tile('Tasks', d.tasks_pending, 'pending', 'tasks', d.tasks_pending ? 'warn' : undefined)}
            {tile('Requirements', d.requirements_open + d.requirements_to_review, d.requirements_to_review ? `${d.requirements_to_review} to review` : `${d.requirements_open} open`, 'requirements', d.requirements_to_review ? 'warn' : undefined)}
            {tile('Announcements', d.announcements_active, `${d.documents} document${d.documents === 1 ? '' : 's'}`, 'announcements')}
          </div>
        )}
      </AsyncBlock>
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Members of an event (for requirements/documents targeting)
// ---------------------------------------------------------------------------

function useEventMembers(evt) {
  return useAsync(async () => {
    const [asg, art, venue] = await Promise.all([
      supabase.from('event_assignments').select('id, assignee_id, assignee_role, title, status, call_time, starts_at, ends_at, instructions, fee_amount, fee_status, setup_at, breakdown_at, loading_access, venue_access, onsite_contact, team, package, profiles(full_name, email)')
        .eq('event_id', evt.id).neq('status', 'declined').order('assignee_role'),
      supabase.from('event_artists').select('artist_id, artists(id, name, user_id, status), event_artist_details(*)').eq('event_id', evt.id),
      evt.venue_partner_id ? supabase.from('profiles').select('id, full_name, email').eq('id', evt.venue_partner_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    for (const r of [asg, art]) if (r.error) throw friendlyError(r.error);
    const members = [
      ...(art.data || []).filter((a) => a.artists?.user_id).map((a) => ({ user_id: a.artists.user_id, name: a.artists.name, kind: 'artist' })),
      ...(asg.data || []).map((a) => ({ user_id: a.assignee_id, name: a.profiles?.full_name || a.profiles?.email, kind: a.assignee_role })),
      ...(venue.data ? [{ user_id: venue.data.id, name: venue.data.full_name || venue.data.email, kind: 'venue' }] : []),
    ];
    const unique = [...new Map(members.map((m) => [`${m.user_id}`, m])).values()];
    return { members: unique, assignments: asg.data || [], artists: art.data || [] };
  }, [evt.id, evt.venue_partner_id]);
}

// ---------------------------------------------------------------------------
// Schedule & logistics
// ---------------------------------------------------------------------------

export const ScheduleTab = ({ evt }) => {
  const { can } = useAdminSession();
  const data = useEventMembers(evt);
  const [editArtist, setEditArtist] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);
  const canEdit = can(P.EVENTS_MANAGE);
  const artists = data.data?.artists || [];
  const team = (data.data?.assignments || []).filter((a) => a.assignee_role !== 'staff');
  const detail = (a) => (Array.isArray(a.event_artist_details) ? a.event_artist_details[0] : a.event_artist_details) || {};

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Artist schedule & logistics" subtitle="Visible only to each artist in their portal" flush>
        <AsyncBlock loading={data.loading} error={data.error} onRetry={data.reload} empty={!artists.length}
          emptyProps={{ title: 'No artists on the lineup', hint: 'Add artists in the Artists tab first.', icon: 'Mic' }}>
          <DataTable rowKey="artist_id" rows={artists} columns={[
            { key: 'name', header: 'Artist', render: (a) => <span className="text-[#EFE2C0]">{a.artists?.name}</span> },
            { key: 'call', header: 'Call', render: (a) => fmt.time(detail(a).call_time) },
            { key: 'sc', header: 'Soundcheck', render: (a) => fmt.time(detail(a).soundcheck_at) },
            { key: 'perf', header: 'Performance', render: (a) => (detail(a).performance_start ? `${fmt.time(detail(a).performance_start)} – ${fmt.time(detail(a).performance_end)}` : '—') },
            { key: 'fee', header: 'Fee', render: (a) => (detail(a).fee_status && detail(a).fee_status !== 'not_applicable' ? <span>{fmt.money(detail(a).fee_amount)} <Badge status={detail(a).fee_status === 'paid' ? 'done' : 'pending'}>{detail(a).fee_status}</Badge></span> : '—') },
            { key: 'edit', header: '', render: (a) => canEdit && <Button size="sm" variant="ghost" icon="Pencil" onClick={() => setEditArtist(a)}>Edit</Button> },
          ]} />
        </AsyncBlock>
      </Panel>
      <Panel title="Partner & volunteer timings" subtitle="Call times, windows and instructions each person sees in their portal" flush>
        <AsyncBlock loading={data.loading} error={data.error} onRetry={data.reload} empty={!team.length}
          emptyProps={{ title: 'No partners assigned', hint: 'Assign sponsors, vendors, crew or volunteers from their tabs.', icon: 'Users' }}>
          <DataTable rowKey="id" rows={team} columns={[
            { key: 'who', header: 'Person', render: (a) => <div><div className="text-[#EFE2C0]">{a.profiles?.full_name || a.profiles?.email}</div><div className="text-[11.5px] text-[#E7D5A4]/50">{KIND_LABEL[a.assignee_role]} · {a.title}</div></div> },
            { key: 'status', header: 'Status', render: (a) => <Badge status={a.status} /> },
            { key: 'call', header: 'Call', render: (a) => fmt.time(a.call_time) },
            { key: 'window', header: 'Window', render: (a) => (a.starts_at ? `${fmt.time(a.starts_at)} – ${fmt.time(a.ends_at)}` : '—') },
            { key: 'instr', header: 'Instructions', render: (a) => <span className="text-[12px] text-[#E7D5A4]/60 line-clamp-1">{a.instructions || '—'}</span> },
            { key: 'edit', header: '', render: (a) => canEdit && <Button size="sm" variant="ghost" icon="Pencil" onClick={() => setEditAssignment(a)}>Edit</Button> },
          ]} />
        </AsyncBlock>
      </Panel>
      {editArtist && <ArtistLogisticsDrawer evt={evt} row={editArtist} detail={detail(editArtist)} onClose={() => setEditArtist(null)} onSaved={() => { setEditArtist(null); data.reload(); }} />}
      {editAssignment && <AssignmentLogisticsDrawer row={editAssignment} onClose={() => setEditAssignment(null)} onSaved={() => { setEditAssignment(null); data.reload(); }} />}
    </div>
  );
};

const ArtistLogisticsDrawer = ({ evt, row, detail, onClose, onSaved }) => {
  const toast = useToast();
  const [f, setF] = useState({
    call_time: toLocal(detail.call_time), soundcheck_at: toLocal(detail.soundcheck_at),
    performance_start: toLocal(detail.performance_start), performance_end: toLocal(detail.performance_end),
    wrap_at: toLocal(detail.wrap_at),
    instructions: detail.instructions || '', hospitality: detail.hospitality || '', travel: detail.travel || '',
    accommodation: detail.accommodation || '', meals: detail.meals || '', green_room: detail.green_room || '', rider_notes: detail.rider_notes || '',
    pickup: detail.pickup || '', dropoff: detail.dropoff || '', hotel: detail.hotel || '', transport_notes: detail.transport_notes || '',
    fee_amount: detail.fee_amount ?? '', fee_status: detail.fee_status || 'not_applicable',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    const payload = {
      event_id: evt.id, artist_id: row.artist_id,
      call_time: fromLocal(f.call_time), soundcheck_at: fromLocal(f.soundcheck_at),
      performance_start: fromLocal(f.performance_start), performance_end: fromLocal(f.performance_end), wrap_at: fromLocal(f.wrap_at),
      instructions: f.instructions.trim() || null, hospitality: f.hospitality.trim() || null, travel: f.travel.trim() || null,
      ...Object.fromEntries(['accommodation', 'meals', 'green_room', 'rider_notes', 'pickup', 'dropoff', 'hotel', 'transport_notes'].map((k) => [k, f[k].trim() || null])),
      fee_amount: f.fee_amount === '' ? null : Number(f.fee_amount), fee_status: f.fee_status,
    };
    const { error } = await supabase.from('event_artist_details').upsert(payload, { onConflict: 'event_id,artist_id' });
    setBusy(false);
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    toast('Artist logistics saved');
    onSaved();
  };
  return (
    <Drawer title={row.artists?.name} subtitle="Schedule & logistics (private to this artist)" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Call time"><Input type="datetime-local" value={f.call_time} onChange={set('call_time')} /></Field>
        <Field label="Soundcheck"><Input type="datetime-local" value={f.soundcheck_at} onChange={set('soundcheck_at')} /></Field>
        <Field label="Performance starts"><Input type="datetime-local" value={f.performance_start} onChange={set('performance_start')} /></Field>
        <Field label="Performance ends"><Input type="datetime-local" value={f.performance_end} onChange={set('performance_end')} /></Field>
        <Field label="Wrap"><Input type="datetime-local" value={f.wrap_at} onChange={set('wrap_at')} /></Field>
      </div>
      <Field label="Performance notes / requirements"><Textarea rows={3} value={f.instructions} onChange={set('instructions')} /></Field>
      <h3 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E] m-0">Hospitality</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Accommodation"><Textarea rows={2} value={f.accommodation} onChange={set('accommodation')} /></Field>
        <Field label="Meals"><Textarea rows={2} value={f.meals} onChange={set('meals')} /></Field>
        <Field label="Green room"><Textarea rows={2} value={f.green_room} onChange={set('green_room')} /></Field>
        <Field label="Rider notes"><Textarea rows={2} value={f.rider_notes} onChange={set('rider_notes')} /></Field>
      </div>
      <Field label="Other hospitality notes"><Textarea rows={2} value={f.hospitality} onChange={set('hospitality')} /></Field>
      <h3 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E] m-0">Travel</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Pickup"><Input value={f.pickup} onChange={set('pickup')} placeholder="e.g. RGIA arrivals, 2:10 PM" /></Field>
        <Field label="Drop"><Input value={f.dropoff} onChange={set('dropoff')} /></Field>
        <Field label="Hotel"><Input value={f.hotel} onChange={set('hotel')} /></Field>
        <Field label="Transport notes"><Input value={f.transport_notes} onChange={set('transport_notes')} /></Field>
      </div>
      <Field label="Other travel notes"><Textarea rows={2} value={f.travel} onChange={set('travel')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fee (₹)"><Input type="number" min="0" value={f.fee_amount} onChange={set('fee_amount')} /></Field>
        <Field label="Fee status"><Select value={f.fee_status} onChange={set('fee_status')}>{FEE_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      </div>
    </Drawer>
  );
};

const AssignmentLogisticsDrawer = ({ row, onClose, onSaved }) => {
  const toast = useToast();
  const [f, setF] = useState({
    call_time: toLocal(row.call_time), starts_at: toLocal(row.starts_at), ends_at: toLocal(row.ends_at),
    setup_at: toLocal(row.setup_at), breakdown_at: toLocal(row.breakdown_at),
    loading_access: row.loading_access || '', venue_access: row.venue_access || '', onsite_contact: row.onsite_contact || '',
    team: row.team || '', package: row.package || '',
    instructions: row.instructions || '', fee_amount: row.fee_amount ?? '', fee_status: row.fee_status || 'not_applicable',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try {
      await update('event_assignments', row.id, {
        call_time: fromLocal(f.call_time), starts_at: fromLocal(f.starts_at), ends_at: fromLocal(f.ends_at),
        setup_at: fromLocal(f.setup_at), breakdown_at: fromLocal(f.breakdown_at),
        loading_access: f.loading_access.trim() || null, venue_access: f.venue_access.trim() || null, onsite_contact: f.onsite_contact.trim() || null,
        team: f.team || null, package: f.package.trim() || null,
        instructions: f.instructions.trim() || null, fee_amount: f.fee_amount === '' ? null : Number(f.fee_amount), fee_status: f.fee_status,
      });
      toast('Timings saved');
      onSaved();
    } catch (err) { toast(err.message, 'bad'); setBusy(false); }
  };
  return (
    <Drawer title={row.profiles?.full_name || row.profiles?.email} subtitle={`${KIND_LABEL[row.assignee_role]} · ${row.title}`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <Field label="Call time"><Input type="datetime-local" value={f.call_time} onChange={set('call_time')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts"><Input type="datetime-local" value={f.starts_at} onChange={set('starts_at')} /></Field>
        <Field label="Ends"><Input type="datetime-local" value={f.ends_at} onChange={set('ends_at')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Setup"><Input type="datetime-local" value={f.setup_at} onChange={set('setup_at')} /></Field>
        <Field label="Breakdown"><Input type="datetime-local" value={f.breakdown_at} onChange={set('breakdown_at')} /></Field>
      </div>
      <Field label="Operational instructions"><Textarea rows={4} value={f.instructions} onChange={set('instructions')} placeholder="e.g. Loading bay opens 2 PM, use gate 3" /></Field>
      <Field label="Loading access"><Input value={f.loading_access} onChange={set('loading_access')} placeholder="Where and when to load in" /></Field>
      <Field label="Venue access"><Input value={f.venue_access} onChange={set('venue_access')} placeholder="Entry gate, passes, parking" /></Field>
      <Field label="On-site contact"><Input value={f.onsite_contact} onChange={set('onsite_contact')} placeholder="Name · phone" /></Field>
      {row.assignee_role === 'volunteer' && (
        <Field label="Volunteer team" hint="Team announcements reach only this team">
          <Select value={f.team} onChange={set('team')}>
            <option value="">No team</option>
            {['gate', 'hospitality', 'stage', 'registration', 'production', 'runners', 'other'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </Field>
      )}
      {row.assignee_role === 'sponsor' && <Field label="Sponsorship package"><Input value={f.package} onChange={set('package')} placeholder="e.g. Title partner" /></Field>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fee / invoice (₹)"><Input type="number" min="0" value={f.fee_amount} onChange={set('fee_amount')} /></Field>
        <Field label="Status"><Select value={f.fee_status} onChange={set('fee_status')}>{FEE_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      </div>
    </Drawer>
  );
};

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

const REQ_TONE = { requested: 'warn', changes_requested: 'bad', submitted: 'info', accepted: 'good', closed: 'muted' };
const REQ_LABEL = { requested: 'Requested', changes_requested: 'Changes requested', submitted: 'Submitted', accepted: 'Accepted', closed: 'Closed' };
const PRIORITIES = [['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['urgent', 'Urgent']];
const PRIORITY_TONE = { low: 'muted', normal: 'info', high: 'warn', urgent: 'bad' };

export const RequirementsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const members = useEventMembers(evt);
  const [form, setForm] = useState({ user_id: '', title: '', details: '', due: '', priority: 'normal' });
  const [reviewing, setReviewing] = useState(null);
  const [status, setStatus] = useState('open');
  const reqs = useAsync(async () => {
    let q = supabase.from('event_requirements')
      .select('*, profiles!event_requirements_user_id_fkey(full_name, email, role)').eq('event_id', evt.id).order('created_at', { ascending: false });
    if (status === 'open') q = q.in('status', ['requested', 'changes_requested', 'submitted']);
    const { data, error } = await q;
    if (error) throw friendlyError(error);
    return data || [];
  }, [evt.id, status]);
  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('event_requirements', { event_id: evt.id, user_id: form.user_id, title: form.title.trim(), details: form.details.trim() || null, due_at: fromLocal(form.due), priority: form.priority });
      setForm({ user_id: '', title: '', details: '', due: '', priority: 'normal' });
      toast('Requirement sent');
      reqs.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const act = async (fn, msg) => { try { await fn(); toast(msg); reqs.reload(); } catch (err) { toast(err.message, 'bad'); } };
  const now = Date.now();
  return (
    <Panel title="Requirements" subtitle="What Tangy needs from artists and partners for this event" flush
      actions={<Select aria-label="Requirement filter" value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-auto text-[12px]"><option value="open">Open</option><option value="all">All</option></Select>}>
      {can(P.EVENTS_MANAGE) && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto_auto_auto] gap-2 items-end">
          <Field label="From"><Select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} aria-label="Requirement recipient">
            <option value="">{(members.data?.members || []).length ? 'Select person…' : 'No partners on this event'}</option>
            {(members.data?.members || []).filter((m) => m.kind !== 'staff').map((m) => <option key={m.user_id} value={m.user_id}>{m.name} · {KIND_LABEL[m.kind]}</option>)}
          </Select></Field>
          <Field label="What's needed"><Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tech rider, GST invoice, logo files" /></Field>
          <Field label="Priority"><Select aria-label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <Field label="Due"><Input type="datetime-local" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
          <Button type="submit" variant="primary" disabled={!form.user_id || !form.title.trim()}>Request</Button>
          <div className="md:col-span-5"><Textarea rows={2} aria-label="Details" value={form.details} maxLength={4000} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Details (optional)" /></div>
        </form>
      )}
      <AsyncBlock loading={reqs.loading} error={reqs.error} onRetry={reqs.reload} empty={!(reqs.data || []).length}
        emptyProps={{ title: status === 'open' ? 'No open requirements' : 'No requirements yet', icon: 'ClipboardList' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(reqs.data || []).map((r) => {
            const overdue = r.due_at && new Date(r.due_at).getTime() < now && ['requested', 'changes_requested'].includes(r.status);
            return (
              <li key={r.id} className="px-4 py-3 flex flex-col gap-1.5" data-requirement={r.title}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] text-[#EFE2C0]">{r.title}</span>
                  <Badge tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status]}</Badge>
                  {r.priority !== 'normal' && <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge>}
                  {overdue && <Badge tone="bad">Overdue</Badge>}
                  <span className="text-[12px] text-[#E7D5A4]/50">· {r.profiles?.full_name || r.profiles?.email}{r.due_at ? ` · due ${fmt.dateTime(r.due_at)}` : ''}</span>
                  {can(P.EVENTS_MANAGE) && (
                    <span className="ml-auto flex gap-1.5">
                      {r.status === 'submitted' && <Button size="sm" variant="success" onClick={() => act(() => rpc('review_requirement', { p_id: r.id, p_accept: true }), 'Accepted')}>Accept</Button>}
                      {r.status === 'submitted' && <Button size="sm" variant="ghost" onClick={() => setReviewing(r)}>Request changes</Button>}
                      {r.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => act(() => rpc('close_requirement', { p_id: r.id }), 'Closed')}>Close</Button>}
                    </span>
                  )}
                </div>
                {r.details && <p className="text-[12.5px] text-[#E7D5A4]/60 whitespace-pre-line">{r.details}</p>}
                {r.response && <p className="text-[12.5px] text-[#E7D5A4]/80 border-l-2 border-[#C99A2E]/30 pl-3 whitespace-pre-line">{r.response}</p>}
                {r.attachment_path && (
                  <button onClick={() => openPrivateFile('event-documents', r.attachment_path).catch((err) => toast(err.message, 'bad'))}
                    className="self-start inline-flex items-center gap-1.5 text-[12.5px] text-[#e4bd5c] underline underline-offset-2">
                    <Icon name="FileText" size={14} />{r.attachment_path.split('/').pop()}
                  </button>
                )}
                {r.review_note && <p className="text-[12px] text-[#f5b544]">Note: {r.review_note}</p>}
              </li>
            );
          })}
        </ul>
      </AsyncBlock>
      {reviewing && (
        <ConfirmDialog title="Request changes" confirmLabel="Send back" message={reviewing.title}
          fields={[{ name: 'note', label: 'What needs to change', required: true, multiline: true }]}
          onConfirm={async ({ note }) => { await rpc('review_requirement', { p_id: reviewing.id, p_accept: false, p_note: note }); toast('Sent back'); reqs.reload(); }}
          onClose={() => setReviewing(null)} />
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Documents — private files (signed URLs) or https links
// ---------------------------------------------------------------------------

const AUDIENCES = [['members', 'Everyone on this event'], ['artist', 'Artists'], ['sponsor', 'Sponsors'], ['vendor', 'Vendors'], ['venue', 'Venue host'], ['volunteer', 'Volunteers'], ['crew', 'Crew'], ['staff', 'Staff'], ['user', 'One person']];
export const DOC_CATEGORIES = [['tech_rider', 'Tech rider'], ['contract', 'Contract'], ['event_brief', 'Event brief'], ['travel', 'Travel'], ['hospitality', 'Hospitality'], ['venue', 'Venue'], ['schedule', 'Schedule'], ['other', 'Other']];
const DOC_LABEL = Object.fromEntries(DOC_CATEGORIES);

export const DocumentsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const members = useEventMembers(evt);
  const blank = { title: '', description: '', category: 'other', url: '', audience: 'members', user_id: '', expires: '', mode: 'file', file: null };
  const [form, setForm] = useState(blank);
  const [progress, setProgress] = useState(null);
  const [removing, setRemoving] = useState(null);
  const docs = useAsync(async () => {
    const { data, error } = await supabase.from('event_documents').select('*, profiles!event_documents_user_id_fkey(full_name, email)').eq('event_id', evt.id).order('created_at', { ascending: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, [evt.id]);
  const validUrl = /^https:\/\/\S+$/i.test(form.url.trim());
  const ready = form.title.trim() && (form.mode === 'file' ? !!form.file : validUrl) && (form.audience !== 'user' || form.user_id);
  const add = async (e) => {
    e.preventDefault();
    let path = null;
    try {
      if (form.mode === 'file') {
        path = `events/${evt.id}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(form.file.name)}`;
        setProgress(0);
        await uploadWithProgress('event-documents', path, form.file, { onProgress: setProgress });
      }
      await insert('event_documents', {
        event_id: evt.id, title: form.title.trim(), description: form.description.trim() || null, category: form.category,
        url: form.mode === 'link' ? form.url.trim() : null, storage_path: path, file_name: form.file?.name || null, file_size_bytes: form.file?.size || null,
        audience: form.audience, user_id: form.audience === 'user' ? form.user_id : null,
        expires_at: form.expires ? new Date(`${form.expires}T23:59:00`).toISOString() : null,
      });
      setForm(blank);
      toast('Document shared');
      docs.reload();
    } catch (err) {
      if (path) removeFile('event-documents', path).catch(() => {});
      toast(err.message, 'bad');
    } finally { setProgress(null); }
  };
  const open = (d) => (d.storage_path ? openPrivateFile('event-documents', d.storage_path).catch((err) => toast(err.message, 'bad')) : window.open(d.url, '_blank', 'noopener,noreferrer'));
  return (
    <Panel title="Documents" subtitle="Private files are served only through short-lived signed links to the people they are shared with." flush>
      {can(P.EVENTS_MANAGE) && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <Field label="Title"><Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Stage plot" /></Field>
            <Field label="Category"><Select aria-label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{DOC_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="Shared with"><Select aria-label="Shared with" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="Expires" hint="Optional"><Input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></Field>
          </div>
          {form.audience === 'user' && (
            <Select aria-label="Person" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="">Select person…</option>
              {(members.data?.members || []).map((m) => <option key={m.user_id} value={m.user_id}>{m.name} · {KIND_LABEL[m.kind]}</option>)}
            </Select>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
            <label className="flex items-center gap-1.5"><input type="radio" name="docmode" checked={form.mode === 'file'} onChange={() => setForm({ ...form, mode: 'file' })} className="accent-[#C99A2E]" />Upload file</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="docmode" checked={form.mode === 'link'} onChange={() => setForm({ ...form, mode: 'link' })} className="accent-[#C99A2E]" />Link (https)</label>
          </div>
          {form.mode === 'file'
            ? <input type="file" aria-label="Document file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="text-[12.5px] text-[#E7D5A4]/70 file:mr-3 file:h-8 file:px-3 file:rounded file:border file:border-[#C99A2E]/40 file:bg-transparent file:text-[#E7D5A4]" />
            : <Field label="Link" error={form.url && !validUrl ? 'Use an https:// link' : undefined}><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>}
          <Textarea rows={2} aria-label="Description" value={form.description} maxLength={1000} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" />
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" icon="Link2" disabled={!ready || progress != null}>{progress != null ? `Uploading ${progress}%` : 'Share document'}</Button>
            {form.file && <span className="text-[12px] text-[#E7D5A4]/50">{form.file.name} · {formatBytes(form.file.size)}</span>}
          </div>
        </form>
      )}
      <AsyncBlock loading={docs.loading} error={docs.error} onRetry={docs.reload} empty={!(docs.data || []).length} emptyProps={{ title: 'No documents shared', icon: 'FileText' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(docs.data || []).map((d) => {
            const expired = d.expires_at && new Date(d.expires_at).getTime() < Date.now();
            return (
              <li key={d.id} className={cx('px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]', expired && 'opacity-60')}>
                <Icon name="FileText" size={16} className="text-[#C99A2E]" />
                <button onClick={() => open(d)} className="flex-1 min-w-[160px] text-left truncate text-[#EFE2C0] hover:underline">{d.title}
                  <span className="block text-[11.5px] text-[#E7D5A4]/45">{[DOC_LABEL[d.category], d.storage_path ? formatBytes(d.file_size_bytes) : 'Link', d.expires_at && `${expired ? 'expired' : 'expires'} ${fmt.date(d.expires_at)}`].filter(Boolean).join(' · ')}</span>
                </button>
                <Badge tone="muted">{d.audience === 'user' ? (d.profiles?.full_name || d.profiles?.email) : AUDIENCES.find(([v]) => v === d.audience)?.[1]}</Badge>
                {can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Remove ${d.title}`} onClick={() => setRemoving(d)} />}
              </li>
            );
          })}
        </ul>
      </AsyncBlock>
      {removing && <ConfirmDialog title="Remove document" tone="danger" confirmLabel="Remove" message={removing.title}
        onConfirm={async () => { await remove('event_documents', removing.id); if (removing.storage_path) await removeFile('event-documents', removing.storage_path).catch(() => {}); toast('Removed'); docs.reload(); }} onClose={() => setRemoving(null)} />}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Messages / activity
// ---------------------------------------------------------------------------

export const EventMessagesTab = ({ evt }) => {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  if (!can(P.MESSAGES)) return <Panel><p className="text-[13px] text-[#E7D5A4]/60">You don't have access to partner messages.</p></Panel>;
  return (
    <MessagesPanel mode="admin" eventFilter={evt.id} selectedId={params.get('c')}
      onSelect={(id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('c', id); else n.delete('c'); return n; }, { replace: true })} />
  );
};

export const ActivityTab = ({ evt }) => {
  const logs = useAsync(async () => {
    const { data, error } = await supabase.from('audit_logs').select('id, created_at, actor_email, actor_role, action, resource_type, metadata')
      .eq('event_id', evt.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw friendlyError(error);
    return data || [];
  }, [evt.id]);
  return (
    <Panel title="Activity" subtitle="Audit trail for this event (latest 100)" flush>
      <AsyncBlock loading={logs.loading} error={logs.error} onRetry={logs.reload} empty={!(logs.data || []).length} emptyProps={{ title: 'No activity recorded', icon: 'Activity' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(logs.data || []).map((l) => (
            <li key={l.id} className="px-4 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px]">
              <span className="font-mono text-[11px] text-[#E7D5A4]/40 w-28 shrink-0">{fmt.dateTime(l.created_at)}</span>
              <span className="text-[#EFE2C0]">{l.actor_email || (l.actor_role === 'system' ? 'System' : '—')}</span>
              <span className="text-[#E7D5A4]/70">{auditLabel(l.action)}</span>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};
