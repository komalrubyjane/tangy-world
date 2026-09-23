import { supabase, isSupabaseConfigured } from './supabaseClient';

// Every scanned/typed ticket is resolved and checked in through
// check_in_ticket() (0016_payments_tickets_checkin.sql) — a single atomic,
// server-validated RPC. The browser never decides validity and never
// writes `checkins` directly; it only renders whichever `result` comes
// back. The RPC itself re-checks staff/admin authorization server-side
// (is_staff_or_admin()), so this can't be exercised by a plain patron even
// by calling the RPC directly.
function parseTicketToken(scanned) {
  const text = String(scanned || '').trim();
  const prefix = 'TANGY:TICKET:';
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

export const checkinService = {
  // Runs the real check-in RPC for a scanned QR payload or manually-typed
  // token. Returns the RPC's structured result directly — see
  // check_in_ticket()'s return shape for the `result` values
  // (valid / already_checked_in / wrong_event / cancelled /
  // payment_not_confirmed / not_found).
  checkInByToken: async (scanned, eventId) => {
    if (!isSupabaseConfigured) return { result: 'error', error: 'Not connected.' };
    const token = parseTicketToken(scanned);
    if (!token) return { result: 'not_found' };
    const { data, error } = await supabase.rpc('check_in_ticket', { p_token: token, p_event_id: eventId });
    if (error) return { result: 'error', error: error.message };
    return data;
  },

  // Manual mode: search by registration code / attendee name / email /
  // phone across bookings, joined to their tickets so staff can see and
  // check in an individual ticket without a working camera.
  searchBookings: async (query, eventId) => {
    if (!isSupabaseConfigured || !query) return [];
    const q = `%${query.trim()}%`;
    let request = supabase
      .from('bookings')
      .select('*, events(name), tickets(id, ticket_number, token, status)')
      .or(`registration_code.ilike.${q},attendee_name.ilike.${q},attendee_email.ilike.${q},attendee_phone.ilike.${q}`)
      .limit(20);
    if (eventId) request = request.eq('event_id', eventId);
    const { data, error } = await request;
    if (error) return [];
    return data;
  },

  getStats: async (eventId) => {
    if (!isSupabaseConfigured || !eventId) return { totalAttendees: 0, checkedIn: 0 };
    const { data: bookings } = await supabase
      .from('bookings')
      .select('quantity')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');
    const { count: checkedIn } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const totalAttendees = (bookings || []).reduce((sum, b) => sum + b.quantity, 0);
    return { totalAttendees, checkedIn: checkedIn || 0 };
  },

  getRecentCheckins: async (eventId, limit = 10) => {
    if (!isSupabaseConfigured || !eventId) return [];
    const { data } = await supabase
      .from('checkins')
      .select('id, checked_in_at, tickets(ticket_number), bookings(attendee_name)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false })
      .limit(limit);
    return data || [];
  },
};
