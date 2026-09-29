import { useState, useEffect, useCallback } from 'react';
import { workspaceApi } from '../services/workspaceApi';
import { Panel, Badge, Button, EmptyState, ErrorState, Skeleton, Modal, Textarea, Field, fmt, cx } from '../../admin/ui';

// Booking requests from Tangy. History is never dropped: accepted, declined,
// cancelled and expired requests stay listed. Accept/decline go through
// respond_to_booking_request (server checks ownership, deadline, state).

const STATUS = {
  pending: ['Awaiting your reply', 'warn'], accepted: ['Accepted', 'good'], declined: ['Declined', 'bad'],
  cancelled: ['Withdrawn by Tangy', 'muted'], expired: ['Expired', 'muted'],
};
const FILTERS = [['all', 'All'], ['pending', 'Pending'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['closed', 'Cancelled / expired']];

export const RequestsPage = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [declining, setDeclining] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try { setRows(await workspaceApi.bookingRequests()); setError(null); } catch (err) { setError(err); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const respond = async (r, accept, why) => {
    setBusy(r.id);
    setMsg('');
    try {
      await workspaceApi.respondToRequest(r.id, accept, why);
      setMsg(accept ? `Accepted — ${r.event_name} is on your calendar.` : 'Declined. Tangy has been notified.');
      setDeclining(null); setReason('');
      load();
    } catch (err) { setMsg(err.message); }
    finally { setBusy(null); }
  };

  const shown = (rows || []).filter((r) => filter === 'all' || (filter === 'closed' ? ['cancelled', 'expired'].includes(r.status) : r.status === filter));

  return (
    <div className="w-full p-3 sm:p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-4 text-left font-sans text-[#E7D5A4]">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d1a437]">Artist workspace</p>
        <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] m-0 leading-none">Booking requests</h1>
        <p className="text-[13px] text-[#ecdcaf]/65 mt-1">Invitations from Tangy to perform. Accepting adds the event to your calendar.</p>
      </header>
      <div role="tablist" aria-label="Filter requests" className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
            className={cx('h-8 px-3 rounded-full border font-mono text-[11px] uppercase tracking-[0.08em]', filter === k ? 'border-[#C99A2E] bg-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/25 text-[#ecdcaf]/80')}>
            {label}{k === 'pending' && rows ? ` (${rows.filter((r) => r.status === 'pending').length})` : ''}
          </button>
        ))}
      </div>
      {msg && <p role="status" className="text-[13px] text-[#f5b544]">{msg}</p>}
      <Panel flush>
        {error ? <ErrorState error={error} onRetry={load} /> : rows === null ? <Skeleton rows={4} /> : shown.length === 0 ? (
          <EmptyState icon="Inbox" title={filter === 'pending' ? 'No pending requests' : 'No booking requests yet'} hint="When Tangy invites you to perform, the request appears here and you get a notification." />
        ) : (
          <ul className="divide-y divide-[#E7D5A4]/[0.07]">
            {shown.map((r) => {
              const [label, tone] = STATUS[r.status] || [r.status, 'muted'];
              return (
                <li key={r.id} className="p-4 flex flex-col gap-2" data-request={r.event_name}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[16px] text-[#EFE2C0]">{r.event_name}</div>
                      <div className="text-[13px] text-[#E7D5A4]/60">{[fmt.date(r.event_date), r.event_time, r.venue].filter(Boolean).join(' · ')}</div>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12.5px]">
                    <div><dt className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45">Proposed set</dt><dd className="m-0">{r.proposed_start ? `${fmt.dateTime(r.proposed_start)}${r.proposed_end ? ` – ${fmt.time(r.proposed_end)}` : ''}` : 'To be agreed'}</dd></div>
                    <div><dt className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45">Fee offer</dt><dd className="m-0">{r.fee_offer != null ? fmt.money(r.fee_offer) : 'To be discussed'}</dd></div>
                    <div><dt className="font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45">{r.status === 'pending' ? 'Reply by' : 'Answered'}</dt>
                      <dd className="m-0">{r.status === 'pending' ? (r.expires_at ? fmt.dateTime(r.expires_at) : '—') : r.responded_at ? fmt.dateTime(r.responded_at) : '—'}</dd></div>
                  </dl>
                  {r.message && <p className="text-[13px] text-[#E7D5A4]/80 border-l-2 border-[#C99A2E]/40 pl-3">“{r.message}” <span className="text-[#E7D5A4]/45">— {r.requested_by_name}</span></p>}
                  {r.decline_reason && <p className="text-[12.5px] text-[#E7D5A4]/60">Your reason: {r.decline_reason}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.status === 'pending' && <>
                      <Button variant="success" disabled={busy === r.id} onClick={() => respond(r, true)}>{busy === r.id ? 'Saving…' : 'Accept'}</Button>
                      <Button variant="ghost" disabled={busy === r.id} onClick={() => setDeclining(r)}>Decline</Button>
                    </>}
                    <Button variant="ghost" icon="MessagesSquare" to="/artist/dashboard?tab=messages">Message Tangy</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {declining && (
        <Modal title="Decline this request?" onClose={() => setDeclining(null)}
          footer={<><Button variant="ghost" onClick={() => setDeclining(null)}>Keep it</Button><Button variant="danger" disabled={busy === declining.id} onClick={() => respond(declining, false, reason)}>Decline request</Button></>}>
          <p className="text-[13.5px] text-[#E7D5A4]/80">{declining.event_name} · {fmt.date(declining.event_date)}. Tangy will be notified; this can't be undone from here.</p>
          <Field label="Reason (optional, shared with Tangy)"><Textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </Modal>
      )}
    </div>
  );
};
