import { execFileSync } from 'node:child_process';
import { launch, otpLogin, check, BASE } from './lib.mjs';

const sql = (q) => execFileSync('docker', ['exec', process.env.DB_CONTAINER || 'supabase_db_localstack', 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();

// Loads every remaining route at phone size (390 × 844) as the right role and
// checks that each one renders a real page: no JavaScript error, visible
// content, a page title, no sideways scroll, and either the expected page or
// (for redirects) the expected destination. Needs the local demo dataset.

const D = (n) => `de300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const allErrors = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(400|401|403|404|406)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));

async function visit(s, who, path, { expectPath, text, forbidden: expectForbidden = false } = {}) {
  const before = s.errors.length;
  await s.page.goto(BASE + path);
  if (expectPath) {
    const ok = await s.page.waitForURL((u) => (expectPath instanceof RegExp ? expectPath.test(u.pathname + u.search) : u.pathname === expectPath), { timeout: 12000 }).then(() => true, () => false);
    check(ok, `${who}: ${path} → ${expectPath}`);
    return;
  }
  if (text) await s.page.getByText(text).first().waitFor({ timeout: 12000 }).catch(() => {});
  else await s.page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await s.page.waitForTimeout(500);
  const r = await s.page.evaluate(() => ({
    len: (document.querySelector('main') || document.body).innerText.trim().length,
    over: document.documentElement.scrollWidth - window.innerWidth,
    notFound: !!document.querySelector('[data-not-found]'),
    forbidden: /don.t have permission|No access/i.test(document.body.innerText),
    title: document.title,
  }));
  const pageErrors = s.errors.slice(before).filter((e) => e.startsWith('pageerror'));
  // Visible text only (phone layouts keep hidden desktop tables / nav in the DOM).
  const visible = await s.page.evaluate(() => (document.querySelector('main') || document.body).innerText);
  const textOk = !text || (text instanceof RegExp ? text.test(visible) : visible.toLowerCase().includes(text.toLowerCase()));
  check(pageErrors.length === 0 && r.len > 60 && r.over <= 1 && !r.notFound && r.forbidden === expectForbidden && textOk && r.title,
    `${who}: ${path}${text ? ` ("${text}")` : ''}${pageErrors.length ? ` — ${pageErrors[0]}` : ''}${r.over > 1 ? ` +${r.over}px` : ''}${r.notFound ? ' 404' : ''}${r.forbidden ? ' forbidden' : ''}${!textOk ? ' text missing' : ''}`);
}

// ---------------------------------------------------------------- visitors
const v = await launch({ mobile: true });
for (const path of ['/', '/about', '/about/chronology', '/about/full-story', '/about/team', '/about/why-tangy', '/ai', '/archive',
  '/archive/contact-sheets', '/archive/museum-timeline', '/archive/past-memories', '/archive/session-archive', '/blogs',
  '/collaborate', '/collaborate/opportunities', '/contact/email', '/contact/instagram', '/contact/location', '/crew/production',
  '/crew/stage-operations', '/crew/volunteer', '/diary/journal', '/diary/stories', '/inner-circle', '/join', '/private/corporate',
  '/private/gatherings', '/private/heritage', '/private/weddings', '/sessions/calendar', '/sessions/concert-culture', '/sessions/upcoming',
  '/volunteer', '/volunteer/apply', '/crew/apply', '/apply/crew', '/apply/vendors', '/apply/venue-host', '/apply/host', '/artist/apply', '/artists']) {
  await visit(v, 'visitor', path);
}
await visit(v, 'visitor', '/blogs/demo-lanterns-at-chowmahalla', { text: 'Lanterns at Chowmahalla' });
for (const [from, to] of [['/diary/behind-the-scenes', '/diary'], ['/collaborate/sponsors', '/apply/sponsors'], ['/collaborate/vendors', '/apply/vendors'],
  ['/collaborate/venue-host', '/apply/venue-host'], ['/artists/apply', '/artist/apply'], ['/artist/register', '/artist/apply'], ['/artists/login', '/artist/login'],
  ['/book/courtyard-live-friday', '/sessions/courtyard-live-friday'], ['/dashboard', '/join/login'], ['/profile', '/join/login'],
  ['/sponsor/dashboard/messages', '/join/login'], ['/admin-mock', /\/admin-portal/], ['/crew-mock/dashboard', /\/(crew\/dashboard|join\/login)/]]) {
  await visit(v, 'visitor', from, { expectPath: to });
}
for (const path of ['/demo/patron', '/demo/artist']) await visit(v, 'visitor', path, { text: /Demo mode is not enabled in this build/i });
await visit(v, 'visitor', '/demo-admin/control-room', { text: /DEMO MODE IS DISABLED/ });
for (const [from, to] of [['/artist-mock/portal', /\/artist\/(dashboard|login)/], ['/artists/portal', /\/artist\/(dashboard|login)/]]) await visit(v, 'visitor', from, { expectPath: to });

// ---------------------------------------------------------------- signed-in roles and their sections (each its own URL)
const ROLES = [
  ['patron', 'meera.kulkarni@demo.tangy.local', ['/dashboard', '/dashboard/bookings', '/dashboard/waitlist', '/dashboard/passport', '/dashboard/settings', '/profile']],
  ['sponsor', 'saffron.tea@demo.tangy.local', ['/sponsor/dashboard', '/sponsor/dashboard/events', '/sponsor/dashboard/requirements', '/sponsor/dashboard/documents', '/sponsor/dashboard/assets', '/sponsor/dashboard/payments', '/sponsor/dashboard/deliverables', '/sponsor/dashboard/profile', `/sponsor/dashboard/messages/${D(602)}`]],
  ['vendor', 'kulhad.chai@demo.tangy.local', ['/vendor/dashboard', '/vendor/dashboard/events', '/vendor/dashboard/assignments', '/vendor/dashboard/payments', `/vendor/dashboard/messages/${D(603)}`, '/vendor/dashboard/notifications']],
  ['venue host', 'farah@demo.tangy.local', ['/venue/dashboard', '/venue/dashboard/events', '/venue/dashboard/messages', `/venue/dashboard/messages/${D(604)}`, '/venue/dashboard/profile']],
  ['volunteer', 'aisha@demo.tangy.local', ['/volunteer/dashboard', '/volunteer/dashboard/events', '/volunteer/dashboard/checkin', '/volunteer/dashboard/tasks', '/volunteer/dashboard/announcements']],
  ['crew', 'sound.crew@demo.tangy.local', ['/crew/dashboard', '/crew/dashboard/assignments', '/crew/dashboard/schedule', '/crew/dashboard/profile']],
  ['private-session client', 'divya.menon@demo.tangy.local', ['/private/dashboard', '/private/dashboard/applications', '/private/dashboard/help']],
  ['artist', 'ananya.rao@demo.tangy.local', ['/artist/dashboard', '/artist/sessions', '/artist/messages', `/artist/messages/${D(601)}`, '/artist/documents', '/artist/notifications', '/artist/profile', '/artist/calendar', '/artist/availability', '/artist/media', '/artist/requests', '/artist/settings']],
];
for (const [who, email, paths] of ROLES) {
  const s = await launch({ mobile: true });
  await otpLogin(s.page, email, '/join/login');
  for (const path of paths) await visit(s, who, path);
  if (who === 'artist') {
    await visit(s, who, '/artist/portal', { expectPath: '/artist/dashboard' });
    for (const [from, to] of [['/artist/dashboard/events', '/artist/sessions'], ['/artist/dashboard/messages', '/artist/messages'], ['/artist/dashboard/payments', '/artist/documents'], [`/artist/dashboard/messages/${D(601)}`, `/artist/messages/${D(601)}`]]) await visit(s, who, from, { expectPath: to });
    // Upload limits (0029): an HTML file can't be put in the public avatars bucket; an image can.
    const before = s.errors.length;
    const up = await s.page.evaluate(async ({ anon, folder }) => {
      const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
      const token = JSON.parse(localStorage.getItem(key)).access_token;
      const put = (name, type, body) => fetch(`http://127.0.0.1:54321/storage/v1/object/artist-avatars/${folder}/${name}`, {
        method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': type, 'x-upsert': 'true' }, body });
      const html = (await put('e2e-probe.html', 'text/html', '<script>alert(1)</script>')).status;
      const png = (await put('e2e-probe.png', 'image/png', Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0)))).status;
      await fetch('http://127.0.0.1:54321/storage/v1/object/artist-avatars', { method: 'DELETE', headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [`${folder}/e2e-probe.png`] }) });
      return { html, png };
    }, { anon: process.env.ANON_KEY, folder: D(401) });
    s.errors.splice(before);
    check(up.html >= 400 && up.png === 200, `artist avatars: HTML refused (${up.html}), image accepted (${up.png})`);
  }
  if (who === 'patron') {
    await visit(s, who, '/dashboard?tab=waitlist', { expectPath: '/dashboard/waitlist' });
    await visit(s, who, '/admin-portal', { text: /No access|doesn.t have access/i, forbidden: true });
  }
  track(who, s.errors);
  await s.browser.close();
}

// ---------------------------------------------------------------- console detail pages not covered elsewhere
const a = await launch({ mobile: true });
await otpLogin(a.page, 'director@demo.tangy.local');
const appId = await a.page.evaluate(async (anon) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const token = JSON.parse(localStorage.getItem(key)).access_token;
  const r = await fetch('http://127.0.0.1:54321/rest/v1/applications_overview?select=id&applicant_email=eq.harsh.vardhan@demo.tangy.local', { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  return (await r.json())[0]?.id;
}, process.env.ANON_KEY);
for (const [path, text] of [[`/admin-portal/applications/${appId}`, 'Harsh Vardhan'], [`/admin-portal/users/${D(170)}`, 'Meera Kulkarni'], ['/admin-portal/reviews/assets', 'Sponsor assets'],
  ['/admin-portal/people', 'Artists & partners'], ['/admin-portal/people/artists', 'Ananya Rao'], ['/admin-portal/roles', 'Roles'], ['/admin-portal/audit', 'Audit'],
  ['/admin-portal/settings', 'Waitlist allocation'], ['/admin-portal/invoices', 'DEMO-KCC-014'], ['/admin-portal/team', 'Team'], ['/admin-portal/check-ins', 'Check-in history'],
  [`/admin/preview/sponsor/${D(120)}`, 'Saffron Tea Co. (demo)'], [`/admin/preview/artist/${D(401)}`, 'Ananya Rao']]) {
  await visit(a, 'super admin', path, { text });
}
await visit(a, 'super admin', '/admin-portal/check-in', { expectPath: '/check-in' });
await visit(a, 'super admin', `/admin/preview/sponsor`, { expectPath: /\/admin-portal\/preview\/sponsor|\/admin\/preview\/sponsor/ });
// admin-invite-user (Edge Function): a Super Admin can invite; staff cannot.
// Inviting creates a pending invitation only — the role is granted on acceptance (0030).
const invite = (page) => page.evaluate(async (anon) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const token = JSON.parse(localStorage.getItem(key)).access_token;
  const r = await fetch('http://127.0.0.1:54321/functions/v1/admin-invite-user', { method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invite-probe@demo.tangy.local', full_name: 'Invite Probe', role: 'staff' }) });
  return r.status;
}, process.env.ANON_KEY);
const invBefore = a.errors.length;
const invited = await invite(a.page);
check(invited === 200 && sql("select role from account_invitations where email = 'invite-probe@demo.tangy.local' and accepted_at is null and revoked_at is null") === 'staff'
  && sql("select count(*) from profiles where email = 'invite-probe@demo.tangy.local'") === '0', `super admin invites a staff member through admin-invite-user — pending until accepted (${invited})`);
a.errors.splice(invBefore);
track('super admin', a.errors);
await a.browser.close();
const st = await launch({ mobile: true });
await otpLogin(st.page, 'desk@demo.tangy.local');
await visit(st, 'staff', `/admin-portal/my-events/${D(310)}`, { text: 'Courtyard Live: Friday Edition' });
await visit(st, 'staff', '/admin-portal/event-info');
const stBefore = st.errors.length;
const staffInvite = await invite(st.page);
check(staffInvite === 403, `staff cannot invite users (${staffInvite})`);
st.errors.splice(stBefore);
sql("delete from account_invitations where email = 'invite-probe@demo.tangy.local'");
track('staff', st.errors);
await st.browser.close();

track('visitor', v.errors);
await v.browser.close();
console.log('\nERRORS:\n' + (allErrors.length ? allErrors.join('\n') : '(none)'));
if (allErrors.length) process.exitCode = 1;
