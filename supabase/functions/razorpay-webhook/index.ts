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
// `payment.captured` — this was not verified against a live payload. The
// same applies to `payment.authorized` and `refund.processed` (amounts are in
// paise; `payment.entity.amount_refunded` is used when present).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hmacSha256Hex, timingSafeEqual, requireSecret } from '../_shared/crypto.ts';


Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('X-Razorpay-Signature') ?? '';
    const webhookSecret = requireSecret('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      // Without the secret nothing can be verified — refuse rather than accept.
      console.error('razorpay-webhook: RAZORPAY_WEBHOOK_SECRET is not configured');
      return new Response('Webhook not configured', { status: 503 });
    }

    const expectedSignature = await hmacSha256Hex(webhookSecret, rawBody);
    if (!timingSafeEqual(expectedSignature, signatureHeader)) {
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
    const refundEntity = payload.payload?.refund?.entity;
    const now = new Date().toISOString();
    const failures: string[] = [];

    if ((eventType === 'payment.captured' || eventType === 'order.paid') && orderId) {
      // settle_payment (0026) is the only place a paid booking is confirmed:
      // it locks the event + booking, confirms pending holds, accepts late
      // payments only if the seats are still free, never re-confirms a
      // cancelled booking, checks the amount, and holds anything else for
      // finance review. Idempotent, so Razorpay retries are safe.
      const amountPaise = typeof paymentEntity?.amount === 'number' ? paymentEntity.amount : null;
      const { data: settled, error: settleError } = await admin.rpc('settle_payment', {
        p_order_id: orderId, p_payment_id: paymentEntity?.id ?? `${eventType}:${orderId}`, p_amount_paise: amountPaise, p_source: 'webhook',
      });
      if (settleError) failures.push(`settlement failed: ${settleError.message}`);
      else if (settled?.result === 'not_found') failures.push(`no booking for order ${orderId}`);
    } else if (eventType === 'payment.authorized' && orderId) {
      const { error } = await admin.from('bookings')
        .update({ payment_status: 'authorized', payment_updated_at: now })
        .eq('razorpay_order_id', orderId).eq('payment_status', 'created');
      if (error) failures.push(`authorize update failed: ${error.message}`);
    } else if (eventType === 'payment.failed' && orderId) {
      const { error: failError } = await admin
        .from('bookings')
        .update({ status: 'failed', payment_status: 'failed', payment_updated_at: now })
        .eq('razorpay_order_id', orderId)
        .eq('status', 'pending'); // never overwrite an already-confirmed booking

      if (failError) failures.push(`booking fail-update failed: ${failError.message}`);
    } else if ((eventType === 'refund.processed' || eventType === 'refund.created') && (refundEntity?.payment_id || paymentEntity?.id)) {
      // Refunds are issued manually in the Razorpay dashboard. This only
      // mirrors the refunded amount onto the booking for reporting; the
      // booking's status changes when an admin records the refund.
      const paymentId = refundEntity?.payment_id ?? paymentEntity?.id;
      const refunded = Number(paymentEntity?.amount_refunded ?? refundEntity?.amount ?? 0);
      const total = Number(paymentEntity?.amount ?? 0);
      const { error } = await admin.from('bookings')
        .update({
          refunded_amount: Math.round(refunded / 100),
          payment_status: total > 0 && refunded < total ? 'partially_refunded' : 'refunded',
          payment_updated_at: now,
        })
        .eq('razorpay_payment_id', paymentId);
      if (error) failures.push(`refund mirror failed: ${error.message}`);
    }

    if (failures.length) {
      console.error('razorpay-webhook: processing failed', eventId, failures);
      // Stored on the event + alerts payments.view holders; Razorpay gets 200
      // because the event is already recorded (a retry would be a duplicate).
      await admin.rpc('record_webhook_failure', { p_event_id: eventId, p_error: failures.join('; ') });
    } else {
      await admin.from('payment_webhook_events').update({ processed: true, processed_at: now }).eq('event_id', eventId);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('razorpay-webhook error', err);
    return new Response('ok', { status: 200 });
  }
});
