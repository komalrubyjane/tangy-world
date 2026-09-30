// Shared email delivery for every Tangy Edge Function. Secrets are read only
// here, server-side.
//
//   EMAIL_PROVIDER   resend (default) | mailpit (local stack) | log | disabled
//   RESEND_API_KEY   required for resend; without it email is "not configured"
//                    and nothing is sent (queued notification emails wait)
//   EMAIL_FROM       sender, e.g. "Tangy Sessions <hello@tangysessions.com>"
//                    (RESEND_FROM_EMAIL is still accepted as the old name)
//   EMAIL_REPLY_TO   optional reply-to address
//   MAILPIT_URL      local only, with EMAIL_PROVIDER=mailpit
//
// `log` prints the recipient and subject (never the body) and reports the
// message as sent — for development only. `disabled` sends nothing.

export type EmailAttachment = { filename: string; content: string }; // base64
export type EmailMessage = { to: string; subject: string; html: string; text?: string; attachments?: EmailAttachment[] };
export type SendResult = { ok: boolean; error?: string; notConfigured?: boolean };

const DEFAULT_FROM = 'Tangy Sessions <hello@tangysessions.com>';

export function emailConfig() {
  const provider = (Deno.env.get('EMAIL_PROVIDER') ?? 'resend').toLowerCase();
  const from = Deno.env.get('EMAIL_FROM') ?? Deno.env.get('RESEND_FROM_EMAIL') ?? DEFAULT_FROM;
  const replyTo = Deno.env.get('EMAIL_REPLY_TO') || undefined;
  const configured = provider === 'mailpit' || provider === 'log' || (provider === 'resend' && !!Deno.env.get('RESEND_API_KEY'));
  return { provider, from, replyTo, configured };
}

export const NOT_CONFIGURED = 'Email is not configured yet.';

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const { provider, from, replyTo, configured } = emailConfig();
  if (!configured) return { ok: false, notConfigured: true, error: NOT_CONFIGURED };
  try {
    if (provider === 'log') {
      console.log(`[email:log] to=${msg.to} subject=${JSON.stringify(msg.subject)} attachments=${msg.attachments?.length ?? 0}`);
      return { ok: true };
    }
    if (provider === 'mailpit') {
      const base = (Deno.env.get('MAILPIT_URL') ?? 'http://host.docker.internal:54324').replace(/\/$/, '');
      const match = from.match(/^(.*)<(.+)>$/);
      const res = await fetch(`${base}/api/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: { Email: match ? match[2].trim() : from, Name: match ? match[1].trim() : '' },
          To: [{ Email: msg.to }],
          ReplyTo: replyTo ? [{ Email: replyTo }] : undefined,
          Subject: msg.subject,
          HTML: msg.html,
          Text: msg.text ?? '',
          Attachments: msg.attachments?.map((a) => ({ Filename: a.filename, Content: a.content })),
        }),
      });
      return res.ok ? { ok: true } : { ok: false, error: `mailpit ${res.status}` };
    }
    if (provider !== 'resend') return { ok: false, notConfigured: true, error: `Unknown EMAIL_PROVIDER "${provider}".` };
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [msg.to], reply_to: replyTo, subject: msg.subject, html: msg.html, text: msg.text, attachments: msg.attachments }),
    });
    if (res.ok) return { ok: true };
    console.error('Resend API error', res.status, await res.text());
    return { ok: false, error: 'Email provider rejected the message.' };
  } catch (err) {
    console.error('email network error', err);
    return { ok: false, error: 'Could not reach email provider.' };
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Tangy-branded notification email (matches send-approval-email's look).
export function notificationHtml({ title, body, actionUrl, actionLabel }: { title: string; body?: string | null; actionUrl?: string | null; actionLabel?: string }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#11100C;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#11100C;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#EDE0C0;border:4px solid #11100C;">
          <tr><td style="padding:24px 32px 12px 32px;border-bottom:2px solid #11100C;">
            <p style="margin:0;font-family:Courier,monospace;font-size:11px;font-weight:bold;letter-spacing:3px;color:#8B2E00;text-transform:uppercase;">✦ TANGY SESSIONS</p>
            <h1 style="margin:6px 0 0 0;font-size:22px;color:#11100C;">${esc(title)}</h1>
          </td></tr>
          <tr><td style="padding:20px 32px;color:#11100C;font-size:14px;line-height:1.6;">
            ${body ? `<p style="margin:0 0 18px 0;">${esc(body)}</p>` : ''}
            ${actionUrl ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#8B2E00;">
              <a href="${esc(actionUrl)}" style="display:inline-block;padding:12px 24px;font-family:Courier,monospace;font-size:12px;font-weight:bold;letter-spacing:2px;color:#E7D5A4;text-decoration:none;text-transform:uppercase;">${esc(actionLabel ?? 'Open in Tangy')} →</a>
            </td></tr></table>` : ''}
          </td></tr>
          <tr><td style="padding:14px 32px 20px 32px;border-top:1px solid rgba(17,16,12,0.2);">
            <p style="margin:0;font-family:Courier,monospace;font-size:9px;color:rgba(17,16,12,0.55);text-transform:uppercase;letter-spacing:1px;">
              You can change which emails you receive in your notification settings.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
