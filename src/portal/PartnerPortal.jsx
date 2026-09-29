import { useState, useEffect } from 'react';
import { Panel, Button } from '../admin/ui';
import { MessagesPanel } from './MessagesPanel';
import { portalApi } from './portalApi';
import { ArtistEventDrawer } from '../artist/components/ArtistEventDrawer';
import { ProfileCompletionCard } from '../artist/components/ProfileCompletionCard';
import { NotificationPreferences, PREF_KEYS_BY_ROLE } from './NotificationPreferences';
import { InvoicesPanel, SponsorAssetsPanel, MyTasksPanel } from './PartnerExtras';
import {
  usePortalTab, usePortalEvents, Greeting, NextEventCard, EventsPanel, EventDrawer, ScheduleTimeline, RequirementsPanel,
  DocumentsPanel, AnnouncementsPanel, NotificationsPanel, NOTIFICATION_FILTERS, CheckInAccessPanel, PortalStat,
} from './PortalSections';

// Shared tabs for artist / sponsor / vendor / venue host / volunteer portals.
// Each dashboard keeps its own role-specific tabs (applications, profile,
// deliverables…) and adds these; the content differs by role through the
// data the database returns for that account.

const COPY = {
  artist: { events: 'My performances', next: 'No upcoming performances', hint: 'Once Tangy confirms you for a session, it appears here.' },
  sponsor: { events: 'My events', next: 'No sponsored events yet', hint: 'Events you sponsor appear here with their schedule and deliverables.' },
  vendor: { events: 'My events', next: 'No assigned events', hint: 'Events you are set up at appear here with instructions and timings.' },
  venue: { events: 'Upcoming events', next: 'No upcoming events at your venue', hint: 'Sessions hosted at your venue appear here.' },
  volunteer: { events: 'My events', next: 'No assigned events', hint: 'Events you volunteer at appear here.' },
};

export function partnerTabs(kind) {
  const c = COPY[kind];
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: c.events },
  ];
  if (kind === 'artist') tabs.push({ id: 'schedule', label: 'Schedule' });
  if (kind === 'volunteer') tabs.push({ id: 'tasks', label: 'My tasks' }, { id: 'checkin', label: 'Check-in access' });
  if (kind !== 'volunteer') tabs.push({ id: 'requirements', label: 'Requirements' });
  // Volunteers are reached through announcements/notifications, never private messaging.
  if (kind !== 'volunteer') tabs.push({ id: 'messages', label: 'Messages' });
  if (kind !== 'volunteer') tabs.push({ id: 'documents', label: 'Documents' });
  if (kind === 'sponsor') tabs.push({ id: 'assets', label: 'Brand assets' });
  if (kind !== 'volunteer') tabs.push({ id: 'payments', label: 'Payments' });
  tabs.push({ id: 'announcements', label: 'Announcements' }, { id: 'notifications', label: 'Notifications' });
  return tabs;
}

export function usePartnerPortal(kind, extraTabIds = [], { enabled = true } = {}) {
  const ids = [...partnerTabs(kind).map((t) => t.id), ...extraTabIds];
  const nav = usePortalTab('overview', ids);
  const events = usePortalEvents(enabled);
  const [openEvent, setOpenEvent] = useState(null);
  return { kind, ...nav, events, openEvent, setOpenEvent };
}

const PARTNER_SECTIONS = ['overview', 'events', 'schedule', 'tasks', 'checkin', 'requirements', 'messages', 'documents', 'assets', 'payments', 'announcements', 'notifications'];

export const PartnerSection = ({ portal, user, overviewNote }) => {
  const { kind, tab, setTab, conversationId, setConversationId, events, openEvent, setOpenEvent } = portal;
  if (!PARTNER_SECTIONS.includes(tab)) return null;
  const c = COPY[kind];
  const ev = { events: events.events, loading: events.loading, error: events.error, onRetry: events.reload };
  return (
    <div className="flex flex-col gap-4">
      {tab === 'overview' && (
        <Overview kind={kind} user={user} ev={ev} copy={c} setTab={setTab} onOpen={setOpenEvent} note={overviewNote} />
      )}
      {tab === 'events' && (
        <EventsPanel {...ev} includePast={events.includePast} setIncludePast={events.setIncludePast} onOpen={setOpenEvent} emptyHint={c.hint} />
      )}
      {tab === 'schedule' && <ScheduleTimeline {...ev} onOpen={setOpenEvent} />}
      {tab === 'tasks' && kind === 'volunteer' && <MyTasksPanel userId={user?.id} />}
      {tab === 'checkin' && <CheckInAccessPanel events={events.events} />}
      {tab === 'requirements' && <RequirementsPanel onChanged={events.reload} />}
      {tab === 'messages' && (
        <MessagesPanel mode="partner" selectedId={conversationId} onSelect={setConversationId} events={events.events || []} />
      )}
      {tab === 'documents' && <DocumentsPanel />}
      {tab === 'assets' && kind === 'sponsor' && <SponsorAssetsPanel sponsorId={user?.id} events={events.events || []} />}
      {tab === 'payments' && <InvoicesPanel />}
      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'notifications' && (kind === 'artist'
        ? <NotificationsPanel settingsTo="/artist/settings" />
        : <>
          <NotificationsPanel filters={NOTIFICATION_FILTERS.filter(([k]) => !['applications', ...(kind === 'volunteer' ? ['messages', 'requirements', 'payments'] : ['tasks'])].includes(k))} />
          <NotificationPreferences keys={PREF_KEYS_BY_ROLE[kind === 'volunteer' ? 'volunteer' : 'partner']} />
        </>)}
      {openEvent && (kind === 'artist'
        ? <ArtistEventDrawer event={openEvent} onClose={() => setOpenEvent(null)} />
        : <EventDrawer event={openEvent} onClose={() => setOpenEvent(null)} onChanged={events.reload} />)}
    </div>
  );
};

const Overview = ({ kind, user, ev, copy, setTab, onOpen, note }) => {
  const [counts, setCounts] = useState({ messages: null, notifications: null });
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      kind === 'volunteer' ? Promise.resolve(null) : portalApi.conversations().then((r) => r.reduce((n, c) => n + (c.unread || 0), 0)).catch(() => null),
      portalApi.unreadCount().catch(() => null),
    ]).then(([messages, notifications]) => { if (!cancelled) setCounts({ messages, notifications }); });
    return () => { cancelled = true; };
  }, [kind]);
  const openReqs = (ev.events || []).reduce((n, e) => n + (e.open_requirements || 0), 0);
  const upcoming = (ev.events || []).filter((e) => e.event_date >= new Date().toISOString().slice(0, 10)).length;
  return (
    <>
      <Greeting name={user?.full_name} subtitle={kind === 'artist' ? 'Your upcoming Tangy events' : kind === 'volunteer' ? 'Your Tangy volunteering' : 'Your Tangy events at a glance'} />
      {note}
      {kind === 'artist' && <ProfileCompletionCard />}
      <NextEventCard {...ev} onOpen={onOpen} emptyTitle={copy.next} emptyHint={copy.hint}
        emptyAction={kind === 'artist' ? <Button size="sm" to="/artist/calendar" icon="CalendarDays">Set your availability</Button> : null}
        messagesTo={kind === 'artist' ? '/artist/dashboard?tab=messages' : '?tab=messages'}
        scheduleTo={kind === 'artist' ? '/artist/calendar' : '?tab=events'} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PortalStat label={copy.events} value={ev.events ? upcoming : null} onClick={() => setTab('events')} />
        {kind !== 'volunteer' && <PortalStat label="Needed from you" value={ev.events ? openReqs : null} tone={openReqs ? 'warn' : undefined} onClick={() => setTab('requirements')} />}
        {kind !== 'volunteer' && <PortalStat label="Unread messages" value={counts.messages} tone={counts.messages ? 'warn' : undefined} onClick={() => setTab('messages')} />}
        {kind === 'volunteer' && <PortalStat label="Check-in access" value="View" onClick={() => setTab('checkin')} />}
        <PortalStat label="Notifications" value={counts.notifications} onClick={() => setTab('notifications')} />
      </div>
      <AnnouncementsPanel limit={3} compact />
    </>
  );
};

export const PreviewUnavailable = () => (
  <Panel><p className="font-sans text-[13px] text-[#E7D5A4]/60">Portal activity (events, messages, requirements) is only visible to the account owner.</p></Panel>
);
