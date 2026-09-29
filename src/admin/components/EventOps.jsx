import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { rpc, friendlyError, insert, update, remove } from '../api';
import { useAsync } from '../hooks';
import { P } from '../rbac';
import {
  Panel, Grid, StatTile, Badge, Button, AsyncBlock, Drawer, Field, Input, Select, Textarea, ConfirmDialog, Icon,
  DataTable, fmt, useToast, cx,
} from '../ui';
import { MessagesPanel } from '../../portal/MessagesPanel';
import { auditLabel } from '../auditLabels';

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
      supabase.from('event_assignments').select('id, assignee_id, assignee_role, title, status, call_time, starts_at, ends_at, instructions, fee_amount, fee_status, profiles(full_name, email)')
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
    instructions: detail.instructions || '', hospitality: detail.hospitality || '', travel: detail.travel || '',
    fee_amount: detail.fee_amount ?? '', fee_status: detail.fee_status || 'not_applicable',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    const payload = {
      event_id: evt.id, artist_id: row.artist_id,
      call_time: fromLocal(f.call_time), soundcheck_at: fromLocal(f.soundcheck_at),
      performance_start: fromLocal(f.performance_start), performance_end: fromLocal(f.performance_end),
      instructions: f.instructions.trim() || null, hospitality: f.hospitality.trim() || null, travel: f.travel.trim() || null,
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
      </div>
      <Field label="Performance notes / requirements"><Textarea rows={3} value={f.instructions} onChange={set('instructions')} /></Field>
      <Field label="Hospitality"><Textarea rows={2} value={f.hospitality} onChange={set('hospitality')} /></Field>
      <Field label="Travel & logistics"><Textarea rows={2} value={f.travel} onChange={set('travel')} /></Field>
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
    instructions: row.instructions || '', fee_amount: row.fee_amount ?? '', fee_status: row.fee_status || 'not_applicable',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try {
      await update('event_assignments', row.id, {
        call_time: fromLocal(f.call_time), starts_at: fromLocal(f.starts_at), ends_at: fromLocal(f.ends_at),
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
      <Field label="Operational instructions"><Textarea rows={4} value={f.instructions} onChange={set('instructions')} placeholder="e.g. Loading bay opens 2 PM, use gate 3" /></Field>
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

const REQ_TONE = { requested: 'warn', changes_requested: 'bad', submitted: 'info', accepted: 'good' };

export const RequirementsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const members = useEventMembers(evt);
  const [form, setForm] = useState({ user_id: '', title: '', details: '', due: '' });
  const [reviewing, setReviewing] = useState(null);
  const reqs = useAsync(async () => {
    const { data, error } = await supabase.from('event_requirements')
      .select('*, profiles!event_requirements_user_id_fkey(full_name, email, role)').eq('event_id', evt.id).order('created_at', { ascending: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, [evt.id]);
  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('event_requirements', { event_id: evt.id, user_id: form.user_id, title: form.title.trim(), details: form.details.trim() || null, due_at: fromLocal(form.due) });
      setForm({ user_id: '', title: '', details: '', due: '' });
      toast('Requirement sent');
      reqs.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };
  return (
    <Panel title="Requirements" subtitle="What Tangy needs from artists and partners for this event" flush>
      {can(P.EVENTS_MANAGE) && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-end">
          <Field label="From"><Select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} aria-label="Requirement recipient">
            <option value="">{(members.data?.members || []).length ? 'Select person…' : 'No partners on this event'}</option>
            {(members.data?.members || []).filter((m) => m.kind !== 'staff').map((m) => <option key={m.user_id} value={m.user_id}>{m.name} · {KIND_LABEL[m.kind]}</option>)}
          </Select></Field>
          <Field label="What's needed"><Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tech rider, GST invoice, logo files" /></Field>
          <Field label="Due"><Input type="datetime-local" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
          <Button type="submit" variant="primary" disabled={!form.user_id || !form.title.trim()}>Request</Button>
          <div className="md:col-span-4"><Textarea rows={2} aria-label="Details" value={form.details} maxLength={4000} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Details (optional)" /></div>
        </form>
      )}
      <AsyncBlock loading={reqs.loading} error={reqs.error} onRetry={reqs.reload} empty={!(reqs.data || []).length}
        emptyProps={{ title: 'No requirements yet', icon: 'ClipboardList' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(reqs.data || []).map((r) => (
            <li key={r.id} className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] text-[#EFE2C0]">{r.title}</span>
                <Badge tone={REQ_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
                <span className="text-[12px] text-[#E7D5A4]/50">· {r.profiles?.full_name || r.profiles?.email}{r.due_at ? ` · due ${fmt.dateTime(r.due_at)}` : ''}</span>
                {r.status === 'submitted' && can(P.EVENTS_MANAGE) && (
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" variant="success" onClick={async () => { try { await rpc('review_requirement', { p_id: r.id, p_accept: true }); toast('Accepted'); reqs.reload(); } catch (err) { toast(err.message, 'bad'); } }}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => setReviewing(r)}>Request changes</Button>
                  </span>
                )}
              </div>
              {r.response && <p className="text-[12.5px] text-[#E7D5A4]/70 border-l-2 border-[#C99A2E]/30 pl-3 whitespace-pre-line">{r.response}</p>}
              {r.review_note && <p className="text-[12px] text-[#f5b544]">Note: {r.review_note}</p>}
            </li>
          ))}
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
// Documents
// ---------------------------------------------------------------------------

const AUDIENCES = [['members', 'Everyone on this event'], ['artist', 'Artists'], ['sponsor', 'Sponsors'], ['vendor', 'Vendors'], ['venue', 'Venue host'], ['volunteer', 'Volunteers'], ['crew', 'Crew'], ['staff', 'Staff'], ['user', 'One person']];

export const DocumentsTab = ({ evt }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const members = useEventMembers(evt);
  const [form, setForm] = useState({ title: '', url: '', audience: 'members', user_id: '' });
  const [removing, setRemoving] = useState(null);
  const docs = useAsync(async () => {
    const { data, error } = await supabase.from('event_documents').select('*, profiles!event_documents_user_id_fkey(full_name, email)').eq('event_id', evt.id).order('created_at', { ascending: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, [evt.id]);
  const validUrl = /^https:\/\/\S+$/i.test(form.url.trim());
  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('event_documents', { event_id: evt.id, title: form.title.trim(), url: form.url.trim(), audience: form.audience, user_id: form.audience === 'user' ? form.user_id : null });
      setForm({ title: '', url: '', audience: 'members', user_id: '' });
      toast('Document shared');
      docs.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };
  return (
    <Panel title="Documents" subtitle="Links shared with this event's partners (https only). File uploads are not connected yet." flush>
      {can(P.EVENTS_MANAGE) && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr_auto] gap-2 items-end">
          <Field label="Title"><Input value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Stage plot" /></Field>
          <Field label="Link" error={form.url && !validUrl ? 'Use an https:// link' : undefined}><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Shared with"><Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <Button type="submit" variant="primary" disabled={!form.title.trim() || !validUrl || (form.audience === 'user' && !form.user_id)}>Share</Button>
          {form.audience === 'user' && (
            <div className="md:col-span-4"><Select aria-label="Person" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="">Select person…</option>
              {(members.data?.members || []).map((m) => <option key={m.user_id} value={m.user_id}>{m.name} · {KIND_LABEL[m.kind]}</option>)}
            </Select></div>
          )}
        </form>
      )}
      <AsyncBlock loading={docs.loading} error={docs.error} onRetry={docs.reload} empty={!(docs.data || []).length} emptyProps={{ title: 'No documents shared', icon: 'FileText' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(docs.data || []).map((d) => (
            <li key={d.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
              <Icon name="FileText" size={16} className="text-[#C99A2E]" />
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-[#EFE2C0] hover:underline">{d.title}</a>
              <Badge tone="muted">{d.audience === 'user' ? (d.profiles?.full_name || d.profiles?.email) : AUDIENCES.find(([v]) => v === d.audience)?.[1]}</Badge>
              {can(P.EVENTS_MANAGE) && <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Remove ${d.title}`} onClick={() => setRemoving(d)} />}
            </li>
          ))}
        </ul>
      </AsyncBlock>
      {removing && <ConfirmDialog title="Remove document" tone="danger" confirmLabel="Remove" message={removing.title}
        onConfirm={async () => { await remove('event_documents', removing.id); toast('Removed'); docs.reload(); }} onClose={() => setRemoving(null)} />}
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
