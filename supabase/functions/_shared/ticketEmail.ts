// The ticket email — one place for every sender:
//   * send-ticket-email (browser fallback, admin "Resend")
//   * send-notification-emails (the email_outbox drain), for the row that
//     razorpay-webhook / razorpay-verify-payment queue once settle_payment has
//     confirmed a booking — so the email does not depend on the browser.
//
// Exactly-once queueing: one email_outbox row per booking, keyed by the
// unique dedupe_key below; duplicate webhook deliveries and the browser path
// all hit the same key. Delivery state is mirrored on
// bookings.ticket_email_status (pending / sent / failed) for the admin.
//
// Recipient: the booking owner's account email (profiles.email), never the
// typed attendee_email. No address or payment detail is ever logged here.
import QRCode from 'https://esm.sh/qrcode@1.5.4';
import type { EmailAttachment } from './email.ts';

export const TICKET_EMAIL_TYPE = 'ticket.confirmed';
export const ticketDedupeKey = (bookingId: string) => `${TICKET_EMAIL_TYPE}:${bookingId}`;

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

export type TicketEmail = { to: string; subject: string; html: string; attachments: EmailAttachment[] };

// Builds the email for a confirmed booking from the database (never from the
// request). Returns { email } or { problem } with a reason safe to store.
// deno-lint-ignore no-explicit-any
export async function buildTicketEmail(admin: any, booking: any): Promise<{ email?: TicketEmail; problem?: string }> {
  if (booking.status !== 'confirmed') return { problem: 'Booking is not confirmed.' };
  const { data: tickets } = await admin.from('tickets').select('*').eq('booking_id', booking.id).order('ticket_number');
  if (!tickets || tickets.length === 0) return { problem: 'No tickets issued for this booking yet.' };
  const { data: event } = await admin.from('events').select('name, event_date, event_time, venue').eq('id', booking.event_id).maybeSingle();
  const { data: profile } = await admin.from('profiles').select('email, full_name').eq('id', booking.user_id).maybeSingle();
  if (!profile?.email) return { problem: 'No linked account email on file.' };
  // One opaque booking QR (0023) — no ids, names or contact details inside.
  const dataUrl: string = await QRCode.toDataURL(`TANGY:BOOKING:${booking.group_token}`, { width: 320, margin: 2, color: { dark: '#11100C', light: '#E7D5A4' } });
  return {
    email: {
      to: profile.email,
      subject: `Your Tangy Sessions tickets — ${event?.name || booking.registration_code}`,
      html: emailHtml({ attendeeName: profile.full_name || booking.attendee_name || 'there', event, booking, tickets }),
      attachments: [{ filename: 'booking-pass.png', content: dataUrl.split(',')[1] }],
    },
  };
}

// deno-lint-ignore no-explicit-any
export async function markTicketEmail(admin: any, bookingId: string, ok: boolean, error?: string) {
  await admin.from('bookings').update(ok
    ? { ticket_email_status: 'sent', ticket_email_sent_at: new Date().toISOString(), ticket_email_error: null }
    : { ticket_email_status: 'failed', ticket_email_error: error || 'Email delivery failed.' }).eq('id', bookingId);
}

// Queues the ticket email for a booking settle_payment has confirmed. Safe to
// call any number of times: the unique dedupe_key admits one row per booking.
// Returns { ok: false } only when queueing should be retried.
// deno-lint-ignore no-explicit-any
export async function enqueueTicketEmail(admin: any, bookingId: string): Promise<{ ok: boolean; queued?: boolean; reason?: string }> {
  const { data: booking, error } = await admin.from('bookings')
    .select('id, status, user_id, registration_code, ticket_email_status').eq('id', bookingId).maybeSingle();
  if (error) return { ok: false, reason: 'booking could not be read' };
  if (!booking || booking.status !== 'confirmed') return { ok: true, queued: false, reason: 'not confirmed' };
  if (booking.ticket_email_status === 'sent') return { ok: true, queued: false, reason: 'already sent' };
  const { data: profile, error: profileError } = await admin.from('profiles').select('email').eq('id', booking.user_id).maybeSingle();
  if (profileError) return { ok: false, reason: 'account could not be read' };
  if (!profile?.email) {
    await markTicketEmail(admin, booking.id, false, 'No linked account email on file.');
    return { ok: true, queued: false, reason: 'no account email' };
  }
  const { error: insertError } = await admin.from('email_outbox').insert({
    user_id: booking.user_id,
    to_email: profile.email,
    notification_type: TICKET_EMAIL_TYPE,
    subject: `Your Tangy Sessions tickets — ${booking.registration_code}`,
    body: null,
    link: null,
    dedupe_key: ticketDedupeKey(booking.id),
  });
  if (insertError && insertError.code !== '23505') return { ok: false, reason: 'outbox insert failed' };
  return { ok: true, queued: !insertError };
}
