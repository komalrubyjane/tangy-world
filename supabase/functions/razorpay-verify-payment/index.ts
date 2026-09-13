// Verifies a Razorpay checkout signature server-side and only THEN marks the
// booking confirmed. A booking is never confirmed on the strength of a
// frontend "payment succeeded" callback alone — the HMAC signature proves
// the payment actually happened, computed only from the order id + payment
// id using the secret key, which never leaves this function.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

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
    if (booking.status === 'confirmed' && booking.razorpay_signature_verified) {
      return json({ success: true, booking }); // already verified — idempotent
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expectedSignature = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);

    if (expectedSignature !== razorpay_signature) {
      return json({ error: 'Payment signature verification failed.' }, 400);
    }

    const { data: updated, error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'confirmed',
        razorpay_payment_id,
        razorpay_signature_verified: true,
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      console.error('Booking confirm update failed', updateError);
      return json({ error: 'Could not confirm booking.' }, 500);
    }

    return json({ success: true, booking: updated });
  } catch (err) {
    console.error('razorpay-verify-payment error', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
