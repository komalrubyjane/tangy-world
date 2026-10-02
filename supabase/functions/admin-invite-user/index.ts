// Invites a console account — Super Admin, Admin / Manager or Staff — from the
// Users & roles page (account_invitations, migration 0030).
//
// The invitation decides the role; the recipient never chooses it. Nothing is
// granted here: the role is applied only when the owner of the invited email
// address signs in and accepts at /invitation (accept_account_invitation).
//
// Security: everything runs under the caller's own JWT — no service role key.
// create_account_invitation() checks in Postgres who may invite which role
// (Super Admin / Admin need roles.manage; Staff need staff.invite), stores
// only the SHA-256 hash of the token, and audits the invite.
//
// The token is 32 random bytes, sent only inside the link (in the URL
// fragment, so it never reaches a server log). If email can't be sent, the
// response says so honestly and returns the link once so the inviter can
// deliver it another way; it is never reported as sent.
//
// Secrets: SITE_URL (the public site, for the link). SUPABASE_URL /
// SUPABASE_ANON_KEY are injected automatically. Email: see _shared/email.ts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsFor, handleOptions } from '../_shared/cors.ts';
import { sendEmail, notificationHtml } from '../_shared/email.ts';

const INVITABLE_ROLES = ['staff', 'admin', 'super_admin'];
const ROLE_LABEL: Record<string, string> = { staff: 'Staff', admin: 'Admin / Manager', super_admin: 'Super Admin' };

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsFor(req), 'Content-Type': 'application/json' } });

  try {
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');
    if (!siteUrl) return json({ error: 'SITE_URL is not configured, so an invitation link cannot be built.' }, 503);

    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Sign in required.' }, 401);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const fullName = String(body?.full_name ?? '').trim().slice(0, 120);
    const role = String(body?.role ?? '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ error: 'Enter a valid email address.' }, 400);
    if (!fullName) return json({ error: 'Full name is required.' }, 400);
    if (!INVITABLE_ROLES.includes(role)) return json({ error: 'Invalid role.' }, 400);

    const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))));

    const { data: invitation, error: inviteError } = await caller.rpc('create_account_invitation', {
      p_email: email, p_full_name: fullName, p_role: role, p_token_hash: tokenHash,
    });
    if (inviteError) {
      // 42501 = the database refused the inviter's permission.
      return json({ error: inviteError.message || 'Could not create the invitation.' }, inviteError.code === '42501' ? 403 : 400);
    }

    const link = `${siteUrl}/invitation#token=${token}`;
    const inviter = userData.user.email ?? 'A Tangy admin';
    const expires = new Date(invitation.expires_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
    const sent = await sendEmail({
      to: email,
      subject: `You're invited to Tangy Sessions as ${ROLE_LABEL[role]}`,
      html: notificationHtml({
        title: `Join the Tangy team as ${ROLE_LABEL[role]}`,
        body: `${inviter} invited you to the Tangy Sessions console as ${ROLE_LABEL[role]}. Open the link, sign in with this email address (${email}) and accept. The link works once and expires ${expires} IST. If you weren't expecting this, ignore this email.`,
        actionUrl: link,
        actionLabel: 'Accept invitation',
      }),
      text: `${inviter} invited you to Tangy Sessions as ${ROLE_LABEL[role]}.\nAccept (sign in as ${email}): ${link}\nThe link works once and expires ${expires} IST.`,
    });
    const emailStatus = sent.ok ? 'sent' : sent.notConfigured ? 'not_configured' : 'failed';
    await caller.rpc('set_invitation_email_status', { p_id: invitation.id, p_status: emailStatus });

    return json({
      ok: true,
      invitation_id: invitation.id,
      expires_at: invitation.expires_at,
      existing_account: invitation.existing_account,
      email_status: emailStatus,
      ...(sent.ok ? {} : { email_error: sent.error, invite_url: link }),
    });
  } catch {
    return json({ error: 'Something went wrong.' }, 500);
  }
});
