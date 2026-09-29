// Drains email_outbox (0020_platform_finalization.sql) — the queue that
// notify() fills according to each user's notification preferences.
//
// Server-only: callable with the service-role key (Supabase Cron / pg_net)
// or with the CRON_SECRET header. It never accepts an end-user session, so a
// signed-in user cannot trigger or read anyone's email. Delivery goes through
// the shared provider module (Resend in production).
//
// Rows are claimed with FOR UPDATE SKIP LOCKED (claim_email_batch), so two
// concurrent runs never send the same email; failures are retried up to 5
// times and then marked 'failed' for the admin to see.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, notificationHtml } from '../_shared/email.ts';

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
  'payment.webhook_failed': 'Open bookings',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const cronSecret = Deno.env.get('CRON_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  const allowed = auth === `Bearer ${serviceRoleKey}` || (cronSecret && req.headers.get('x-cron-secret') === cronSecret);
  if (!allowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://tangysessions.com').replace(/\/$/, '');
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: batch, error } = await admin.rpc('claim_email_batch', { p_limit: 25 });
  if (error) {
    console.error('claim_email_batch failed', error.message);
    return new Response(JSON.stringify({ error: 'Could not read the email queue.' }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  for (const row of batch ?? []) {
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
  return new Response(JSON.stringify({ claimed: batch?.length ?? 0, sent, failed }), { headers: { 'Content-Type': 'application/json' } });
});
