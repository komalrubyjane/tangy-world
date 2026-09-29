// Creates (invites) a console account — staff, admin or super_admin — for the
// Users & Roles page. Creating an auth user needs the service role key, so it
// can't happen in the browser.
//
// Security: the caller's own JWT is verified, and has_permission('users.manage')
// is evaluated in Postgres UNDER THAT JWT (not the service role), so only an
// active Super Admin can invite. The role is written with the service-role
// client (the role-change guard allows server-side writes), and the invite is
// audited via log_user_invited() — also under the caller's JWT, so the audit
// row names the real actor.
//
// If the email already has an account (e.g. a patron), no second account is
// created: the existing profile's role is updated instead and `existing: true`
// is returned.
//
// Secrets: SITE_URL (optional, for the invite redirect). SUPABASE_URL /
// SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const INVITABLE_ROLES = ['staff', 'admin', 'super_admin'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Sign in required.' }, 401);

    const { data: allowed, error: permError } = await caller.rpc('has_permission', { p_permission: 'users.manage' });
    if (permError || allowed !== true) return json({ error: 'Only a Super Admin can invite users.' }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const fullName = String(body?.full_name ?? '').trim().slice(0, 120);
    const role = String(body?.role ?? '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ error: 'Enter a valid email address.' }, 400);
    if (!fullName) return json({ error: 'Full name is required.' }, 400);
    if (!INVITABLE_ROLES.includes(role)) return json({ error: 'Invalid role.' }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    let userId: string | null = null;
    let existing = false;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: siteUrl ? `${siteUrl}/admin` : undefined,
    });
    if (inviteError) {
      // Already registered → reuse that account rather than failing.
      const { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
      if (!profile) return json({ error: 'Could not invite this email address.' }, 400);
      userId = profile.id;
      existing = true;
    } else {
      userId = invited.user?.id ?? null;
    }
    if (!userId) return json({ error: 'Could not invite this email address.' }, 500);

    // handle_new_user() creates the profile row on auth.users insert.
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (existing && target?.role === 'super_admin' && role !== 'super_admin') {
      return json({ error: 'That account is a Super Admin — change its role from Users & Roles instead.' }, 409);
    }
    const { error: updateError } = await admin.from('profiles')
      .update({ role, is_active: true, ...(existing ? {} : { full_name: fullName }) })
      .eq('id', userId);
    if (updateError) return json({ error: 'Account created, but the role could not be set.' }, 500);

    await caller.rpc('log_user_invited', { p_user_id: userId, p_email: email, p_role: role, p_existing: existing });

    return json({ ok: true, user_id: userId, existing });
  } catch {
    return json({ error: 'Something went wrong.' }, 500);
  }
});
