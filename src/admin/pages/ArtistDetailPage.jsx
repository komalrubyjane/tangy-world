import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { Page, Panel, Tabs, Badge, Button, Field, Input, Textarea, Skeleton, EmptyState, ErrorState, AsyncBlock, KeyValue, NotFound, Grid, StatTile, fmt, useToast } from '../ui';
import { ArtistCalendar } from '../../components/calendar/ArtistCalendar';
import { adminLinkFor } from '../../components/calendar/calendarData';
import { AvailabilityPill } from '../../components/calendar/availability';
import { iso } from '../../lib/calendarDates';
import { EntityDrawer, ENTITIES } from './PeoplePage';
import { CustomNotificationForm } from '../components/CustomNotification';

const TABS = [['profile', 'Profile'], ['sessions', 'Sessions'], ['calendar', 'Calendar'], ['availability', 'Availability'], ['media', 'Media'],
  ['application', 'Application'], ['messages', 'Messages'], ['notifications', 'Notifications']];

const today = () => iso(new Date());

// Sessions: line-ups (upcoming / past / cancelled) and requests.
const SessionsTab = ({ artist }) => {
  const q = useAsync(async () => {
    const [{ data: lineup, error: e1 }, { data: reqs, error: e2 }] = await Promise.all([
      supabase.from('event_artists').select('event_id, events(id, name, event_date, status, venue)').eq('artist_id', artist.id),
      supabase.from('assignment_requests').select('id, status, created_at, session_id, events(id, name, event_date, status)').eq('artist_id', artist.id).order('created_at', { ascending: false }),
    ]);
    if (e1 || e2) throw friendlyError(e1 || e2);
    const events = (lineup || []).map((l) => l.events).filter(Boolean).sort((a, b) => a.event_date.localeCompare(b.event_date));
    return { events, reqs: reqs || [] };
  }, [artist.id]);
  const upcoming = (q.data?.events || []).filter((e) => e.event_date >= today() && e.status !== 'cancelled');
  const past = (q.data?.events || []).filter((e) => e.event_date < today() || e.status === 'cancelled').reverse();
  const row = (e) => (
    <li key={e.id}><Link to={`/admin-portal/events/${e.id}/artists`} className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[#C99A2E]/[0.05]">
      <span className="font-mono text-[#C99A2E] w-24 shrink-0">{fmt.date(e.event_date)}</span>
      <span className="flex-1 min-w-0 truncate">{e.name}{e.venue ? <span className="text-[#E7D5A4]/60"> · {e.venue}</span> : null}</span>
      <Badge status={e.status} />
    </Link></li>
  );
  return (
    <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={`Upcoming sessions · ${upcoming.length}`} flush>
          {upcoming.length ? <ul className="divide-y divide-[#E7D5A4]/[0.06]" data-upcoming-sessions>{upcoming.map(row)}</ul> : <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">Nothing booked.</div>}
        </Panel>
        <Panel title="Requests" flush>
          {(q.data?.reqs || []).length ? (
            <ul className="divide-y divide-[#E7D5A4]/[0.06]">{q.data.reqs.map((r) => (
              <li key={r.id}><Link to={`/admin-portal/events/${r.session_id}/artists`} className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[#C99A2E]/[0.05]">
                <span className="font-mono text-[#C99A2E] w-24 shrink-0">{fmt.date(r.events?.event_date)}</span>
                <span className="flex-1 min-w-0 truncate">{r.events?.name}</span><Badge status={r.status === 'accepted' ? 'approved' : r.status} />
              </Link></li>))}</ul>
          ) : <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">No requests.</div>}
        </Panel>
        <Panel title={`Past & cancelled · ${past.length}`} flush className="lg:col-span-2">
          {past.length ? <ul className="divide-y divide-[#E7D5A4]/[0.06]">{past.map(row)}</ul> : <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">No past sessions.</div>}
        </Panel>
      </div>
    </AsyncBlock>
  );
};

// Availability: when the artist last updated it, the next 7 days, and every mark ahead.
const AvailabilityTab = ({ artist }) => {
  const q = useAsync(async () => {
    const to = iso(new Date(Date.now() + 90 * 864e5));
    const [summary, days] = await Promise.all([
      supabase.rpc('artist_availability_summary', { p_artist_id: artist.id }).then(({ data, error }) => { if (error) throw friendlyError(error); return data; }),
      supabase.rpc('artist_calendar', { p_artist_id: artist.id, p_from: today(), p_to: to }).then(({ data, error }) => { if (error) throw friendlyError(error); return data || []; }),
    ]);
    return { summary, days };
  }, [artist.id]);
  const s = q.data?.summary;
  const marks = (q.data?.days || []).filter((d) => ['available', 'tentative', 'unavailable'].includes(d.kind));
  return (
    <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload}>
      <div className="flex flex-col gap-4">
        <Grid cols={5}>
          <StatTile label="Last updated" value={s?.last_updated ? fmt.relative(s.last_updated) : 'Never'} sub={s?.is_stale ? 'Not updated recently' : 'Up to date'} tone={s?.is_stale ? 'warn' : 'good'} />
          <StatTile label="Next 7 · available" value={s?.next7?.available || 0} />
          <StatTile label="Next 7 · booked" value={s?.next7?.busy || 0} />
          <StatTile label="Next 7 · tentative" value={s?.next7?.tentative || 0} />
          <StatTile label="Next 7 · unavailable" value={s?.next7?.unavailable || 0} />
        </Grid>
        <Panel title="Marked days (next 90 days)" subtitle="Set by the artist in their portal — the only source of availability." flush>
          {marks.length === 0 ? <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">The artist hasn't marked any days.</div> : (
            <ul className="divide-y divide-[#E7D5A4]/[0.06]" data-availability-marks>
              {marks.map((m) => (
                <li key={m.day} className="flex flex-wrap items-center gap-3 px-4 py-2 text-[13px]">
                  <span className="font-mono text-[#C99A2E] w-24">{fmt.date(m.day)}</span><AvailabilityPill status={m.kind} />
                  <span className="text-[#E7D5A4]/70">{m.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AsyncBlock>
  );
};

const MediaTab = ({ artist }) => {
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('artist_media').select('id, title, file_name, kind, media_type, status, created_at').eq('artist_id', artist.id).order('created_at', { ascending: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, [artist.id]);
  return (
    <Panel title="Media" flush actions={<Button size="sm" to="/admin-portal/reviews">Media reviews</Button>}>
      <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0} emptyProps={{ title: 'No media uploaded', icon: 'Image' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(q.data || []).map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13px]">
              <span className="flex-1 min-w-0 truncate">{m.title || m.file_name}</span>
              <span className="text-[12px] text-[#E7D5A4]/60">{m.kind || m.media_type}</span>
              <Badge status={m.status === 'under_review' ? 'pending' : m.status} />
              <span className="font-mono text-[11px] text-[#E7D5A4]/50">{fmt.date(m.created_at)}</span>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

const ApplicationTab = ({ artist }) => {
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('artist_applications').select('id, status, submitted_at, decided_at, public_message').eq('artist_id', artist.id).maybeSingle();
    if (error) throw friendlyError(error);
    return data;
  }, [artist.id]);
  return (
    <Panel title="Application">
      {q.loading ? <Skeleton rows={3} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : !q.data ? (
        <EmptyState icon="FileText" title="No portal application" hint="This artist was added to the roster directly." />
      ) : (
        <div className="flex flex-col gap-3">
          <KeyValue items={[['Status', <Badge key="status" status={q.data.status} />], ['Submitted', fmt.dateTime(q.data.submitted_at)], ['Decided', q.data.decided_at ? fmt.dateTime(q.data.decided_at) : '—'], ['Message to artist', q.data.public_message]]} />
          <Button to={`/admin-portal/artists/applications/${q.data.id}`} icon="ArrowUpRight" className="self-start">Open the application</Button>
        </div>
      )}
    </Panel>
  );
};

// Conversations with this artist the viewer may see (RLS), and a composer:
// a Super Admin starts a private thread; message managers a partner thread.
const MessagesTab = ({ artist }) => {
  const { user, can } = useAdminSession();
  const toast = useToast();
  const navigate = useNavigate();
  const superAdmin = user?.role === 'super_admin';
  const [f, setF] = useState({ subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const q = useAsync(async () => {
    if (!artist.user_id) return [];
    const { data, error } = await supabase.from('conversations').select('id, subject, conversation_type, status, last_message_at, last_message_preview')
      .eq('external_user_id', artist.user_id).order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, [artist.user_id]);
  const send = async () => {
    setBusy(true);
    const { data, error } = superAdmin
      ? await supabase.rpc('start_private_artist_conversation', { p_artist_user_id: artist.user_id, p_subject: f.subject, p_body: f.body })
      : await supabase.rpc('admin_start_partner_conversation', { p_user_id: artist.user_id, p_subject: f.subject, p_body: f.body, p_event_id: null });
    setBusy(false);
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    toast('Message sent — the artist is notified');
    navigate(`/admin-portal/messages/${data}`);
  };
  if (!artist.user_id) return <Panel><EmptyState icon="MessagesSquare" title="No portal account" hint="This artist can't receive messages until they have an account." /></Panel>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Conversations" flush>
        <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0} emptyProps={{ title: 'No conversations yet', icon: 'MessagesSquare' }}>
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {(q.data || []).map((c) => (
              <li key={c.id}><Link to={`/admin-portal/messages/${c.id}`} className="block px-4 py-2.5 hover:bg-[#C99A2E]/[0.05]">
                <span className="flex items-center gap-2 text-[13px] text-[#EFE2C0]">{c.subject || 'Conversation'}{c.conversation_type === 'artist_private' && <Badge tone="gold">Private</Badge>}</span>
                <span className="block text-[12px] text-[#E7D5A4]/60 truncate">{c.last_message_preview}</span>
              </Link></li>
            ))}
          </ul>
        </AsyncBlock>
      </Panel>
      {(superAdmin || can(P.MESSAGES)) && (
        <Panel title={superAdmin ? 'Private message' : 'Message'} subtitle={superAdmin
          ? 'Only you and the artist can read this conversation — not other admins or staff. Protected by HTTPS, sign-in and database access rules (not end-to-end encrypted).'
          : 'Visible to the artist and the Tangy team members who manage messages.'}>
          <div className="flex flex-col gap-3" data-artist-composer>
            <Field label="Subject"><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={140} /></Field>
            <Field label="Message"><Textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={4000} /></Field>
            <Button variant="primary" icon="Send" disabled={busy || !f.body.trim()} onClick={send} className="self-start">{busy ? 'Sending…' : 'Send message'}</Button>
          </div>
        </Panel>
      )}
    </div>
  );
};

// /admin-portal/people/artists/:id/:tab — everything about one artist.
export default function ArtistDetailPage() {
  const { id, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminSession();
  const tab = tabParam || 'profile';
  const base = `/admin-portal/people/artists/${id}`;
  const q = useAsync(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await supabase.from('artists').select('*').eq('id', id).maybeSingle();
    if (error) throw friendlyError(error);
    return data;
  }, [id]);
  if (q.loading && !q.data) return <Skeleton rows={8} />;
  if (q.error) return <Panel><ErrorState error={q.error} onRetry={q.reload} /></Panel>;
  const artist = q.data;
  if (!artist) return <NotFound what="artist" />;
  if (!TABS.some(([t]) => t === tab)) return <NotFound what="artist section" />;
  const name = artist.stage_name || artist.name;
  const label = TABS.find(([t]) => t === tab)[1];
  return (
    <Page title={name} back={{ to: '/admin-portal/people/artists', label: 'Artists' }}
      crumbs={[{ label: name, to: tab === 'profile' ? undefined : base }, ...(tab === 'profile' ? [] : [{ label }])]}
      docTitle={tab === 'profile' ? name : `${name} · ${label}`}
      subtitle={<span className="inline-flex flex-wrap items-center gap-2">{[artist.genre, artist.city].filter(Boolean).join(' · ')} <Badge status={artist.status} />{artist.user_id ? <Badge tone="good">Portal account</Badge> : <Badge tone="muted">Roster only</Badge>}</span>}>
      <Tabs tabs={TABS.map(([t, l]) => ({ id: t, label: l, to: t === 'profile' ? base : `${base}/${t}` }))} value={tab} />
      <div className="mt-4" data-artist-tab={tab}>
        {tab === 'profile' && <EntityDrawer inline key={artist.id} config={ENTITIES.artists} row={artist} onClose={() => navigate('/admin-portal/people/artists')} onSaved={q.reload} />}
        {tab === 'sessions' && <SessionsTab artist={artist} />}
        {tab === 'calendar' && <Panel title="Calendar" subtitle="Bookings, requests and the artist's own availability — the same calendar the artist sees."><ArtistCalendar artistId={artist.id} linkFor={adminLinkFor} /></Panel>}
        {tab === 'availability' && <AvailabilityTab artist={artist} />}
        {tab === 'media' && <MediaTab artist={artist} />}
        {tab === 'application' && <ApplicationTab artist={artist} />}
        {tab === 'messages' && <MessagesTab artist={artist} />}
        {tab === 'notifications' && (user?.role === 'super_admin' && artist.user_id
          ? <CustomNotificationForm userId={artist.user_id} name={name} />
          : <Panel><EmptyState icon="Bell" title={artist.user_id ? 'Super Admins send custom notifications' : 'No portal account'} hint={artist.user_id ? 'The artist receives event, request and message notifications automatically.' : 'Notifications need a portal account.'} /></Panel>)}
      </div>
    </Page>
  );
}
