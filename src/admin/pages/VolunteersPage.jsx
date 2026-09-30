import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Page, Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Modal, Field, Select, Textarea, ConfirmDialog, Drawer, EmptyState, ErrorState, Skeleton, Icon, useToast, fmt,
} from '../ui';
import { useDebounced, useAsync } from '../hooks';
import { rpc, friendlyError } from '../api';
import { useAdminSession } from '../AdminSession';
import { P, localISODate } from '../rbac';

// Volunteers are not console users. The event team puts them on events and,
// when needed, grants QR check-in for ONE event for a fixed window. Expiry is
// enforced by the database on every scan; nothing here needs to "turn it off".
const DURATIONS = [
  { value: 30, label: '30 minutes' }, { value: 60, label: '1 hour' }, { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' }, { value: 240, label: '4 hours' }, { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' }, { value: 720, label: '12 hours' },
];
const PAGE = 25;

function useGrantableEvents() {
  return useAsync(async () => {
    const { data, error } = await supabase.from('events').select('id, name, event_date, status')
      .not('status', 'in', '(draft,cancelled)').gte('event_date', localISODate(new Date(Date.now() - 86400000)))
      .order('event_date').limit(100);
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
}

export default function VolunteersPage() {
  const { can } = useAdminSession();
  const toast = useToast();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 300);
  const [eventId, setEventId] = useState('');
  const [access, setAccess] = useState(params.get('requests') ? 'pending' : '');
  const [page, setPage] = useState(0);
  const events = useGrantableEvents();
  const [grantFor, setGrantFor] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { setPage(0); }, [q, eventId, access]);
  const table = useAsync(() => rpc('volunteers_overview', {
    p_search: q.trim() || null, p_event_id: eventId || null, p_access: access || null, p_limit: PAGE, p_offset: page * PAGE,
  }), [q, eventId, access, page]);
  const rows = table.data || [];
  const count = rows[0]?.total_count ?? 0;
  const canGrant = can(P.ACCESS_GRANT);

  const columns = [
    { key: 'name', header: 'Volunteer', render: (r) => (
      <div className="min-w-0">
        <div className="text-[#EFE2C0]">{r.full_name || '—'}</div>
        <div className="text-[12px] text-[#E7D5A4]/60 truncate">{r.email}{r.is_active ? '' : ' · deactivated'}</div>
      </div>) },
    { key: 'events', header: 'Events', render: (r) => (r.events?.length
      ? <div className="flex flex-wrap gap-1">{r.events.map((e) => <Badge key={e.event_id} tone="muted">{e.name} · {fmt.date(e.event_date)}</Badge>)}</div>
      : <span className="text-[#E7D5A4]/60">Not assigned</span>) },
    { key: 'access', header: 'Check-in access', render: (r) => {
      if (r.active_grant) return <div><Badge status="active">Active</Badge> <span className="text-[12px] text-[#E7D5A4]/70">{r.active_grant.event_name}</span></div>;
      if (r.pending_requests?.length) return <div><Badge tone="warn">Requested</Badge> <span className="text-[12px] text-[#E7D5A4]/70">{r.pending_requests[0].event_name}</span></div>;
      if (r.last_grant) return <Badge status="expired">{r.last_grant.state === 'revoked' ? 'Revoked' : 'Expired'}</Badge>;
      return <span className="text-[#E7D5A4]/60">None</span>;
    } },
    { key: 'expires', header: 'Expires', render: (r) => (r.active_grant ? <span className="font-mono text-[12px]">{fmt.dateTime(r.active_grant.expires_at)}</span> : <span className="text-[#E7D5A4]/60">—</span>) },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {canGrant && r.pending_requests?.map((req) => (
          <span key={req.id} className="flex gap-1.5">
            <Button size="sm" variant="primary" icon="KeyRound" onClick={() => setGrantFor({ volunteer: r, request: req })}>Grant request</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeclining({ volunteer: r, request: req })}>Decline</Button>
          </span>
        ))}
        {canGrant && !r.active_grant && !r.pending_requests?.length && r.is_active && <Button size="sm" icon="KeyRound" onClick={() => setGrantFor({ volunteer: r })}>Grant check-in</Button>}
        {canGrant && r.active_grant && <Button size="sm" variant="danger" icon="Ban" onClick={() => setRevoking(r)}>Revoke</Button>}
        <Button size="sm" variant="ghost" icon="CalendarDays" onClick={() => setAssignFor(r)}>Assign event</Button>
        <Button size="sm" variant="ghost" icon="Activity" aria-label={`Activity for ${r.full_name || r.email}`} onClick={() => navigate(`/admin-portal/volunteers/${r.user_id}`)} />
      </div>) },
  ];

  const pendingTotal = rows.reduce((n, r) => n + (r.pending_requests?.length || 0), 0);

  return (
    <Page title="Volunteers" subtitle="Assign volunteers to events and grant time-limited, event-specific QR check-in access.">
      {pendingTotal > 0 && access !== 'pending' && (
        <button onClick={() => setAccess('pending')} className="text-left rounded-md border border-[#d4911c]/45 bg-[#d4911c]/10 px-4 py-3 text-[13px] text-[#ffe0a3]">
          <Icon name="KeyRound" size={15} className="inline mr-2" />{pendingTotal} check-in access request{pendingTotal === 1 ? '' : 's'} waiting — show requests
        </button>
      )}
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.num(count)} volunteer{count === 1 ? '' : 's'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
            <FilterSelect label="Event" value={eventId} onChange={setEventId} className="w-full sm:w-60"
              options={[{ value: '', label: 'All events' }, ...(events.data || []).map((e) => ({ value: e.id, label: `${e.name} · ${fmt.date(e.event_date)}` }))]} />
            <FilterSelect label="Check-in access" value={access} onChange={setAccess} className="w-full sm:w-48"
              options={[{ value: '', label: 'Any access' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Requested' }, { value: 'expired', label: 'Expired / revoked' }, { value: 'none', label: 'Never granted' }]} />
          </Toolbar>
        </div>
        <DataTable columns={columns} rows={rows} rowKey="user_id" loading={table.loading} error={table.error} onRetry={table.reload}
          empty={{ title: access === 'pending' ? 'No pending requests' : access === 'active' ? 'No active check-in access' : 'No volunteers found', icon: 'HeartHandshake',
            hint: 'Volunteers join through the Tangy website and appear here once approved.' }} />
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(count / PAGE))} count={count} pageSize={PAGE} setPage={setPage} />
      </Panel>

      {grantFor && <GrantDialog {...grantFor} events={events.data || []} onClose={() => setGrantFor(null)}
        onDone={(g) => { setGrantFor(null); toast(`Check-in access granted until ${fmt.time(g.expires_at)}`); table.reload(); }} />}
      {revoking && (
        <ConfirmDialog title="Revoke check-in access" tone="danger" confirmLabel="Revoke access"
          message={`${revoking.full_name || revoking.email} will immediately lose check-in access for ${revoking.active_grant.event_name}.`}
          fields={[{ name: 'reason', label: 'Reason (logged)', multiline: true }]}
          onConfirm={async ({ reason }) => { await rpc('revoke_temporary_access', { p_grant_id: revoking.active_grant.id, p_reason: reason || null }); toast('Access revoked'); table.reload(); }}
          onClose={() => setRevoking(null)} />
      )}
      {declining && (
        <ConfirmDialog title="Decline request" confirmLabel="Decline"
          message={`${declining.volunteer.full_name || declining.volunteer.email} asked for check-in access at ${declining.request.event_name}.`}
          fields={[{ name: 'note', label: 'Note to the volunteer', multiline: true }]}
          onConfirm={async ({ note }) => { await rpc('decline_access_request', { p_request_id: declining.request.id, p_note: note || null }); toast('Request declined'); table.reload(); }}
          onClose={() => setDeclining(null)} />
      )}
      {assignFor && <AssignDialog volunteer={assignFor} events={events.data || []} onClose={() => setAssignFor(null)} onDone={() => { setAssignFor(null); toast('Volunteer assigned'); table.reload(); }} />}
    </Page>
  );
}

const GrantDialog = ({ volunteer, request, events, onClose, onDone }) => {
  const assigned = volunteer.events?.map((e) => e.event_id) || [];
  const sorted = useMemo(() => [...events].sort((a, b) => (assigned.includes(b.id) - assigned.includes(a.id))), [events]); // eslint-disable-line react-hooks/exhaustive-deps
  const [eventId, setEventId] = useState(request?.event_id || assigned.find((id) => events.some((e) => e.id === id)) || '');
  const [duration, setDuration] = useState(120);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const g = await rpc('grant_temporary_access', { p_user_id: volunteer.user_id, p_event_id: eventId, p_duration_minutes: Number(duration), p_request_id: request?.id || null });
      onDone(g);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Modal title="Grant check-in access" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="KeyRound" onClick={submit} disabled={busy || !eventId}>{busy ? 'Granting…' : 'Grant access'}</Button></>}>
      <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-[13px]">
        <dt className="font-mono text-[10.5px] uppercase tracking-wider text-[#E7D5A4]/60 pt-0.5">Volunteer</dt><dd className="m-0 text-[#EFE2C0]">{volunteer.full_name || '—'}</dd>
        <dt className="font-mono text-[10.5px] uppercase tracking-wider text-[#E7D5A4]/60 pt-0.5">Email</dt><dd className="m-0">{volunteer.email}</dd>
      </dl>
      {request?.message && <p className="text-[12.5px] text-[#E7D5A4]/65 border-l-2 border-[#C99A2E]/40 pl-3">“{request.message}”</p>}
      <Field label="Event">
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Event">
          <option value="">Select an event…</option>
          {sorted.map((e) => <option key={e.id} value={e.id}>{e.name} · {fmt.date(e.event_date)}{assigned.includes(e.id) ? ' (assigned)' : ''}</option>)}
        </Select>
      </Field>
      <Field label="Access">
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked readOnly disabled className="accent-[#C99A2E]" /> QR check-in (this event only)</label>
      </Field>
      <Field label="Duration">
        <Select value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration">
          {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Expires" hint="Set by the server when you grant; access ends automatically.">
        <div className="font-mono text-[13px] text-[#EFE2C0]">≈ {fmt.dateTime(new Date(now + Number(duration) * 60000).toISOString())}</div>
      </Field>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</div>}
    </Modal>
  );
};

const AssignDialog = ({ volunteer, events, onClose, onDone }) => {
  const assigned = volunteer.events?.map((e) => e.event_id) || [];
  const options = events.filter((e) => !assigned.includes(e.id));
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('Volunteer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('event_assignments').insert({ event_id: eventId, assignee_role: 'volunteer', assignee_id: volunteer.user_id, title: title.trim() || 'Volunteer' });
    if (err) { setError(friendlyError(err).message); setBusy(false); return; }
    onDone();
  };
  return (
    <Modal title={`Assign ${volunteer.full_name || volunteer.email}`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit} disabled={busy || !eventId}>{busy ? 'Assigning…' : 'Assign'}</Button></>}>
      <Field label="Event">
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Event to assign">
          <option value="">Select an event…</option>
          {options.map((e) => <option key={e.id} value={e.id}>{e.name} · {fmt.date(e.event_date)}</option>)}
        </Select>
      </Field>
      <Field label="Role at the event"><Textarea rows={1} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} /></Field>
      <p className="text-[12px] text-[#E7D5A4]/60">Assigning adds the event to their portal. It does not grant check-in access.</p>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</div>}
    </Modal>
  );
};

const KIND = { grant: 'Access granted', request: 'Access requested', checkin: 'Checked in a ticket' };

const ActivityDrawer = ({ volunteer, onClose, inline = false }) => {
  const act = useAsync(() => rpc('volunteer_access_activity', { p_user_id: volunteer.user_id }), [volunteer.user_id]);
  return (
    <Drawer inline={inline} title={volunteer.full_name || volunteer.email} subtitle="Check-in access activity" onClose={onClose}>
      {act.loading ? <Skeleton rows={5} /> : act.error ? <ErrorState error={act.error} onRetry={act.reload} /> : !act.data?.length ? (
        <EmptyState icon="Activity" title="No activity yet" />
      ) : (
        <ol className="flex flex-col gap-3">
          {act.data.map((a, i) => (
            <li key={i} className="border-l-2 border-[#C99A2E]/40 pl-3 text-[13px]">
              <div className="text-[#EFE2C0]">{KIND[a.kind]} · {a.event_name}</div>
              <div className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.dateTime(a.at)}</div>
              {a.kind === 'grant' && (
                <div className="text-[12px] text-[#E7D5A4]/65 mt-0.5">
                  Until {fmt.dateTime(a.detail.expires_at)} · by {a.detail.granted_by} · <Badge status={a.detail.state === 'active' ? 'active' : 'expired'}>{a.detail.state}</Badge>
                  {a.detail.revoked_at && <> · revoked by {a.detail.revoked_by}{a.detail.revoke_reason ? ` (“${a.detail.revoke_reason}”)` : ''}</>}
                </div>
              )}
              {a.kind === 'request' && <div className="text-[12px] text-[#E7D5A4]/65 mt-0.5"><Badge status={a.detail.status}>{a.detail.status}</Badge>{a.detail.message ? ` “${a.detail.message}”` : ''}</div>}
              {a.kind === 'checkin' && <div className="text-[12px] text-[#E7D5A4]/65 mt-0.5">{a.detail.method === 'manual' ? 'Manual check-in' : 'QR scan'}</div>}
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
};

// /admin-portal/volunteers/:userId — a volunteer's check-in access history.
export function VolunteerDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const q = useAsync(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
    const { data, error } = await supabase.from('profiles').select('id, full_name, email').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }, [userId]);
  const name = q.data ? q.data.full_name || q.data.email : q.loading ? 'Volunteer' : 'Volunteer not found';
  return (
    <Page title={name} back={{ to: '/admin-portal/volunteers', label: 'Volunteers' }} crumbs={[{ label: name }]}>
      {q.loading ? <Skeleton rows={4} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : !q.data ? (
        <Panel><EmptyState icon="HeartHandshake" title="Volunteer not found" action={<Button to="/admin-portal/volunteers" icon="ChevronLeft">Back to volunteers</Button>} /></Panel>
      ) : <ActivityDrawer inline volunteer={{ user_id: q.data.id, full_name: q.data.full_name, email: q.data.email }} onClose={() => navigate('/admin-portal/volunteers')} />}
    </Page>
  );
}
