import { supabase, isSupabaseConfigured } from './supabaseClient';

export const checkinService = {
  // Resolves a scanned/typed registration code to a booking + its check-in state.
  lookupByCode: async (code, eventId) => {
    if (!isSupabaseConfigured) return { found: false };
    const normalized = code.trim().toUpperCase();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, events(id, name, event_date, venue), checkins(id, checked_in_at)')
      .eq('registration_code', normalized)
      .maybeSingle();

    if (error || !booking) return { found: false };
    if (eventId && booking.event_id !== eventId) {
      return { found: true, booking, wrongEvent: true };
    }
    return { found: true, booking, alreadyCheckedIn: booking.checkins && booking.checkins.length > 0 };
  },

  searchBookings: async (query, eventId) => {
    if (!isSupabaseConfigured || !query) return [];
    const q = `%${query.trim()}%`;
    let request = supabase
      .from('bookings')
      .select('*, events(name), checkins(id, checked_in_at)')
      .or(`registration_code.ilike.${q},attendee_name.ilike.${q},attendee_email.ilike.${q},attendee_phone.ilike.${q}`)
      .limit(20);
    if (eventId) request = request.eq('event_id', eventId);
    const { data, error } = await request;
    if (error) return [];
    return data;
  },

  checkIn: async (bookingId, eventId, staffUserId) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Not connected.' };
    const { data, error } = await supabase
      .from('checkins')
      .insert({ booking_id: bookingId, event_id: eventId, checked_in_by: staffUserId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, alreadyCheckedIn: true, error: 'Already checked in.' };
      }
      return { success: false, error: error.message };
    }
    return { success: true, checkin: data };
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
      .select('id, checked_in_at, bookings(registration_code, attendee_name)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false })
      .limit(limit);
    return data || [];
  },
};
