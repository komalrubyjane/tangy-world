import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { artistApi, requestState } from '../api';
import { PageHeader, Card, StatusPill, Btn, Loading, ErrorNote, Empty, Field, Textarea } from '../kit';
import { fmtDate, fmtTime, fmtMoney } from '../util';
import { NotFoundPage } from '../../../pages/content/NotFoundPage';

function useRequests() {
  const [state, setState] = useState({ loading: true });
  const load = async () => {
    try { setState({ rows: await artistApi.requests() }); } catch (error) { setState({ error }); }
  };
  useEffect(() => { load(); }, []);
  return { ...state, reload: load };
}

const GROUPS = [
  ['Waiting for your answer', (s) => s === 'pending' || s === 'viewed'],
  ['Accepted', (s) => s === 'accepted' || s === 'confirmed'],
  ['Declined, expired or cancelled', (s) => ['declined', 'expired', 'cancelled'].includes(s)],
  ['Completed', (s) => s === 'completed'],
];

// /artist/requests — every session request from the Tangy team.
export const RequestsPage = () => {
  usePageMeta({ title: 'Requests', noindex: true });
  const { rows, loading, error, reload } = useRequests();
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading) return <Loading label="Loading requests…" />;
  return (
    <div>
      <PageHeader title="Requests" description="Session requests from the Tangy team. Open one to see the details and answer." />
      {rows.length === 0 ? <Empty title="No requests yet">When the team invites you to a session it shows up here.</Empty> : GROUPS.map(([title, test]) => {
        const list = rows.filter((r) => test(requestState(r)));
        return list.length === 0 ? null : (
          <section key={title} className="mb-6" aria-labelledby={`req-${title}`}>
            <h2 id={`req-${title}`} className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C99A2E] mb-3">{title} ({list.length})</h2>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              {list.map((r) => (
                <li key={r.id}>
                  <Link to={`/artist/requests/${r.id}`} data-request={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#1C1814] border border-[#E7D5A4]/12 rounded-lg p-4 hover:border-[#C99A2E]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                    <span className="flex-1 min-w-[200px]">
                      <span className="block font-condensed text-lg uppercase text-[#F3E7C9]">{r.event_name}</span>
                      <span className="text-xs text-[#E7D5A4]/70">{fmtDate(r.event_date)} · {r.venue}{r.performance_type ? ` · ${r.performance_type}` : ''}</span>
                    </span>
                    {r.fee_offer != null && <span className="text-sm text-[#F3E7C9]">{fmtMoney(r.fee_offer)}</span>}
                    <StatusPill status={requestState(r)} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

const Item = ({ label, children }) => (children == null || children === '' ? null : (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-[#E7D5A4]/8 text-sm"><dt className="text-[#E7D5A4]/65">{label}</dt><dd className="m-0 text-[#F3E7C9] whitespace-pre-line">{children}</dd></div>
));

// /artist/requests/:requestId — one request; opening it marks it viewed.
export const RequestDetailPage = () => {
  const { requestId } = useParams();
  const { rows, loading, error, reload } = useRequests();
  const r = (rows || []).find((x) => x.id === requestId);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  usePageMeta({ title: r ? `Request: ${r.event_name}` : 'Request', noindex: true });
  useEffect(() => { if (r?.status === 'pending' && !r.viewed_at) artistApi.markRequestViewed(r.id); }, [r?.id, r?.status, r?.viewed_at]);

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading) return <Loading label="Loading the request…" />;
  if (!r) return <NotFoundPage what="request" back={{ to: '/artist/requests', label: 'Back to requests' }} />;
  const state = requestState(r);
  const answer = async (accept) => {
    setBusy(true); setMsg(null);
    try {
      await artistApi.respond(r.id, accept, accept ? null : reason.trim());
      setMsg({ tone: 'good', text: accept ? 'Accepted — the session is now in your calendar and the team has been told.' : 'Declined — the team has been told.' });
      setDeclining(false);
      await reload();
    } catch (err) { setMsg({ tone: 'bad', text: err.message }); }
    setBusy(false);
  };

  return (
    <div data-request-page={r.id}>
      <nav aria-label="Breadcrumb" className="text-xs text-[#E7D5A4]/70 mb-3"><Link to="/artist/requests" className="underline-offset-4 hover:underline">Requests</Link> › <span aria-current="page">{r.event_name}</span></nav>
      <PageHeader kicker={`From ${r.requested_by_name} · sent ${fmtDate(r.created_at)}`} title={r.event_name} actions={<StatusPill status={state} />} />
      {msg && <p role="status" className={`text-sm rounded-md p-3 mb-4 border ${msg.tone === 'good' ? 'text-[#7FD3A0] border-[#3E8E5E]/40 bg-[#3E8E5E]/10' : 'text-[#F08A6A] border-[#B5532A]/40 bg-[#B5532A]/10'}`}>{msg.text}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Card title="The session"><dl className="m-0">
          <Item label="Date">{fmtDate(r.event_date)}{r.event_time ? ` · ${r.event_time}` : ''}</Item>
          <Item label="Venue">{r.venue}{r.venue_city ? `, ${r.venue_city}` : ''}</Item>
          <Item label="Performance">{r.performance_type}</Item>
          <Item label="Set">{r.set_minutes ? `${r.set_minutes} min${r.sets_count > 1 ? ` × ${r.sets_count} sets` : ''}` : null}</Item>
          <Item label="Call time">{r.call_time && fmtTime(r.call_time)}</Item>
          <Item label="Soundcheck">{r.soundcheck_at && fmtTime(r.soundcheck_at)}</Item>
          <Item label="On stage">{r.proposed_start && `${fmtTime(r.proposed_start)}${r.proposed_end ? ` – ${fmtTime(r.proposed_end)}` : ''}`}</Item>
          <Item label="Fee">{r.fee_offer != null ? fmtMoney(r.fee_offer) : null}</Item>
          <Item label="Technical">{r.technical_notes}</Item>
          <Item label="Hospitality">{r.hospitality_notes}</Item>
          <Item label="Message">{r.message}</Item>
          <Item label="Reply by">{state === 'pending' || state === 'viewed' ? fmtDate(r.expires_at) : null}</Item>
          <Item label="Your reason">{r.decline_reason}</Item>
          <Item label="Cancelled">{r.cancel_reason}</Item>
        </dl></Card>
        <Card title="Your answer">
          {(state === 'pending' || state === 'viewed') ? (declining ? (
            <div className="flex flex-col gap-3">
              <Field label="Reason (optional, shared with the team)" id="decline-reason"><Textarea id="decline-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
              <div className="flex flex-wrap gap-2"><Btn variant="danger" disabled={busy} onClick={() => answer(false)}>Decline request</Btn><Btn variant="ghost" onClick={() => setDeclining(false)}>Back</Btn></div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Btn variant="success" disabled={busy} onClick={() => answer(true)} icon="CheckCircle2">Accept</Btn>
              <Btn variant="default" disabled={busy} onClick={() => setDeclining(true)}>Decline…</Btn>
              <p className="text-xs text-[#E7D5A4]/65 m-0 mt-1">Accepting adds the session to your calendar. The team confirms the final details.</p>
            </div>
          )) : (state === 'accepted' || state === 'confirmed') ? (
            <div className="flex flex-col gap-2">
              <Btn to={`/artist/sessions/${r.event_id}`}>View session details</Btn>
              <Btn to="/artist/availability" variant="ghost">Update availability</Btn>
              <Btn to="/artist/messages" variant="ghost">Message the coordinator</Btn>
            </div>
          ) : <p className="text-sm text-[#E7D5A4]/75 m-0">No action needed.</p>}
        </Card>
      </div>
    </div>
  );
};
