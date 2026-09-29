import { rpc, list, friendlyError } from '../admin/api';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Data access for partner/volunteer portals and the shared messaging /
// notification UI. Every call is authorized by the database (RLS or a
// SECURITY DEFINER RPC in 0018_operations_platform.sql) — nothing here
// decides who may see what.
export const portalApi = {
  myEvents: (includePast = false) => rpc('my_portal_events', { p_include_past: includePast }).then((r) => r || []),
  announcements: (limit = 20) => rpc('portal_announcements', { p_limit: limit }).then((r) => r || []),

  requirements: () =>
    list('event_requirements', {
      select: 'id, event_id, title, details, due_at, status, response, responded_at, review_note, created_at, events(name, event_date)',
      build: (q) => q.order('status').order('due_at', { ascending: true, nullsFirst: false }),
      to: 99,
    }).then((r) => r.rows),
  submitRequirement: (id, response) => rpc('submit_requirement', { p_id: id, p_response: response }),

  documents: () =>
    list('event_documents', {
      select: 'id, event_id, title, url, audience, created_at, events(name, event_date)',
      build: (q) => q.order('created_at', { ascending: false }),
      to: 99,
    }).then((r) => r.rows),

  // Messaging (partner side)
  conversations: () => rpc('my_conversations').then((r) => r || []),
  startConversation: ({ subject, body, eventId }) =>
    rpc('start_partner_conversation', { p_subject: subject || null, p_body: body, p_event_id: eventId || null }),

  // Messaging (both sides)
  messages: (conversationId) => rpc('conversation_messages', { p_conversation_id: conversationId, p_limit: 200 }).then((r) => r || []),
  send: (conversationId, body) => rpc('send_message', { p_conversation_id: conversationId, p_body: body }),
  markRead: (conversationId) => rpc('mark_conversation_read', { p_conversation_id: conversationId }),

  // Messaging (admin side)
  adminConversations: (filters = {}) =>
    rpc('admin_conversations', {
      p_type: filters.type || null,
      p_event_id: filters.eventId || null,
      p_status: filters.status || null,
      p_search: filters.search || null,
      p_unread_only: !!filters.unreadOnly,
      p_limit: filters.limit || 30,
      p_offset: filters.offset || 0,
    }).then((r) => r || []),
  adminStartConversation: ({ userId, subject, body, eventId }) =>
    rpc('admin_start_partner_conversation', { p_user_id: userId, p_subject: subject || null, p_body: body, p_event_id: eventId || null }),
  setConversationStatus: (conversationId, status) => rpc('set_conversation_status', { p_conversation_id: conversationId, p_status: status }),

  // Notifications
  notifications: ({ limit = 20, before = null, unreadOnly = false } = {}) =>
    rpc('my_notifications', { p_limit: limit, p_before: before, p_unread_only: unreadOnly }).then((r) => r || []),
  unreadCount: () => rpc('notification_unread_count').then((n) => n || 0),
  markNotificationsRead: (ids = null) => rpc('mark_notifications_read', { p_ids: ids }),

  // Volunteer check-in access
  myCheckinAccess: () => rpc('my_checkin_access').then((r) => r || []),
  requestCheckinAccess: (eventId, message) => rpc('request_checkin_access', { p_event_id: eventId, p_message: message || null }),
};

// Realtime inserts for one table/filter; returns an unsubscribe function.
// The local/dev stack may run without Realtime — callers also poll, so a
// failed subscription only means slower updates, never missing data.
export function subscribeInserts(channelName, table, filter, onInsert) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, (payload) => onInsert(payload.new))
    .subscribe((status) => {
      // Realtime unavailable (e.g. a local stack without it): stop retrying and
      // rely on the caller's polling instead of reconnecting forever.
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') supabase.removeChannel(channel);
    });
  return () => { supabase.removeChannel(channel); };
}

export { friendlyError };
