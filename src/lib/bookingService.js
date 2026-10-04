import { supabase, isSupabaseConfigured } from './supabaseClient';

export const bookingService = {
  // Real payment path — creates a Razorpay order + a 'pending' booking
  // server-side (the database prices it from the event's ticket types via
  // booking_quote(), migration 0026; nothing about the amount is
  // trusted from this call). Requires a real Supabase session: the Edge
  // Function verifies the caller's JWT.
  createPaymentOrder: async ({ eventId, quantity, tierId, attendeeName, attendeeEmail, attendeePhone, attendeeNames, details }) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Payment is not available right now — please try again shortly.' };
    }
    const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
      body: { eventId, quantity, tierId, attendeeName, attendeeEmail, attendeePhone, attendeeNames, details },
    });
    if (error) {
      // A 4xx from the function carries a user-safe reason in its JSON body
      // (e.g. "Enter a valid email address."); show that, not the SDK's
      // generic "non-2xx status code".
      const body = await error.context?.json?.().catch(() => null);
      return { success: false, error: body?.error || 'Could not start payment.' };
    }
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
    if (error) {
      // 409 + review: the payment arrived but can't be honoured automatically
      // (e.g. the checkout hold lapsed and the seats went to someone else) —
      // finance has been alerted; show the server's explanation.
      const body = await error.context?.json?.().catch(() => null);
      return { success: false, review: !!body?.review, error: body?.error || 'Could not verify payment.' };
    }
    if (data?.error) return { success: false, error: data.error };
    return { success: true, booking: data.booking, tickets: data.tickets || [] };
  },

  // Best-effort — fired right after a successful verifyPayment so the
  // buyer gets their ticket email immediately. Idempotent server-side
  // (bookings.ticket_email_status), so a retry here never double-sends. If
  // this never runs at all (browser closed before it fires), the booking is
  // still fully confirmed with real tickets — an admin can trigger this
  // same call later as a resend (Bookings & Payments → booking drawer, src/admin/components/Bookings.jsx).
  sendTicketEmail: async (bookingId, { force = false } = {}) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Not configured.' };
    const { data, error } = await supabase.functions.invoke('send-ticket-email', {
      body: { booking_id: bookingId, force },
    });
    if (error) return { success: false, error: error.message || 'Could not send ticket email.' };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, alreadySent: !!data?.already_sent };
  },

  // The signed-in person's bookings (RLS returns only their own), newest
  // first. Resolves to an array — empty means "no bookings"; rejects with a
  // user-safe Error when the request fails or Supabase isn't configured, so
  // callers can tell the two apart.
  getMyBookings: async (userId) => {
    if (!isSupabaseConfigured) throw new Error('Bookings are not available right now — please try again shortly.');
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(name, event_date, event_time, venue, image_url), tickets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Tangy] Failed to load bookings:', error.message);
      throw new Error('Could not load your bookings. Please try again.', { cause: error });
    }
    return data || [];
  },
};
