import { supabase, isSupabaseConfigured } from './supabaseClient';

// Every scanned/typed code is validated and checked in by check_in_ticket()
// (0016, extended in 0017 and 0023) — a single atomic, server-validated RPC
// that also checks the caller is allowed to work THIS event. The browser never
// decides validity or counts and never writes `checkins`; it only renders the
// returned `result`:
//   valid | ready (booking preview) | already_checked_in | attendee_already_checked_in
//   | invalid_selection | invalid_attendee | wrong_event | cancelled | payment_not_confirmed
//   | not_found | not_assigned | access_expired | manual_disabled
//
// Two opaque QR payloads exist (neither contains ids or personal data):
//   TANGY:BOOKING:<token>  the booking (0023) — staff then select which named
//                          attendees are present
//   TANGY:TICKET:<token>   one attendee (issued per ticket since 0016; still honoured)
export function parseCheckinCode(scanned) {
  const text = String(scanned || '').trim();
  for (const [prefix, kind] of [['TANGY:TICKET:', 'ticket'], ['TANGY:BOOKING:', 'group']]) {
    if (text.startsWith(prefix)) return { kind, token: text.slice(prefix.length).trim() };
  }
  // Typed/pasted bare tokens: the server resolves which kind it is.
  return { kind: 'unknown', token: text };
}
export const parseTicketToken = (scanned) => parseCheckinCode(scanned).token;

// A booking's check-in state from server-derived counts. Always rendered as
// text + icon, never colour alone.
export const partyState = (checked, size) => (
  !size ? null : checked >= size ? { label: 'Complete', icon: 'CircleCheck', tone: 'good' }
    : checked > 0 ? { label: 'Partial', icon: 'CircleDashed', tone: 'warn' } : { label: 'Not checked in', icon: 'Circle', tone: 'muted' }
);

export const checkinService = {
  // `attendeeIds` (booking QR): the ticket ids of the named attendees staff
  // selected — the server admits them all or none and derives the count.
  // `preview` validates and returns the attendee list without writing.
  checkInByToken: async (scanned, eventId, { method = 'qr', notes = null, attendeeIds = null, preview = false } = {}) => {
    if (!isSupabaseConfigured) return { result: 'error', error: 'Not connected.' };
    const token = parseTicketToken(scanned);
    if (!token) return { result: 'not_found' };
    const { data, error } = await supabase.rpc('check_in_ticket', {
      p_token: token, p_event_id: eventId, p_method: method, p_notes: notes, p_attendee_ids: attendeeIds, p_preview: preview,
    });
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
      .select('ticket_id, ticket_number, tier, ticket_status, booking_id, booking_status, registration_code, attendee_name, guest_name, checked_in_at, token, event_id, group_token, party_size, party_checked_in, party_remaining')
      .eq('event_id', eventId)
      .or(`attendee_name.ilike.${q},guest_name.ilike.${q},registration_code.ilike.${q},ticket_number.ilike.${q}`)
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

  // A booking's arrivals, newest first (one row per check-in action).
  bookingHistory: async (bookingId) => {
    if (!isSupabaseConfigured || !bookingId) return [];
    const { data, error } = await supabase.rpc('booking_checkin_history', { p_booking_id: bookingId });
    return error ? [] : data || [];
  },

  getRecentCheckins: async (eventId, limit = 10) => {
    if (!isSupabaseConfigured || !eventId) return [];
    const { data, error } = await supabase.rpc('get_checkin_history', { p_event_id: eventId, p_mine: false, p_limit: limit, p_offset: 0 });
    return error ? [] : data || [];
  },
};
