import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isMockAuth } from '../config/auth';
import { bookingService as mockBookingServiceImpl } from '../services/bookingService';
import { eventService as mockEventServiceImpl } from '../services/eventService';

function toApiBooking(mockBooking) {
  return {
    id: mockBooking.id,
    registration_code: mockBooking.registrationCode,
    user_id: mockBooking.userId,
    event_id: mockBooking.eventId,
    attendee_name: mockBooking.attendeeName,
    attendee_email: mockBooking.attendeeEmail,
    attendee_phone: mockBooking.attendeePhone || '',
    quantity: mockBooking.quantity,
    amount: mockBooking.amount,
    status: mockBooking.status,
    created_at: mockBooking.createdAt,
  };
}

export const bookingService = {
  // Real payment path — creates a Razorpay order + a 'pending' booking
  // server-side (the Edge Function computes the authoritative amount from
  // the event's own price + tier markup; nothing about the amount is
  // trusted from this call). Requires a real Supabase session regardless of
  // the app's global AUTH_MODE — there is no mock equivalent, since a mock
  // session has no JWT for the Edge Function to verify.
  createPaymentOrder: async ({ eventId, quantity, tierId, attendeeName, attendeeEmail, attendeePhone }) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Payment is not available right now — please try again shortly.' };
    }
    const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
      body: { eventId, quantity, tierId, attendeeName, attendeeEmail, attendeePhone },
    });
    if (error) return { success: false, error: error.message || 'Could not start payment.' };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, order: data };
  },

  // Verifies the Razorpay checkout response server-side and only then flips
  // the booking to 'confirmed' and issues its tickets. The razorpay-webhook
  // Edge Function is the real source of truth in the background regardless
  // of whether this call ever completes (browser closed mid-flow, etc.) —
  // ticket issuance is idempotent either way (0016_payments_tickets_checkin.sql).
  verifyPayment: async ({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
      body: {
        booking_id: bookingId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      },
    });
    if (error) return { success: false, error: error.message || 'Could not verify payment.' };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, booking: data.booking, tickets: data.tickets || [] };
  },

  // Best-effort — fired right after a successful verifyPayment so the
  // buyer gets their ticket email immediately. Idempotent server-side
  // (bookings.ticket_email_status), so a retry here never double-sends. If
  // this never runs at all (browser closed before it fires), the booking is
  // still fully confirmed with real tickets — an admin can trigger this
  // same call later as a resend (src/admin/sections/PaymentsSection.jsx).
  sendTicketEmail: async (bookingId, { force = false } = {}) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Not configured.' };
    const { data, error } = await supabase.functions.invoke('send-ticket-email', {
      body: { booking_id: bookingId, force },
    });
    if (error) return { success: false, error: error.message || 'Could not send ticket email.' };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, alreadySent: !!data?.already_sent };
  },

  getMyBookings: async (userId) => {
    if (isMockAuth) {
      const events = mockEventServiceImpl.getAll();
      return mockBookingServiceImpl.getForUser(userId).map((b) => {
        const event = events.find((e) => e.id === b.eventId);
        return {
          ...toApiBooking(b),
          events: event ? { name: event.name, event_date: event.date, venue: event.venue, image_url: event.image } : null,
        };
      });
    }
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(name, event_date, event_time, venue, image_url), tickets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
};
