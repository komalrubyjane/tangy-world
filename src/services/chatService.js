// REAL Supabase-backed chat service. Method names/shapes mirror
// mockChatService.js so conversationService.js can facade between them.
// Security is enforced server-side (RLS + the RPCs in
// supabase/migrations/0008_conversations_and_assignments.sql) — this file
// only shapes requests/responses, it never re-implements authorization.
import { supabase } from '../lib/supabaseClient';

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

async function fetchProfilesByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, organization_name, avatar_url')
    .in('id', unique);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((p) => [p.id, p]));
}

function toParty(profile) {
  if (!profile) return null;
  return { id: profile.id, name: profile.full_name || profile.email, email: profile.email, role: profile.role, organization: profile.organization_name, avatar: profile.avatar_url };
}

// For an 'assignment' conversation, created_by is the requesting ADMIN, not
// the artist — so the "who is this conversation with" party the Admin Inbox
// should display is the artist, not whoever technically created the row.
// Returns { artistUserIdByArtistId } so callers can resolve it per-row.
async function fetchArtistUserIds(artistIds) {
  const unique = [...new Set(artistIds.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.from('artists').select('id, user_id').in('id', unique);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((a) => [a.id, a.user_id]));
}

function toRow(c, profiles, artistUserIdByArtistId) {
  const primaryPartyId = c.category === 'assignment' ? artistUserIdByArtistId[c.related_artist_id] : c.created_by;
  return {
    id: c.id,
    subject: c.subject,
    category: c.category,
    status: c.status,
    createdBy: toParty(profiles[primaryPartyId]) || toParty(profiles[c.created_by]),
    requestedBy: c.category === 'assignment' ? toParty(profiles[c.created_by]) : null,
    assignedAdmin: toParty(profiles[c.assigned_admin_id]),
    relatedSessionId: c.related_session_id,
    relatedArtistId: c.related_artist_id,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastMessageAt: c.last_message_at,
    lastMessagePreview: c.last_message_preview,
  };
}

export const chatService = {
  async getOrCreateSupportConversation(subject) {
    const { data, error } = await supabase.rpc('get_or_create_support_conversation', { p_subject: subject || null });
    if (error) throw new Error(error.message);
    return data;
  },

  async listConversations() {
    const [{ data: convos, error }, myId] = await Promise.all([
      supabase.from('conversations').select('*').order('updated_at', { ascending: false }).limit(300),
      getCurrentUserId(),
    ]);
    if (error) throw new Error(error.message);

    const artistIds = (convos || []).filter((c) => c.category === 'assignment').map((c) => c.related_artist_id);
    const artistUserIdByArtistId = await fetchArtistUserIds(artistIds);
    const ids = (convos || []).flatMap((c) => [c.created_by, c.assigned_admin_id, artistUserIdByArtistId[c.related_artist_id]]);
    const profiles = await fetchProfilesByIds(ids);

    const { data: reads } = myId
      ? await supabase.from('message_read_states').select('conversation_id, last_read_at').eq('user_id', myId)
      : { data: [] };
    const readMap = Object.fromEntries((reads || []).map((r) => [r.conversation_id, r.last_read_at]));

    return (convos || []).map((c) => ({
      ...toRow(c, profiles, artistUserIdByArtistId),
      unread: Boolean(c.last_message_at && (!readMap[c.id] || new Date(c.last_message_at) > new Date(readMap[c.id]))),
    }));
  },

  async getConversation(id) {
    const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    const artistUserIdByArtistId = data.category === 'assignment' ? await fetchArtistUserIds([data.related_artist_id]) : {};
    const profiles = await fetchProfilesByIds([data.created_by, data.assigned_admin_id, artistUserIdByArtistId[data.related_artist_id]]);
    return toRow(data, profiles, artistUserIdByArtistId);
  },

  async getMessages(conversationId, { limit = 200 } = {}) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      text: m.content,
      messageType: m.message_type,
      timestamp: m.created_at,
    }));
  },

  async sendMessage(conversationId, { text }) {
    const senderId = await getCurrentUserId();
    if (!senderId) throw new Error('You must be signed in to send a message.');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content: text })
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Keep conversations.last_message_* in sync from the client — cheap and
    // avoids a trigger for a single denormalized preview field.
    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    await supabase.from('conversations').update({ last_message_at: data.created_at, last_message_preview: preview }).eq('id', conversationId);
    return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, text: data.content, messageType: data.message_type, timestamp: data.created_at };
  },

  async assignConversation(conversationId, admin) {
    const { error } = await supabase.rpc('assign_conversation', { p_conversation_id: conversationId, p_admin_id: admin.id });
    if (error) throw new Error(error.message);
  },

  async resolveConversation(conversationId) {
    const { error } = await supabase.from('conversations').update({ status: 'resolved' }).eq('id', conversationId);
    if (error) throw new Error(error.message);
  },

  async reopenConversation(conversationId) {
    const { error } = await supabase.rpc('reopen_conversation', { p_conversation_id: conversationId });
    if (error) throw new Error(error.message);
  },

  async closeConversation(conversationId) {
    const { error } = await supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId);
    if (error) throw new Error(error.message);
  },

  async markRead(conversationId) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from('message_read_states').upsert({ conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() });
  },

  subscribeToConversation(conversationId, onChange) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        onChange({
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          senderId: payload.new.sender_id,
          text: payload.new.content,
          messageType: payload.new.message_type,
          timestamp: payload.new.created_at,
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeToInbox(onChange) {
    const channel = supabase
      .channel('conversations:inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => onChange())
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  getCurrentUserId,
};
