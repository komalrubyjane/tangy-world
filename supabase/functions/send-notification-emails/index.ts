// Drains email_outbox (0020_platform_finalization.sql) — the queue that
// notify() fills according to each user's notification preferences.
//
// Server-only: callable with the service-role key (Supabase Cron / pg_net)
// or with the CRON_SECRET header. It never accepts an end-user session, so a
// signed-in user cannot trigger or read anyone's email. Delivery goes through
// the shared provider module (Resend in production). Without a configured
// provider the queue is left as is.
//
// Rows are claimed with FOR UPDATE SKIP LOCKED (claim_email_batch), so two
// concurrent runs never send the same email; failures are retried up to 5
// times and then marked 'failed' for the admin to see.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, notificationHtml, emailConfig } from '../_shared/email.ts';
import { TICKET_EMAIL_TYPE, buildTicketEmail, markTicketEmail } from '../_shared/ticketEmail.ts';

const ACTION_LABEL: Record<string, string> = {
  'message.new': 'Read message',
  'booking.requested': 'Review request',
  'requirement.requested': 'Respond',
  'requirement.reviewed': 'View feedback',
  'requirement.submitted': 'Review response',
  'event.reminder': 'View event',
  'schedule.changed': 'View schedule',
  'document.added': 'Open documents',
  'access.granted': 'Open check-in',
  'application.new': 'Review application',
  'access.requested': 'Review request',
  'payment.late': 'Review booking',
  'payment.review': 'Review payment',
  'payment.webhook_failed': 'Open bookings',
  'application.received': 'View your profile',
  'enquiry.new': 'Open inbox',
  'waitlist.joined': 'View session',
  'waitlist.offer': 'Book your seats',
  'waitlist.offer_expired': 'View session',
  'waitlist.converted': 'View booking',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const cronSecret = Deno.env.get('CRON_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  const allowed = auth === `Bearer ${serviceRoleKey}` || (cronSecret && req.headers.get('x-cron-secret') === cronSecret);
  if (!allowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // No provider yet (e.g. RESEND_API_KEY not set): leave the queue untouched
  // so nothing is marked failed; it drains once email is configured.
  if (!emailConfig().configured) {
    return new Response(JSON.stringify({ configured: false, claimed: 0, sent: 0, failed: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://tangysessions.com').replace(/\/$/, '');
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: batch, error } = await admin.rpc('claim_email_batch', { p_limit: 25 });
  if (error) {
    console.error('claim_email_batch failed', error.message);
    return new Response(JSON.stringify({ error: 'Could not read the email queue.' }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of batch ?? []) {
    if (row.notification_type === TICKET_EMAIL_TYPE) {
      // Ticket email queued by the payment functions (_shared/ticketEmail.ts):
      // rendered from the booking now, with the booking QR attached.
      const result = await sendTicketRow(admin, row);
      if (result === 'sent') sent++; else if (result === 'failed') failed++; else skipped++;
      continue;
    }
    const actionUrl = row.link && row.link.startsWith('/') ? `${siteUrl}${row.link}` : null;
    const result = await sendEmail({
      to: row.to_email,
      subject: row.subject,
      html: notificationHtml({ title: row.subject, body: row.body, actionUrl, actionLabel: ACTION_LABEL[row.notification_type] }),
      text: [row.subject, row.body, actionUrl].filter(Boolean).join('\n\n'),
    });
    await admin.rpc('complete_email', { p_id: row.id, p_ok: result.ok, p_error: result.error ?? null });
    if (result.ok) sent++; else failed++;
  }
  return new Response(JSON.stringify({ claimed: batch?.length ?? 0, sent, failed, skipped }), { headers: { 'Content-Type': 'application/json' } });
});

// One queued ticket email. Never touches the booking's payment or tickets —
// only its email delivery state. A failure goes back to the queue (up to 5
// attempts, then 'failed'; the admin can resend from Bookings).
// deno-lint-ignore no-explicit-any
async function sendTicketRow(admin: any, row: any): Promise<'sent' | 'failed' | 'skipped'> {
  const bookingId = String(row.dedupe_key ?? '').slice(TICKET_EMAIL_TYPE.length + 1);
  const { data: booking, error } = await admin.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (error) {
    await admin.rpc('complete_email', { p_id: row.id, p_ok: false, p_error: 'Booking could not be read.' });
    return 'failed';
  }
  const skip = async (reason: string) => {
    await admin.from('email_outbox').update({ status: 'skipped', locked_at: null, last_error: reason }).eq('id', row.id);
    return 'skipped' as const;
  };
  // Already delivered (admin resend or the browser fallback) or no longer confirmed: nothing to send.
  if (!booking) return skip('Booking not found.');
  if (booking.ticket_email_status === 'sent') return skip('Ticket email already sent.');
  if (booking.status !== 'confirmed') return skip('Booking is not confirmed.');

  const { email, problem } = await buildTicketEmail(admin, booking);
  if (!email) {
    await admin.rpc('complete_email', { p_id: row.id, p_ok: false, p_error: problem });
    await markTicketEmail(admin, booking.id, false, problem);
    return 'failed';
  }
  const result = await sendEmail(email);
  await admin.rpc('complete_email', { p_id: row.id, p_ok: result.ok, p_error: result.error ?? null });
  await markTicketEmail(admin, booking.id, result.ok, result.error);
  return result.ok ? 'sent' : 'failed';
}
