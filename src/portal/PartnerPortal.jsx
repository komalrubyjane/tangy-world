import { useState, useEffect } from 'react';
import { Panel } from '../admin/ui';
import { MessagesPanel } from './MessagesPanel';
import { portalApi } from './portalApi';
import {
  usePortalTab, usePortalEvents, Greeting, NextEventCard, EventsPanel, EventDrawer, ScheduleTimeline, RequirementsPanel,
  DocumentsPanel, AnnouncementsPanel, NotificationsPanel, CheckInAccessPanel, PortalStat,
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
  if (kind === 'volunteer') tabs.push({ id: 'checkin', label: 'Check-in access' });
  if (kind !== 'volunteer') tabs.push({ id: 'requirements', label: 'Requirements' });
  // Volunteers are reached through announcements/notifications, never private messaging.
  if (kind !== 'volunteer') tabs.push({ id: 'messages', label: 'Messages' });
  if (kind !== 'volunteer') tabs.push({ id: 'documents', label: 'Documents' });
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

const PARTNER_SECTIONS = ['overview', 'events', 'schedule', 'checkin', 'requirements', 'messages', 'documents', 'announcements', 'notifications'];

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
      {tab === 'checkin' && <CheckInAccessPanel events={events.events} />}
      {tab === 'requirements' && <RequirementsPanel onChanged={events.reload} />}
      {tab === 'messages' && (
        <MessagesPanel mode="partner" selectedId={conversationId} onSelect={setConversationId} events={events.events || []} />
      )}
      {tab === 'documents' && <DocumentsPanel />}
      {tab === 'announcements' && <AnnouncementsPanel />}
      {tab === 'notifications' && <NotificationsPanel />}
      {openEvent && <EventDrawer event={openEvent} onClose={() => setOpenEvent(null)} onChanged={events.reload} />}
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
      <NextEventCard {...ev} onOpen={onOpen} emptyTitle={copy.next} emptyHint={copy.hint} />
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
