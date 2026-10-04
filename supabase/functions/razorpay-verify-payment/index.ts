// Verifies a Razorpay checkout signature server-side and only THEN marks the
// booking confirmed. A booking is never confirmed on the strength of a
// frontend "payment succeeded" callback alone — the HMAC signature proves
// the payment actually happened, computed only from the order id + payment
// id using the secret key, which never leaves this function.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { hmacSha256Hex, timingSafeEqual, requireSecret } from '../_shared/crypto.ts';
import { enqueueTicketEmail } from '../_shared/ticketEmail.ts';

Deno.serve(async (req) => {
  // Answers with this request's origin when it is allowed (_shared/cors.ts).
  const json = (body: unknown, status = 200) => jsonResponse(req, body, status);
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: 'Sign in required.' }, 401);
    }
    const user = userData.user;

    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment verification fields.' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) return json({ error: 'Booking not found.' }, 404);
    if (booking.user_id !== user.id) return json({ error: 'Not your booking.' }, 403);
    if (booking.razorpay_order_id !== razorpay_order_id) return json({ error: 'Order mismatch.' }, 400);
    // Queues the ticket email for the confirmed booking (once per booking);
    // never fails the payment response — the webhook queues it too.
    const queueTicketEmail = async () => {
      const queued = await enqueueTicketEmail(admin, booking_id).catch(() => ({ ok: false, reason: 'exception' }));
      if (!queued.ok) console.error('razorpay-verify-payment: ticket email not queued for booking', booking_id, queued.reason);
    };

    if (booking.status === 'confirmed' && booking.razorpay_signature_verified) {
      // Already verified — idempotent. Tickets were already issued the
      // first time (confirm_booking_and_issue_tickets is itself idempotent
      // too), so just re-fetch and return them rather than re-deriving.
      await queueTicketEmail();
      const { data: tickets } = await admin.from('tickets').select('*').eq('booking_id', booking_id).order('ticket_number');
      return json({ success: true, booking, tickets: tickets || [] });
    }

    const keySecret = requireSecret('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      // Never verify against a missing key (it would become the string "undefined").
      return json({ error: 'Online payment is not available yet.' }, 503);
    }
    const expectedSignature = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);

    if (!timingSafeEqual(expectedSignature, String(razorpay_signature ?? ''))) {
      return json({ error: 'Payment signature verification failed.' }, 400);
    }

    // settle_payment (0026) decides: pending -> confirmed (+ tickets); a
    // late payment is accepted only if the seats are still free; anything
    // else is held for finance review instead of creating an invalid booking.
    const { data: settled, error: settleError } = await admin.rpc('settle_payment', {
      p_order_id: razorpay_order_id, p_payment_id: razorpay_payment_id, p_amount_paise: null, p_source: 'verify',
    });
    if (settleError) {
      console.error('settle_payment failed', settleError.message);
      return json({ error: 'Could not confirm booking — contact support with your payment ID.' }, 500);
    }
    if (settled?.result === 'needs_review') {
      return json({ error: 'We received your payment, but these seats are no longer available. Our team will contact you about a refund or a new seat.', review: true }, 409);
    }
    await queueTicketEmail();
    const { data: confirmed } = await admin.from('bookings').select('*').eq('id', booking_id).single();
    const { data: tickets } = await admin.from('tickets').select('*').eq('booking_id', booking_id).order('ticket_number');
    return json({ success: true, booking: confirmed, tickets: tickets || [] });
  } catch (err) {
    console.error('razorpay-verify-payment error', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});
