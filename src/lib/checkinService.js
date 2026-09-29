import { supabase, isSupabaseConfigured } from './supabaseClient';

// Every scanned/typed ticket is validated and checked in by check_in_ticket()
// (0016, extended in 0017) — a single atomic, server-validated RPC that also
// checks the caller is allowed to work THIS event. The browser never decides
// validity and never writes `checkins`; it only renders the returned `result`:
//   valid | already_checked_in | wrong_event | cancelled | payment_not_confirmed
//   | not_found | not_assigned | manual_disabled
export function parseTicketToken(scanned) {
  const text = String(scanned || '').trim();
  const prefix = 'TANGY:TICKET:';
  return text.startsWith(prefix) ? text.slice(prefix.length).trim() : text;
}

export const checkinService = {
  checkInByToken: async (scanned, eventId, { method = 'qr', notes = null } = {}) => {
    if (!isSupabaseConfigured) return { result: 'error', error: 'Not connected.' };
    const token = parseTicketToken(scanned);
    if (!token) return { result: 'not_found' };
    const { data, error } = await supabase.rpc('check_in_ticket', { p_token: token, p_event_id: eventId, p_method: method, p_notes: notes });
    if (error) return { result: 'error', error: 'Unable to verify ticket. Please try again.' };
    return data;
  },

  // Events this user may check in for (admins: all live events; staff: only
  // events they're assigned to) — decided server-side.
  getEvents: async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.rpc('my_checkin_events');
    if (error) return [];
    return data || [];
  },

  // Manual mode: ticket-level search through the attendee_tickets view, which
  // already restricts rows to events the caller can work.
  searchTickets: async (query, eventId) => {
    if (!isSupabaseConfigured || !query || !eventId) return [];
    const q = `%${query.trim().replace(/[%_,()*\\]/g, (c) => `\\${c}`)}%`;
    const { data, error } = await supabase
      .from('attendee_tickets')
      .select('ticket_id, ticket_number, tier, ticket_status, booking_status, registration_code, attendee_name, checked_in_at, token, event_id')
      .eq('event_id', eventId)
      .or(`attendee_name.ilike.${q},registration_code.ilike.${q},ticket_number.ilike.${q}`)
      .order('attendee_name')
      .limit(25);
    if (error) return [];
    return data || [];
  },

  getStats: async (eventId) => {
    if (!isSupabaseConfigured || !eventId) return null;
    const { data, error } = await supabase.rpc('event_checkin_stats', { p_event_id: eventId });
    return error ? null : data;
  },

  getRecentCheckins: async (eventId, limit = 10) => {
    if (!isSupabaseConfigured || !eventId) return [];
    const { data, error } = await supabase.rpc('get_checkin_history', { p_event_id: eventId, p_mine: false, p_limit: limit, p_offset: 0 });
    return error ? [] : data || [];
  },
};
