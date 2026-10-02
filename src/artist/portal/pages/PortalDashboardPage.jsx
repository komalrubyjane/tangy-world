import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LEGACY_TAB } from '../portalNav';
import { useAuth } from '../../contexts/AuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { artistApi, isPast, requestState, today } from '../api';
import { PageHeader, Card, StatTile, StatusPill, Btn, Loading, ErrorNote, Empty, PIcon } from '../kit';
import { fmtDate, fmtTime } from '../util';
import { AvailabilityFreshness, NextSevenDays } from '../AvailabilityStatus';

// /artist/dashboard — what needs attention, every card links to its page.
export const PortalDashboardPage = () => {
  usePageMeta({ title: 'Artist dashboard', noindex: true });
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const load = async () => {
    try {
      setError(null);
      const in60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
      const [sessions, requests, completion, unread, conversations, media, availability, summary] = await Promise.all([
        artistApi.sessions(), artistApi.requests(), artistApi.completion(), artistApi.unreadNotifications(),
        artistApi.conversations(), artistApi.media(user.id), artistApi.availability(user.id, today(), in60), artistApi.availabilitySummary(),
      ]);
      setD({ sessions, requests, completion, unread, conversations, media, availability, summary });
    } catch (err) { setError(err); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  // Links in older notifications: /artist/dashboard?tab=messages&c=<id> and friends.
  const legacyTab = params.get('tab');
  if (legacyTab) {
    const c = params.get('c');
    return <Navigate replace to={legacyTab === 'messages' && c ? `/artist/messages/${c}` : LEGACY_TAB[legacyTab] || '/artist/dashboard'} />;
  }
  if (error) return <ErrorNote error={error} onRetry={load} />;
  if (!d) return <Loading label="Loading your dashboard…" />;

  const upcoming = d.sessions.filter((s) => !isPast(s.event_date) && s.event_status !== 'cancelled').sort((a, b) => a.event_date.localeCompare(b.event_date));
  const next = upcoming[0];
  const states = d.requests.map(requestState);
  const pending = states.filter((s) => s === 'pending' || s === 'viewed').length;
  const accepted = states.filter((s) => s === 'accepted' || s === 'confirmed').length;
  const declined = states.filter((s) => s === 'declined').length;
  const unavailable = new Set(d.availability.filter((a) => a.status === 'unavailable').map((a) => a.date));
  const conflicts = upcoming.filter((s) => unavailable.has(s.event_date));
  const unreadMessages = d.conversations.reduce((n, c) => n + (c.unread || 0), 0);
  const mediaPending = d.media.filter((m) => m.status === 'under_review').length;
  const mediaApproved = d.media.filter((m) => m.status === 'approved').length;
  const pct = d.completion?.percent ?? 0;
  const openReqs = upcoming.reduce((n, s) => n + (s.open_requirements || 0), 0);

  return (
    <div data-artist-dashboard>
      <PageHeader kicker={`Welcome back, ${user.name.split(' ')[0]}`} title="Dashboard" description="Your next sessions, open requests and anything that needs you." />
      {d.summary?.is_stale && <div className="mb-4"><AvailabilityFreshness summary={d.summary} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Next session" className="lg:col-span-2" action={next && <StatusPill status="upcoming" />}>
          {next ? (
            <Link to={`/artist/sessions/${next.event_id}`} className="block group" data-next-session>
              <p className="font-condensed text-2xl uppercase text-[#F3E7C9] m-0 group-hover:text-[#C99A2E]">{next.name}</p>
              <p className="text-sm text-[#E7D5A4]/80 mt-1 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5"><PIcon name="CalendarDays" size={15} />{fmtDate(next.event_date)}</span>
                <span className="inline-flex items-center gap-1.5"><PIcon name="MapPin" size={15} />{next.venue_name || 'Venue to be confirmed'}</span>
              </p>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm m-0">
                {[['Call time', next.call_time], ['Soundcheck', next.soundcheck_at], ['On stage', next.starts_at], ['Off stage', next.ends_at]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-[#E7D5A4]/60">{k}</dt><dd className="m-0 text-[#F3E7C9]">{v ? fmtTime(v) : '—'}</dd></div>
                ))}
              </dl>
            </Link>
          ) : <Empty title="No upcoming sessions">Accepted requests will appear here.</Empty>}
        </Card>
        <Card title="Profile">
          <Link to="/artist/profile" className="block" data-profile-completion>
            <div className="flex items-baseline gap-2"><span className="font-condensed text-4xl text-[#F3E7C9]">{pct}%</span><span className="text-sm text-[#E7D5A4]/70">complete</span></div>
            <div className="h-2 rounded-full bg-[#E7D5A4]/10 mt-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
              <div className="h-full bg-[#C99A2E]" style={{ width: `${pct}%` }} />
            </div>
            {d.completion?.missing?.length > 0 && <p className="text-xs text-[#E7D5A4]/70 mt-2 mb-0">Missing: {d.completion.missing.slice(0, 3).join(', ')}{d.completion.missing.length > 3 ? '…' : ''}</p>}
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatTile to="/artist/requests" label="Pending requests" value={pending} hint={`${accepted} accepted · ${declined} declined`} icon="Inbox" />
        <StatTile to="/artist/notifications" label="Unread notifications" value={d.unread} icon="Bell" />
        <StatTile to="/artist/messages" label="Unread messages" value={unreadMessages} hint={`${d.conversations.length} conversations`} icon="MessagesSquare" />
        <StatTile to="/artist/media" label="Media" value={mediaApproved} hint={`approved · ${mediaPending} in review`} icon="Image" />
      </div>
      {openReqs > 0 && (
        <Card className="mb-4" title="Requirements">
          <p className="text-sm m-0 flex flex-wrap items-center gap-3" data-open-requirements>The team is waiting on {openReqs} requirement{openReqs === 1 ? '' : 's'} from you.
            <Btn size="sm" to="/artist/sessions#requirements">Answer now</Btn></p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Upcoming" action={<Btn size="sm" variant="ghost" to="/artist/calendar">Calendar</Btn>}>
          {upcoming.length === 0 ? <p className="text-sm text-[#E7D5A4]/70 m-0">Nothing scheduled yet.</p> : (
            <ul className="list-none m-0 p-0 divide-y divide-[#E7D5A4]/10">
              {upcoming.slice(0, 5).map((s) => (
                <li key={s.event_id}><Link to={`/artist/sessions/${s.event_id}`} className="flex items-center justify-between gap-3 py-3 hover:text-[#C99A2E]">
                  <span className="min-w-0"><span className="block text-sm text-[#F3E7C9] truncate">{s.name}</span><span className="text-xs text-[#E7D5A4]/65">{fmtDate(s.event_date)} · {s.venue_name || '—'}</span></span>
                  <PIcon name="ChevronRight" size={16} />
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Availability status" action={<Btn size="sm" variant="ghost" to="/artist/calendar">Calendar</Btn>}>
          <div className="flex flex-col gap-3 mb-3" data-availability-card>
            <AvailabilityFreshness summary={d.summary} cta={false} />
            <div><p className="text-xs uppercase tracking-wider text-[#E7D5A4]/60 mt-0 mb-1.5">Next 7 days</p><NextSevenDays summary={d.summary} /></div>
            <Btn size="sm" variant="primary" to="/artist/availability" className="self-start">Update calendar</Btn>
          </div>
          {conflicts.length === 0 ? <p className="text-sm text-[#E7D5A4]/75 m-0 flex items-center gap-2"><PIcon name="CheckCircle2" size={16} className="text-[#7FD3A0]" />No conflicts in the next 60 days.</p> : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2" data-availability-conflicts>
              {conflicts.map((s) => (
                <li key={s.event_id} className="text-sm flex items-start gap-2 text-[#F08A6A]"><PIcon name="AlertTriangle" size={16} />
                  <span>You're booked for <Link className="underline" to={`/artist/sessions/${s.event_id}`}>{s.name}</Link> on {fmtDate(s.event_date)} but marked unavailable.</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
