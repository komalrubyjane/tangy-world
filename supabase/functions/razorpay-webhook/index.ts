// Razorpay calls this directly (no user session, no CORS relevance) whenever
// a payment event happens — this is the source of truth for payment status,
// independent of whether the client's own razorpay-verify-payment call ever
// ran (browser closed mid-checkout, network drop after a successful charge,
// etc.). Configure this URL + a webhook secret in the Razorpay dashboard
// (Settings -> Webhooks), and set that same secret here as
// RAZORPAY_WEBHOOK_SECRET (this is a DIFFERENT secret from RAZORPAY_KEY_SECRET).
//
// Idempotency: Razorpay explicitly documents that the same webhook event can
// be delivered more than once, so every event is recorded in
// payment_webhook_events keyed by a unique id before being acted on.
//
// NOTE: verify `event_id` extraction and the exact event names below
// (`payment.captured` / `order.paid` / `payment.failed`) against the current
// Razorpay webhook payload reference before going live — confirm in the
// Razorpay dashboard under Settings -> Webhooks -> your webhook -> recent
// deliveries. In particular, confirm `payload.payment.entity.order_id` is
// actually present on a `payment.failed` event the same way it is on
// `payment.captured` — this was not verified against a live payload.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('X-Razorpay-Signature') ?? '';
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

    const expectedSignature = await hmacSha256Hex(webhookSecret, rawBody);
    if (expectedSignature !== signatureHeader) {
      console.error('razorpay-webhook: signature mismatch');
      return new Response('Invalid signature', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const eventId: string | undefined = paymentEntity?.id ? `${eventType}:${paymentEntity.id}` : undefined;

    if (!eventId) {
      // Nothing stable to dedupe on — log and accept so Razorpay doesn't retry forever.
      console.warn('razorpay-webhook: no stable event id, skipping', eventType);
      return new Response('ok', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await admin.from('payment_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      payload,
      processed: false,
    });

    if (insertError) {
      // Unique violation on event_id means we've already seen this event.
      if (insertError.code === '23505') {
        return new Response('ok (duplicate)', { status: 200 });
      }
      console.error('razorpay-webhook: failed to record event', insertError);
      return new Response('ok', { status: 200 }); // don't make Razorpay retry forever on our DB hiccup
    }

    const orderId = paymentEntity?.order_id ?? orderEntity?.id;
    if ((eventType === 'payment.captured' || eventType === 'order.paid') && orderId) {
      const { data: confirmedBookings, error: updateError } = await admin
        .from('bookings')
        .update({
          status: 'confirmed',
          razorpay_payment_id: paymentEntity?.id ?? null,
          razorpay_signature_verified: true,
        })
        .eq('razorpay_order_id', orderId)
        .neq('status', 'confirmed')
        .select('id');

      if (updateError) {
        console.error('razorpay-webhook: booking update failed', updateError);
      } else {
        // This is the authoritative confirmation path — independent of
        // whether the client's own razorpay-verify-payment call ever ran
        // (browser closed, network drop). confirm_booking_and_issue_tickets
        // is idempotent, so it's safe even if verify-payment already issued
        // these same tickets, and safe against this same webhook retrying.
        for (const b of confirmedBookings ?? []) {
          const { error: ticketError } = await admin.rpc('confirm_booking_and_issue_tickets', { p_booking_id: b.id });
          if (ticketError) console.error('razorpay-webhook: ticket issuance failed', b.id, ticketError);
        }
      }
    } else if (eventType === 'payment.failed' && orderId) {
      const { error: failError } = await admin
        .from('bookings')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', orderId)
        .eq('status', 'pending'); // never overwrite an already-confirmed booking

      if (failError) console.error('razorpay-webhook: booking fail-update failed', failError);
    }

    await admin.from('payment_webhook_events').update({ processed: true }).eq('event_id', eventId);

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('razorpay-webhook error', err);
    return new Response('ok', { status: 200 });
  }
});
