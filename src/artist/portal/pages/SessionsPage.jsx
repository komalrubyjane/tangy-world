import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { artistApi, isPast, requestState } from '../api';
import { PageHeader, Card, StatusPill, Btn, Loading, ErrorNote, Empty, PIcon } from '../kit';
import { fmtDate, fmtTime, fmtMoney, cx } from '../util';
import { NotFoundPage } from '../../../pages/content/NotFoundPage';
import { RequirementsPanel } from '../../../portal/PortalSections';

const TABS = [['upcoming', 'Upcoming'], ['pending', 'Pending'], ['past', 'Past'], ['cancelled', 'Cancelled']];
const minutes = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 60000) : null);

function useSessionsData() {
  const [state, setState] = useState({ loading: true });
  const load = async () => {
    try {
      const [sessions, requests] = await Promise.all([artistApi.sessions(), artistApi.requests()]);
      setState({ sessions, requests });
    } catch (error) { setState({ error }); }
  };
  useEffect(() => { load(); }, []);
  return { ...state, reload: load };
}

// /artist/sessions — every session: booked (upcoming / past / cancelled) and
// requests awaiting your answer (pending). The filter is in the URL.
export const SessionsPage = () => {
  usePageMeta({ title: 'Sessions', noindex: true });
  const { sessions, requests, loading, error, reload } = useSessionsData();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('show')) ? params.get('show') : 'upcoming';
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading) return <Loading label="Loading your sessions…" />;

  const reqByEvent = Object.fromEntries((requests || []).map((r) => [r.event_id, r]));
  const booked = (sessions || []).map((s) => ({ ...s, request: reqByEvent[s.event_id] }));
  const lists = {
    upcoming: booked.filter((s) => !isPast(s.event_date) && s.event_status !== 'cancelled').sort((a, b) => a.event_date.localeCompare(b.event_date)),
    past: booked.filter((s) => isPast(s.event_date) && s.event_status !== 'cancelled').sort((a, b) => b.event_date.localeCompare(a.event_date)),
    cancelled: booked.filter((s) => s.event_status === 'cancelled'),
    pending: (requests || []).filter((r) => ['pending', 'viewed'].includes(requestState(r))),
  };
  const rows = lists[tab];

  return (
    <div>
      <PageHeader title="Sessions" description="Everything you're booked for, and requests waiting for your answer." />
      <div role="group" aria-label="Show" className="flex flex-wrap gap-2 mb-5">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setParams(k === 'upcoming' ? {} : { show: k })}
            className={cx('min-h-[40px] px-4 rounded-full border text-sm', tab === k ? 'bg-[#C99A2E] border-[#C99A2E] text-[#14110D]' : 'border-[#E7D5A4]/25 hover:border-[#C99A2E]/70')}>
            {label} <span className="opacity-70">({lists[k].length})</span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <Empty title={`No ${TABS.find(([k]) => k === tab)[1].toLowerCase()} sessions`} /> : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none m-0 p-0" data-artist-sessions={tab}>
          {tab === 'pending' ? rows.map((r) => (
            <li key={r.id}><Card as="article">
              <div className="flex items-start justify-between gap-3"><h2 className="font-condensed text-xl uppercase text-[#F3E7C9] m-0">{r.event_name}</h2><StatusPill status={requestState(r)} /></div>
              <p className="text-sm text-[#E7D5A4]/75 mt-1">{fmtDate(r.event_date)} · {r.venue}{r.venue_city ? `, ${r.venue_city}` : ''}</p>
              <p className="text-sm text-[#E7D5A4]/75 m-0">{[r.performance_type, r.set_minutes && `${r.set_minutes} min`, r.call_time && `call ${fmtTime(r.call_time)}`, r.fee_offer != null && fmtMoney(r.fee_offer)].filter(Boolean).join(' · ')}</p>
              <Btn to={`/artist/requests/${r.id}`} size="sm" className="mt-3">Review request</Btn>
            </Card></li>
          )) : rows.map((s) => (
            <li key={s.event_id}>
              <Link to={`/artist/sessions/${s.event_id}`} className="block bg-[#1C1814] border border-[#E7D5A4]/12 rounded-lg p-4 sm:p-5 hover:border-[#C99A2E]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]" data-artist-session={s.event_id}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-condensed text-xl uppercase text-[#F3E7C9] m-0">{s.name}</h2>
                  <StatusPill status={s.event_status === 'cancelled' ? 'cancelled' : s.request ? requestState({ ...s.request, event_date: s.event_date }) : (isPast(s.event_date) ? 'completed' : 'confirmed')} />
                </div>
                <p className="text-sm text-[#E7D5A4]/75 mt-1 mb-2">{fmtDate(s.event_date)} · {s.venue_name || '—'}{s.venue_city ? `, ${s.venue_city}` : ''}</p>
                <dl className="grid grid-cols-3 gap-2 text-xs m-0">
                  <div><dt className="text-[#E7D5A4]/60">Call</dt><dd className="m-0 text-[#F3E7C9]">{fmtTime(s.call_time)}</dd></div>
                  <div><dt className="text-[#E7D5A4]/60">On stage</dt><dd className="m-0 text-[#F3E7C9]">{fmtTime(s.starts_at)}</dd></div>
                  <div><dt className="text-[#E7D5A4]/60">Set</dt><dd className="m-0 text-[#F3E7C9]">{minutes(s.starts_at, s.ends_at) ? `${minutes(s.starts_at, s.ends_at)} min` : '—'}</dd></div>
                </dl>
                {(s.fee_amount != null || s.fee_status) && <p className="text-xs text-[#E7D5A4]/70 mt-2 mb-0">Fee {fmtMoney(s.fee_amount)}{s.fee_status && s.fee_status !== 'not_applicable' ? ` · ${s.fee_status.replace('_', ' ')}` : ''}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section id="requirements" aria-labelledby="req-heading" className="mt-10">
        <h2 id="req-heading" className="font-condensed text-2xl uppercase text-[#F3E7C9] m-0 mb-1">Requirements</h2>
        <p className="text-sm text-[#E7D5A4]/75 mt-0 mb-4">Things the team has asked you for — riders, lists, confirmations. Answer them here.</p>
        <RequirementsPanel />
      </section>
    </div>
  );
};

const Row = ({ label, children }) => (children == null || children === '' ? null : (
  <div className="grid grid-cols-[130px_1fr] gap-3 py-2 border-b border-[#E7D5A4]/8 text-sm"><dt className="text-[#E7D5A4]/65">{label}</dt><dd className="m-0 text-[#F3E7C9] whitespace-pre-line">{children}</dd></div>
));

// /artist/sessions/:sessionId — one session in full.
export const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const { sessions, requests, loading, error, reload } = useSessionsData();
  const s = (sessions || []).find((x) => x.event_id === sessionId);
  const r = (requests || []).find((x) => x.event_id === sessionId);
  usePageMeta({ title: s ? s.name : 'Session', noindex: true });
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading) return <Loading label="Loading the session…" />;
  if (!s && r) return <RequestRedirect id={r.id} />;
  if (!s) return <NotFoundPage what="session" back={{ to: '/artist/sessions', label: 'Back to your sessions' }} />;
  const status = s.event_status === 'cancelled' ? 'cancelled' : r ? requestState({ ...r, event_date: s.event_date }) : (isPast(s.event_date) ? 'completed' : 'confirmed');
  const mapHref = s.venue_map_url || (s.venue_address ? `https://maps.google.com/?q=${encodeURIComponent(`${s.venue_name || ''} ${s.venue_address}`)}` : null);

  return (
    <div data-artist-session-page={s.event_id}>
      <nav aria-label="Breadcrumb" className="text-xs text-[#E7D5A4]/70 mb-3"><Link to="/artist/sessions" className="underline-offset-4 hover:underline">Sessions</Link> › <span aria-current="page">{s.name}</span></nav>
      <PageHeader kicker={fmtDate(s.event_date)} title={s.name} actions={<>
        <StatusPill status={status} />
        {!isPast(s.event_date) && s.event_status !== 'cancelled' && <>
          <Btn size="sm" to="/artist/availability" icon="CalendarCheck">Update availability</Btn>
          <Btn size="sm" to="/artist/messages" icon="MessagesSquare">Message coordinator</Btn>
        </>}
      </>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Event"><dl className="m-0">
          <Row label="Date">{fmtDate(s.event_date)}{s.event_time ? ` · ${s.event_time}` : ''}</Row>
          <Row label="Venue">{s.venue_name}</Row>
          <Row label="Address">{s.venue_address}</Row>
          <Row label="Access">{s.venue_access_info}</Row>
          <Row label="About">{s.description}</Row>
        </dl>
        {mapHref && <Btn size="sm" href={mapHref} target="_blank" rel="noopener noreferrer" icon="MapPin" className="mt-3">Open map</Btn>}
        </Card>
        <Card title="Performance"><dl className="m-0">
          <Row label="Format">{r?.performance_type}</Row>
          <Row label="Set length">{r?.set_minutes ? `${r.set_minutes} min${r.sets_count > 1 ? ` × ${r.sets_count} sets` : ''}` : (minutes(s.starts_at, s.ends_at) ? `${minutes(s.starts_at, s.ends_at)} min` : null)}</Row>
          <Row label="Arrive (call)">{s.call_time && fmtTime(s.call_time)}</Row>
          <Row label="Soundcheck">{s.soundcheck_at && fmtTime(s.soundcheck_at)}</Row>
          <Row label="On stage">{s.starts_at && `${fmtTime(s.starts_at)}${s.ends_at ? ` – ${fmtTime(s.ends_at)}` : ''}`}</Row>
          <Row label="Equipment">{r?.technical_notes || s.rider_notes}</Row>
        </dl></Card>
        <Card title="Team"><dl className="m-0">
          <Row label="Tangy contact">{s.tangy_contact}</Row>
          <Row label="On-site contact">{s.onsite_contact}</Row>
          <Row label="Team">{s.team}</Row>
        </dl></Card>
        <Card title="Requirements & hospitality"><dl className="m-0">
          <Row label="Instructions">{s.instructions}</Row>
          <Row label="Hospitality">{r?.hospitality_notes || s.hospitality}</Row>
          <Row label="Meals">{s.meals}</Row>
          <Row label="Green room">{s.green_room}</Row>
          <Row label="Travel">{s.travel || s.transport_notes}</Row>
          <Row label="Accommodation">{s.accommodation || s.hotel}</Row>
          <Row label="Fee">{s.fee_amount != null ? `${fmtMoney(s.fee_amount)}${s.fee_status ? ` · ${s.fee_status.replace('_', ' ')}` : ''}` : null}</Row>
        </dl></Card>
      </div>
      <p className="text-xs text-[#E7D5A4]/60 mt-6 flex items-center gap-2"><PIcon name="Clock" size={14} />Times are local to the venue. Changes from the Tangy team appear here and in your notifications.</p>
    </div>
  );
};

const RequestRedirect = ({ id }) => {
  useEffect(() => { window.location.replace(`/artist/requests/${id}`); }, [id]);
  return <Loading label="Opening the request…" />;
};
