// Account invitations (0030) and event-scoped volunteer applications.
//
//   * A Super Admin invites a Super Admin from Users & roles; the email link
//     (Mailpit) opens /invitation, the recipient signs in as the invited
//     address and accepts; only then does the account become Super Admin.
//   * The link is single-use; another account can't use it; a revoked link
//     stops working; an Admin / Manager can invite Staff only.
//   * A staff member applies to volunteer at one session; approval adds them
//     to that session's volunteer team and keeps the staff role.
import { execFileSync } from 'node:child_process';
import { launch, otpLogin, latestCode, check, api, shot, BASE } from './lib.mjs';

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const MAIL = 'http://127.0.0.1:54324';
const SUPER_INVITEE = 'invitee-super@tangy.test';
const STAFF_INVITEE = 'invitee-staff@tangy.test';

// The invitation email's link, pointed at this dev server.
async function inviteLink(email, after) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`).then((r) => r.json());
    const msg = (res.messages || []).find((m) => new Date(m.Created).getTime() >= after && /invited/i.test(m.Subject));
    if (msg) {
      const full = await fetch(`${MAIL}/api/v1/message/${msg.ID}`).then((r) => r.json());
      const m = (full.Text || '').match(/https?:\/\/[^\s]+\/invitation#token=[0-9a-f]{64}/);
      if (m) return { subject: msg.Subject, url: m[0].replace(/^https?:\/\/[^/]+/, BASE) };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no invitation email for ${email}`);
}

async function signInOnPage(page, email) {
  const t0 = Date.now() - 2000;
  await page.getByRole('button', { name: /send verification code/i }).click();
  await page.getByLabel('Digit 1 of 6').waitFor({ timeout: 15000 });
  const code = await latestCode(email, t0);
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill(code[i]);
  await page.getByRole('button', { name: /verify email/i }).click();
  await page.getByLabel('Digit 1 of 6').waitFor({ state: 'detached', timeout: 15000 });
}

const invite = (page, body) => page.evaluate(async ({ body, anon }) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const token = JSON.parse(localStorage.getItem(key)).access_token;
  const r = await fetch('http://127.0.0.1:54321/functions/v1/admin-invite-user', { method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => null) };
}, { body, anon: process.env.ANON_KEY });

// --- 1. Super Admin invites a Super Admin from the console -------------------
const root = await launch();
await otpLogin(root.page, 'root@tangy.test');
await root.page.goto(`${BASE}/admin-portal/users`);
await root.page.getByRole('button', { name: 'Invite team member' }).click();
const dialog = root.page.getByRole('dialog');
await dialog.locator('select').waitFor();
const roleOptions = await dialog.locator('select option').allTextContents();
check(['Staff', 'Admin / Manager', 'Super Admin'].every((r) => roleOptions.includes(r)), `super admin can invite Staff, Admin / Manager and Super Admin (${roleOptions.join(', ')})`);
await dialog.getByLabel('Full name *').fill('Ira Invitee');
await dialog.getByLabel('Email *').fill(SUPER_INVITEE);
await dialog.locator('select').selectOption('super_admin');
const sentAt = Date.now() - 2000;
await dialog.getByRole('button', { name: 'Send invite' }).click();
await root.page.getByText(`Invitation sent to ${SUPER_INVITEE}`).waitFor({ timeout: 15000 });
check(true, 'the console reports the invitation as emailed');
check(sql(`select count(*) from profiles where email = '${SUPER_INVITEE}'`) === '0', 'sending an invitation creates no account and grants nothing');
check(sql(`select role || ':' || email_status from account_invitations where email = '${SUPER_INVITEE}' and accepted_at is null and revoked_at is null`) === 'super_admin:sent',
  'the pending invitation records its role and that the email was sent');
check(/^[0-9a-f]{64}$/.test(sql(`select token_hash from account_invitations where email = '${SUPER_INVITEE}' limit 1`)), 'only a token hash is stored');
await root.page.locator(`[data-invitation="${SUPER_INVITEE}"]`).waitFor();
check(await root.page.locator(`[data-invitation="${SUPER_INVITEE}"]`).getByText('pending').isVisible(), 'the invitation is listed as pending');
await shot(root.page, 'invitations-console');

const link = await inviteLink(SUPER_INVITEE, sentAt);
check(/Super Admin/.test(link.subject), `the email names the role (${link.subject})`);

// --- 2. Another signed-in account cannot use the link ------------------------
const other = await launch();
await otpLogin(other.page, 'patron@tangy.test', '/profile');
await other.page.goto(link.url);
await other.page.getByText('this invitation is for').waitFor();
check(!(await other.page.getByRole('button', { name: 'Accept invitation' }).isVisible()), 'signed in as someone else: no Accept button');
const misuse = await other.page.evaluate(async ({ token, anon }) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const jwt = JSON.parse(localStorage.getItem(key)).access_token;
  const r = await fetch('http://127.0.0.1:54321/rest/v1/rpc/accept_account_invitation', { method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: token }) });
  return (await r.json()).message;
}, { token: link.url.split('token=')[1], anon: process.env.ANON_KEY });
check(/different email/.test(misuse || ''), `the server refuses another account (${misuse})`);
check(sql("select role from profiles where email = 'patron@tangy.test'") === 'user', '… and the patron gains nothing');
await other.browser.close();

// --- 3. The invited address accepts -----------------------------------------
const inv = await launch({ mobile: true });
await inv.page.goto(`${BASE}/invitation`);
await inv.page.getByText('This invitation link is not valid').waitFor();
check(true, 'a link without a valid token is refused');
await inv.page.goto(link.url);
await inv.page.locator('[data-invite-role]').waitFor();
check(await inv.page.locator('[data-invite-role]').innerText() === 'Super Admin', 'the invitation page shows the role it grants');
check(await inv.page.getByPlaceholder('you@example.com').inputValue() === SUPER_INVITEE, 'the sign-in form is pre-filled with the invited address');
check(await inv.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the invitation page fits a phone screen');
await shot(inv.page, 'invitation-page');
await signInOnPage(inv.page, SUPER_INVITEE);
await inv.page.getByRole('button', { name: 'Accept invitation' }).click();
await inv.page.getByText('You now have Super Admin access').waitFor();
check(sql(`select role from profiles where email = '${SUPER_INVITEE}'`) === 'super_admin', 'accepting makes the account Super Admin');
check(sql(`select count(*) from audit_logs where action = 'user.invitation_accepted' and resource_id = (select id::text from profiles where email = '${SUPER_INVITEE}')`) === '1', 'the acceptance is audited');
await inv.page.getByRole('link', { name: 'Open the console' }).click();
await inv.page.waitForURL(/\/admin-portal/);
await inv.page.getByRole('heading', { level: 1 }).first().waitFor();
check(!/no access/i.test(await inv.page.locator('body').innerText()), 'the new Super Admin opens the console');
await inv.page.goto(link.url);
await inv.page.getByText('already been used').waitFor();
check(true, 'the link is single-use');
check(inv.errors.filter((e) => !/400|accept_account_invitation/.test(e)).length === 0, `no page errors on the invitation flow (${inv.errors.join(' | ')})`);
await inv.browser.close();

// --- 4. Revoke ------------------------------------------------------------------
const revokeAt = Date.now() - 2000;
const staffInv = await invite(root.page, { email: STAFF_INVITEE, full_name: 'Sia Staff', role: 'staff' });
check(staffInv.status === 200 && staffInv.data?.email_status === 'sent', `super admin invites staff (${staffInv.status})`);
const staffLink = await inviteLink(STAFF_INVITEE, revokeAt);
await root.page.reload();
const row = root.page.locator(`[data-invitation="${STAFF_INVITEE}"]`);
await row.getByRole('button', { name: 'Revoke' }).click();
await root.page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).click();
await row.getByText('revoked').waitFor();
check(true, 'the console revokes a pending invitation');
const rv = await launch();
await rv.page.goto(staffLink.url);
await rv.page.getByText('was withdrawn').waitFor();
check(true, 'a revoked link no longer works');
await rv.browser.close();
await root.browser.close();

// --- 5. Admin / Manager: Staff only ---------------------------------------------
const mgr = await launch();
await otpLogin(mgr.page, 'manager@tangy.test');
await mgr.page.goto(`${BASE}/admin-portal/users`);
await mgr.page.getByRole('button', { name: 'Invite team member' }).click();
await mgr.page.getByRole('dialog').locator('select').waitFor();
const mgrOptions = await mgr.page.getByRole('dialog').locator('select option').allTextContents();
check(mgrOptions.join() === 'Staff', `an Admin / Manager can only invite Staff (${mgrOptions.join(', ')})`);
await mgr.page.keyboard.press('Escape');
const mgrBefore = mgr.errors.length;
const escalate = await invite(mgr.page, { email: 'invitee-admin@tangy.test', full_name: 'Esc', role: 'super_admin' });
check(escalate.status === 403, `an Admin / Manager cannot invite a Super Admin through the API (${escalate.status})`);
mgr.errors.splice(mgrBefore);

// --- 6. Staff apply to volunteer at one session ---------------------------------
const st = await launch();
await otpLogin(st.page, 'staff@tangy.test');
await st.page.goto(`${BASE}/volunteer/apply`);
const session = st.page.getByLabel('SESSION *');
await session.waitFor();
check(await session.evaluate((el) => el.required), 'staff must choose a session');
const noSession = await api(st.page, 'POST', '/rest/v1/crew_applications',
  { name: 'Sam', email: 'staff@tangy.test', role_interest: 'x', category: 'volunteer', user_id: sql("select id from profiles where email = 'staff@tangy.test'") });
check(noSession.status >= 400 && /Choose the session/.test(JSON.stringify(noSession.data)), 'the server also requires a session for staff');
const vol6 = sql("select id from events where slug = 'vol-6-local'");
await st.page.getByPlaceholder('YOUR FULL NAME *').fill('Sam Staff');
await st.page.getByPlaceholder('YOUR EMAIL ADDRESS *').fill('staff@tangy.test');
await st.page.getByPlaceholder('PHONE NUMBER *').fill('9800000001');
await session.selectOption(vol6);
await st.page.getByRole('button', { name: /submit volunteer application/i }).click();
await st.page.getByText(/application/i).filter({ hasText: /received|submitted/i }).first().waitFor({ timeout: 15000 });
check(sql(`select status || ':' || (event_id = '${vol6}') from crew_applications where email = 'staff@tangy.test' and category = 'volunteer'`) === 'pending:true',
  'the application is pending for that session');
st.errors.splice(0);
await st.browser.close();

const appId = sql("select id from crew_applications where email = 'staff@tangy.test' and category = 'volunteer'");
await mgr.page.goto(`${BASE}/admin-portal/applications/${appId}`);
await mgr.page.getByText('Vol. 6').first().waitFor();
check(true, 'the reviewer sees the session the applicant chose');
await mgr.page.getByRole('button', { name: 'Approve' }).first().click();
await mgr.page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
await mgr.page.getByText('approved').first().waitFor();
check(sql(`select count(*) from event_assignments where event_id = '${vol6}' and assignee_role = 'volunteer'
  and assignee_id = (select id from profiles where email = 'staff@tangy.test')`) === '1', 'approval adds them to that session\'s volunteer team');
check(sql("select role from profiles where email = 'staff@tangy.test'") === 'staff', 'the staff role is unchanged (staff never auto-become volunteers)');
await mgr.browser.close();

for (const [who, errs] of [['root', root.errors], ['manager', mgr.errors]]) {
  const real = errs.filter((e) => !/Failed to load resource|http 4\d\d/.test(e));
  check(real.length === 0, `${who}: no page errors (${real.join(' | ')})`);
}
