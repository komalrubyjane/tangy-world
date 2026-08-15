import { supabase, isSupabaseConfigured } from './supabaseClient';

function generateRegistrationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TS-${code}`;
}

export const bookingService = {
  // Creates a confirmed booking directly. Real Razorpay order creation/verification
  // needs a server-side secret key (a Supabase Edge Function), which isn't wired up
  // yet — until then this records the booking as confirmed without capturing payment,
  // so the rest of the pipeline (QR ticket, check-in, admin visibility) is fully real
  // and testable. Swap this for a payment-gated flow once the Edge Function exists.
  createBooking: async ({ userId, eventId, attendeeName, attendeeEmail, attendeePhone, quantity, amount }) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Booking is not available right now — please try again shortly.' };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { success: false, error: 'Ticket quantity must be between 1 and 10.' };
    }

    const registrationCode = generateRegistrationCode();
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        registration_code: registrationCode,
        user_id: userId,
        event_id: eventId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        quantity,
        amount,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, booking: data };
  },

  getMyBookings: async (userId) => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(name, event_date, venue, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
};
