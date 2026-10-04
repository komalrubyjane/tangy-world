// Sends the ticket confirmation email after a booking is confirmed and its
// tickets have been issued (confirm_booking_and_issue_tickets in
// 0016_payments_tickets_checkin.sql), via _shared/email.ts (email secrets
// never leave the server). Mirrors send-approval-email's auth-client/admin-client split —
// see that function for the established pattern this follows.
//
// Called by the client (src/lib/bookingService.js) right after
// razorpay-verify-payment succeeds. Re-verifies everything server-side
// rather than trusting the request: re-fetches the booking, its tickets,
// and the event from the database, and never sends unless the booking is
// actually status='confirmed'. Idempotent via bookings.ticket_email_status
// (0016_payments_tickets_checkin.sql) — calling this twice for the same
// booking cannot double-send. Pass `force: true` to explicitly resend (the
// admin "RESEND EMAIL" action).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import QRCode from 'https://esm.sh/qrcode@1.5.4';
import { handleOptions, jsonResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';

const TIER_LABELS: Record<string, string> = { gen: 'General Admission', vip: 'VIP Heritage Pass', premium: 'Backstage Collective Pass' };

function fmtDate(d: string | null): string {
  if (!d) return '—';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function emailHtml({ attendeeName, event, booking, tickets }: { attendeeName: string; event: any; booking: any; tickets: any[] }) {
  const safeName = String(attendeeName).replace(/</g, '&lt;');
  const tierLabel = TIER_LABELS[booking.tier] || booking.tier || 'General Admission';
  // The booking's ONE QR (0023) is attached as booking-pass.png, not embedded
  // inline — CID inline-image embedding support varies by email
  // provider/client and wasn't something that could be verified live, so
  // this degrades safely to "open the attachment" everywhere rather than
  // risking a broken inline image in some clients. Attendee names are
  // user-entered, so they are escaped.
  const esc = (v: string) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ticketRows = tickets.map((t: any, i: number) => `
    <tr>
      <td style="padding:8px 0;border-top:1px dashed rgba(17,16,12,0.3);font-family:Courier,monospace;font-size:12px;color:#11100C;">
        ${i + 1}. <strong>${esc(t.attendee_name || `Guest ${i + 1}`)}</strong> <span style="opacity:0.6;">· ${t.ticket_number}</span>
      </td>
    </tr>`).join('');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#11100C;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#11100C;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background-color:#EDE0C0;border:4px solid #11100C;">
            <tr>
              <td style="padding:28px 32px 16px 32px;border-bottom:2px solid #11100C;">
                <p style="margin:0;font-family:Courier,monospace;font-size:11px;font-weight:bold;letter-spacing:3px;color:#8B2E00;text-transform:uppercase;">✦ TANGY SESSIONS</p>
                <h1 style="margin:6px 0 0 0;font-size:26px;color:#11100C;text-transform:uppercase;">Your Tickets Are Confirmed</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;color:#11100C;">
                <p style="margin:0 0 14px 0;font-size:15px;">Hi ${safeName},</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;">Your booking for <strong>${event?.name || 'the session'}</strong> is confirmed.</p>

                <table role="presentation" width="100%" style="background-color:#F5E9C9;border:2px solid #11100C;margin-bottom:18px;">
                  <tr><td style="padding:16px;font-family:Courier,monospace;font-size:12px;color:#11100C;">
                    <div><strong>Event:</strong> ${event?.name || '—'}</div>
                    <div><strong>Date:</strong> ${fmtDate(event?.event_date)} ${event?.event_time || ''}</div>
                    <div><strong>Venue:</strong> ${event?.venue || '—'}</div>
                    <div><strong>Tier:</strong> ${tierLabel}</div>
                    <div><strong>Quantity:</strong> ${booking.quantity}</div>
                    <div><strong>Booking reference:</strong> ${booking.registration_code}</div>
                    <div><strong>Amount paid:</strong> ₹${booking.amount}</div>
                  </td></tr>
                </table>

                <table role="presentation" width="100%">${ticketRows}</table>

                <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#4A2E1A;">
                  Show the attached QR (booking-pass.png) at the entrance — one QR for everyone on this booking; staff check each person in by name, even if you arrive separately. It's always available in your Tangy Dashboard too.
                </p>
                <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#4A2E1A;">See you inside,<br />Tangy Sessions</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

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

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Sign in required.' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { booking_id, force } = await req.json();
    if (!booking_id) return json({ error: 'Missing booking_id.' }, 400);

    const { data: booking, error: bookingError } = await admin.from('bookings').select('*').eq('id', booking_id).single();
    if (bookingError || !booking) return json({ error: 'Booking not found.' }, 404);

    // Only the booking's own owner, or an admin (for the resend action), may trigger this.
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single();
    const isOwner = booking.user_id === userData.user.id;
    const isAdmin = callerProfile && ['staff', 'admin', 'super_admin'].includes(callerProfile.role);
    if (!isOwner && !isAdmin) return json({ error: 'Not authorized for this booking.' }, 403);

    if (booking.status !== 'confirmed') {
      return json({ error: 'Booking is not confirmed yet — no ticket email to send.' }, 409);
    }

    if (booking.ticket_email_status === 'sent' && !force) {
      return json({ success: true, already_sent: true });
    }

    const { data: tickets } = await admin.from('tickets').select('*').eq('booking_id', booking_id).order('ticket_number');
    if (!tickets || tickets.length === 0) {
      return json({ error: 'No tickets issued for this booking yet.' }, 409);
    }

    const { data: event } = await admin.from('events').select('name, event_date, event_time, venue').eq('id', booking.event_id).maybeSingle();

    // Trusted recipient: the AUTHENTICATED account's email, never the
    // (user-typed, unverified) attendee_email column on the booking itself.
    const { data: profile } = await admin.from('profiles').select('email, full_name').eq('id', booking.user_id).maybeSingle();
    const recipientEmail = profile?.email;
    const recipientName = profile?.full_name || booking.attendee_name || 'there';

    if (!recipientEmail) {
      await admin.from('bookings').update({ ticket_email_status: 'failed', ticket_email_error: 'No linked account email on file.' }).eq('id', booking_id);
      return json({ success: false, error: 'No linked account email on file.' });
    }

    // One opaque booking QR (0023) — no ids, names or contact details inside.
    const dataUrl: string = await QRCode.toDataURL(`TANGY:BOOKING:${booking.group_token}`, { width: 320, margin: 2, color: { dark: '#11100C', light: '#E7D5A4' } });
    const attachments = [{ filename: 'booking-pass.png', content: dataUrl.split(',')[1] }];

    const html = emailHtml({ attendeeName: recipientName, event, booking, tickets });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Your Tangy Sessions tickets — ${event?.name || booking.registration_code}`,
      html,
      attachments,
    });
    const sendOk = result.ok;
    const sendError = result.error ?? '';

    if (sendOk) {
      await admin.from('bookings').update({ ticket_email_status: 'sent', ticket_email_sent_at: new Date().toISOString(), ticket_email_error: null }).eq('id', booking_id);
      return json({ success: true });
    }

    // The booking's payment/ticket confirmation is NOT touched here — only
    // the email delivery state reflects the failure, so an admin can see it
    // and retry without re-running payment verification.
    await admin.from('bookings').update({ ticket_email_status: 'failed', ticket_email_error: sendError || 'Unknown delivery failure.' }).eq('id', booking_id);
    return json({ success: false, error: sendError || 'Email delivery failed.' });
  } catch (err) {
    console.error('send-ticket-email error', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});
