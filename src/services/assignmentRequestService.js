// REAL Supabase-backed assignment-request service. Calls the RPCs in
// supabase/migrations/0008_conversations_and_assignments.sql — all
// authorization (staff/admin only creates, artist can only respond to their
// own request) is enforced server-side, never re-implemented here.
import { supabase } from '../lib/supabaseClient';

// Normalizes a raw assignment_requests row (snake_case) plus joined
// event/artist names into the same camelCase shape mockAssignmentRequestService
// produces, so UI never branches on which mode it's running in.
function toRequestShape(row, eventsById, artistsById) {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionName: eventsById[row.session_id]?.name || null,
    artistId: row.artist_id,
    artistName: artistsById[row.artist_id]?.name || null,
    requestedBy: row.requested_by,
    status: row.status,
    message: row.message,
    conversationId: row.conversation_id,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

async function joinNames(rows) {
  const sessionIds = [...new Set(rows.map((r) => r.session_id).filter(Boolean))];
  const artistIds = [...new Set(rows.map((r) => r.artist_id).filter(Boolean))];
  const [{ data: events }, { data: artists }] = await Promise.all([
    sessionIds.length ? supabase.from('events').select('id, name').in('id', sessionIds) : Promise.resolve({ data: [] }),
    artistIds.length ? supabase.from('artists').select('id, name').in('id', artistIds) : Promise.resolve({ data: [] }),
  ]);
  const eventsById = Object.fromEntries((events || []).map((e) => [e.id, e]));
  const artistsById = Object.fromEntries((artists || []).map((a) => [a.id, a]));
  return rows.map((r) => toRequestShape(r, eventsById, artistsById));
}

export const assignmentRequestService = {
  async listForAdmin({ status } = {}) {
    let query = supabase.from('assignment_requests').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return joinNames(data || []);
  },

  async listForArtist(artistId) {
    const { data, error } = await supabase
      .from('assignment_requests')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return joinNames(data || []);
  },

  async listForSession(sessionId) {
    const { data, error } = await supabase.from('assignment_requests').select('*').eq('session_id', sessionId);
    if (error) throw new Error(error.message);
    return joinNames(data || []);
  },

  // sessionName/admin are accepted but unused here (mock mode needs them to
  // denormalize its conversation record; the RPC derives everything else
  // server-side) — kept so callers can use one shared payload shape.
  async createRequest({ sessionId, artist, message }) {
    const { data, error } = await supabase.rpc('create_assignment_request', {
      p_session_id: sessionId,
      p_artist_id: artist.id,
      p_message: message || null,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async respond(requestId, accept) {
    const { error } = await supabase.rpc('respond_to_assignment_request', { p_request_id: requestId, p_accept: accept });
    if (error) throw new Error(error.message);
  },

  async cancel(requestId) {
    const { error } = await supabase.rpc('cancel_assignment_request', { p_request_id: requestId });
    if (error) throw new Error(error.message);
  },
};
