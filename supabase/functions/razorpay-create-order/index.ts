// Creates a Razorpay order server-side and a matching `bookings` row in
// status 'pending'. The amount is ALWAYS computed here from the event's own
// price in the database — never accepted from the client — so a tampered
// frontend request can change the quantity but never the unit price.
//
// Required Edge Function secrets (set via `supabase secrets set`):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected
// automatically by the Supabase runtime — do not set them yourself.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TS-${code}`;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller's real Supabase session — this function requires a
    // real authenticated account regardless of the app's global AUTH_MODE.
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: 'Sign in required.' }, 401);
    }
    const user = userData.user;

    const body = await req.json();
    const { eventId, quantity, tierId, attendeeName, attendeeEmail, attendeePhone } = body ?? {};

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return json({ error: 'Ticket quantity must be between 1 and 10.' }, 400);
    }
    if (!eventId || !attendeeName || !attendeeEmail) {
      return json({ error: 'Missing required booking details.' }, 400);
    }
    // Must match BookingPage.jsx's ticketTiers exactly — that's the only
    // other place ticket pricing is defined. If the tiers there ever change,
    // update this map too; a mismatch would mean either overcharging or
    // undercharging relative to what the UI advertised.
    const TIER_MARKUP_RUPEES = { gen: 0, vip: 500, premium: 1200 };
    if (!Object.prototype.hasOwnProperty.call(TIER_MARKUP_RUPEES, tierId)) {
      return json({ error: 'Invalid ticket tier.' }, 400);
    }

    // Service-role client: bypasses RLS deliberately, only after we've
    // verified the caller's identity above. Used to read the authoritative
    // price and to insert the pending booking on the user's behalf.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: event, error: eventError } = await admin
      .from('events')
      .select('id, price, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return json({ error: 'Event not found.' }, 404);
    }
    if (event.status !== 'on-sale') {
      return json({ error: 'This session is not currently on sale.' }, 409);
    }

    const unitAmountRupees = event.price + TIER_MARKUP_RUPEES[tierId];
    const subtotalRupees = unitAmountRupees * qty;
    const taxesRupees = Math.round(subtotalRupees * 0.18);
    const totalAmountRupees = subtotalRupees + taxesRupees;
    const totalAmountPaise = totalAmountRupees * 100;

    const registrationCode = generateRegistrationCode();

    // create_pending_booking() takes a row lock on the event and checks
    // capacity (confirmed + already-pending quantity) BEFORE inserting —
    // this is the actual overselling protection, not the event.status check
    // above. A concurrent buyer racing for the last seats serializes here
    // instead of both succeeding. Deliberately called before ever hitting
    // Razorpay's API, so a sold-out event never wastes a real order.
    // .rpc() on a function returning a single row (not setof) returns that
    // row directly in `data`, not an array.
    const { data: booking, error: bookingError } = await admin.rpc('create_pending_booking', {
      p_user_id: user.id,
      p_event_id: eventId,
      p_registration_code: registrationCode,
      p_attendee_name: attendeeName,
      p_attendee_email: attendeeEmail,
      p_attendee_phone: attendeePhone ?? null,
      p_quantity: qty,
      p_amount: totalAmountRupees,
      p_tier: tierId,
      p_razorpay_order_id: null,
    });

    if (bookingError) {
      if (bookingError.message?.includes('SOLD_OUT')) {
        return json({ error: 'Not enough tickets remain for this session.' }, 409);
      }
      console.error('Booking insert failed', bookingError);
      return json({ error: 'Could not record booking.' }, 500);
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalAmountPaise,
        currency: 'INR',
        receipt: registrationCode,
        notes: { event_id: eventId, user_id: user.id },
      }),
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      console.error('Razorpay order creation failed', errBody);
      // Release the capacity this booking was holding — a 'failed' booking
      // no longer counts against create_pending_booking's capacity check.
      await admin.from('bookings').update({ status: 'failed' }).eq('id', booking.id);
      return json({ error: 'Could not create payment order.' }, 502);
    }
    const order = await orderRes.json();

    const { error: attachError } = await admin
      .from('bookings')
      .update({ razorpay_order_id: order.id })
      .eq('id', booking.id);
    if (attachError) {
      console.error('Could not attach order id to booking', attachError);
      return json({ error: 'Could not record booking.' }, 500);
    }

    return json({
      order_id: order.id,
      amount: totalAmountPaise,
      currency: 'INR',
      key_id: razorpayKeyId,
      booking_id: booking.id,
    });
  } catch (err) {
    console.error('razorpay-create-order error', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
