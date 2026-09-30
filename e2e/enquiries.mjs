import { execFileSync } from 'node:child_process';
import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

// Authentication-first enquiries (0025) end to end on a phone: contact,
// private-session and crew forms ask a signed-out visitor to verify their
// email first (and keep them on the page); once signed in the form is
// prefilled, the enquiry is stored against the account, the applicant gets a
// receipt and the team an alert; a double submit is explained; anonymous
// writes are refused by the database; ?next= only accepts same-site paths.

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const seen = (loc, ms = 10000) => loc.waitFor({ timeout: ms }).then(() => true, () => false);
const allErrors = [];
const refused = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));
const PATRON = sql("select id from profiles where email = 'patron@tangy.test'");
const MANAGER = sql("select id from profiles where email = 'manager@tangy.test'");

// --- Signed out: every form is gated -------------------------------------------------
const v = await launch({ mobile: true });
for (const [path, heading] of [['/contact', /sign in to send a message/i], ['/private-sessions', /sign in to send your request/i], ['/crew', /verify your email to apply/i], ['/apply/sponsors', /verify your email to apply/i]]) {
  await v.page.goto(BASE + path);
  const gated = await seen(v.page.getByText(heading).first());
  check(gated && !(await v.page.locator('form textarea:visible').count()), `signed out: ${path} asks for sign-in before showing the form`);
}
await shot(v.page, 'enquiries-01-gate');
const anonInsert = await v.page.evaluate(async (anon) => (await fetch('http://127.0.0.1:54321/rest/v1/contact_enquiries', {
  method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Anon', email: 'anon@x.test', subject: 'Hi', message: 'hello' }),
})).status, process.env.ANON_KEY);
check(anonInsert === 401 || anonInsert === 403, `the database refuses an anonymous enquiry (${anonInsert})`);

// --- Sign in on the page itself ------------------------------------------------------------
const p = await launch({ mobile: true });
await otpLogin(p.page, 'patron@tangy.test', '/contact');
check(p.page.url().endsWith('/contact'), 'signing in keeps the visitor on the contact page');
const email = p.page.getByPlaceholder(/email/i).first();
check(await seen(email) && (await email.inputValue()) === 'patron@tangy.test', 'the form is prefilled with the account email');
const subject = `E2E parking ${Date.now()}`;
await p.page.getByPlaceholder(/subject/i).fill(subject);
await p.page.locator('textarea').first().fill('Is there parking near the stepwell?');
await p.page.getByRole('button', { name: /send dispatch/i }).click();
check(await seen(p.page.getByText(/dispatch transmitted/i)), 'the message is sent and confirmed');
check(sql(`select count(*) from contact_enquiries where subject = '${subject}' and user_id = '${PATRON}'`) === '1', 'the enquiry is stored against the patron\'s account');
check(sql(`select count(*) from notifications where user_id = '${PATRON}' and type = 'application.received'`) >= '1', 'the patron gets a receipt');
check(sql(`select count(*) from notifications where user_id = '${MANAGER}' and type = 'enquiry.new' and link = '/admin-portal/ops/contact'`) >= '1', 'the team is alerted with a link to the contact inbox');
await shot(p.page, 'enquiries-02-sent');

// Double submit of the same message.
const dupBefore = p.errors.length;
await p.page.reload();
await p.page.getByPlaceholder(/subject/i).fill(subject);
await p.page.locator('textarea').first().fill('  is there PARKING near the stepwell? ');
await p.page.getByRole('button', { name: /send dispatch/i }).click();
check(await seen(p.page.getByText(/already have this message/i)), 'sending the same message again is explained, not duplicated');
check(sql(`select count(*) from contact_enquiries where subject = '${subject}'`) === '1', 'still one enquiry');
refused.push(...p.errors.splice(dupBefore));

// Enquiring on someone else's behalf is refused by the database.
const before = p.errors.length;
const spoof = await api(p.page, 'POST', '/rest/v1/contact_enquiries', { name: 'X', email: 'x@x.test', subject: 'x', message: 'x', user_id: MANAGER });
check(spoof.status === 401 || spoof.status === 403, `an enquiry as another user is refused (${spoof.status})`);
refused.push(...p.errors.splice(before));

// Private session enquiry: prefilled and linked.
await p.page.goto(`${BASE}/private-sessions`);
const privName = p.page.getByPlaceholder(/your name/i).first();
check(await seen(privName) && (await p.page.getByPlaceholder(/email/i).first().inputValue()) === 'patron@tangy.test', 'private sessions: the form is open and prefilled once signed in');

// --- next= handling ------------------------------------------------------------------------
await p.page.goto(`${BASE}/join/login?next=${encodeURIComponent('/private-sessions')}`);
check(await p.page.waitForURL(/\/private-sessions$/, { timeout: 10000 }).then(() => true, () => false), 'an already signed-in visitor is sent on to next=');
await p.page.goto(`${BASE}/join/login?next=${encodeURIComponent('https://evil.example/phish')}`);
await p.page.waitForURL((u) => !u.pathname.startsWith('/join/login'), { timeout: 10000 }).catch(() => {});
check(new URL(p.page.url()).origin === new URL(BASE).origin, 'an off-site next= is ignored');
await p.page.goto(`${BASE}/join/login?next=${encodeURIComponent('//evil.example')}`);
await p.page.waitForURL((u) => !u.pathname.startsWith('/join/login'), { timeout: 10000 }).catch(() => {});
check(new URL(p.page.url()).origin === new URL(BASE).origin, 'a protocol-relative next= is ignored');

// ProtectedRoute keeps the destination.
await v.page.goto(`${BASE}/profile`);
check(await v.page.waitForURL(/\/join\/login\?next=%2Fprofile/, { timeout: 10000 }).then(() => true, () => false), 'a protected page sends a signed-out visitor to sign in with next=');

// --- Admin sees it ---------------------------------------------------------------------------
const m = await launch();
await otpLogin(m.page, 'manager@tangy.test');
await m.page.goto(`${BASE}/admin-portal/ops/contact`);
check(await seen(m.page.getByText(subject).first()), 'the manager sees the enquiry in Contact messages');

track('visitor', v.errors); track('patron', p.errors); track('manager', m.errors);
await Promise.all([v.browser.close(), p.browser.close(), m.browser.close()]);
console.log('\nEXPECTED REFUSALS:\n' + (refused.length ? refused.join('\n') : '(none)'));
console.log('\nERRORS:\n' + (allErrors.length ? allErrors.join('\n') : '(none)'));
if (allErrors.length) process.exitCode = 1;
