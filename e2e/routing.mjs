import { execFileSync } from 'node:child_process';
import { launch, otpLogin, shot, check, BASE } from './lib.mjs';

// Every section is a real page: sidebar clicks change the URL, detail pages
// have their own URL, refresh / back / forward / deep links work, invalid ids
// show a not-found state, breadcrumbs and titles follow the page, dashboard
// cards lead to real pages, and roles without access get Forbidden.
// Needs the local demo dataset (scripts/demo-data.sh seed — run.sh loads it).

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const seen = (loc, ms = 10000) => loc.waitFor({ timeout: ms }).then(() => true, () => false);
const url = (p) => new URL(p.url()).pathname + new URL(p.url()).search;
const allErrors = [];
const expected = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403|404|406)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));
const D = (n) => `de300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
if (sql(`select count(*) from events where id = '${D(301)}'`) !== '1') throw new Error('Demo data is not loaded — run scripts/demo-data.sh seed');

// ---------------------------------------------------------------- admin: sidebar and nested routes
const a = await launch();
const p = a.page;
await otpLogin(p, 'ops@demo.tangy.local');
await seen(p.getByRole('navigation', { name: 'Admin navigation' }));
const nav = p.getByRole('navigation', { name: 'Admin navigation' });
await nav.getByRole('link', { name: 'Content', exact: true }).click();
check(await p.waitForURL(/\/admin-portal\/content$/).then(() => true, () => false), 'sidebar: Content → /admin-portal/content');
await nav.getByRole('link', { name: 'Sessions', exact: true }).click();
check(await p.waitForURL(/\/admin-portal\/content\/sessions$/).then(() => true, () => false), 'sidebar: Content → Sessions changes the URL to /admin-portal/content/sessions');
check(await seen(p.getByText('Heritage After Dark').first()), 'demo sessions are listed');
await p.getByText('Heritage After Dark').first().click();
check(await p.waitForURL(/\/admin-portal\/content\/sessions\/heritage-after-dark$/).then(() => true, () => false), 'clicking a session opens /admin-portal/content/sessions/heritage-after-dark');
check(await nav.getByRole('link', { name: 'Sessions', exact: true }).getAttribute('aria-current') === 'page'
  && await nav.getByRole('link', { name: 'Content', exact: true }).getAttribute('data-active') === 'true', 'nested route: Content and Sessions are both highlighted');
const crumbs = p.locator('[data-breadcrumbs]');
await seen(crumbs.getByText('Heritage After Dark'));
const trail = (await crumbs.textContent()).replace(/\s+/g, ' ').trim();
check(/Admin ?\/ ?Content ?\/ ?Sessions ?\/ ?Heritage After Dark/i.test(trail), `breadcrumbs: ${trail}`);
check(await crumbs.getByText('Heritage After Dark').getAttribute('aria-current') === 'page' && !(await crumbs.getByRole('link', { name: 'Heritage After Dark' }).count()), 'the current page crumb is not a link');
check(await p.title() === 'Tangy Admin — Heritage After Dark', `document title: ${await p.title()}`);
await shot(p, 'routing-01-session-detail');
await p.reload();
check(await seen(p.getByRole('heading', { name: 'Heritage After Dark' })) && url(p) === '/admin-portal/content/sessions/heritage-after-dark', 'refresh keeps the same page');
await p.goBack();
check(await p.waitForURL(/\/admin-portal\/content\/sessions$/).then(() => true, () => false), 'back returns to the sessions list');
await p.goForward();
check(await p.waitForURL(/heritage-after-dark$/).then(() => true, () => false), 'forward returns to the session');
await crumbs.getByRole('link', { name: 'Sessions' }).click();
check(await p.waitForURL(/\/admin-portal\/content\/sessions$/).then(() => true, () => false), 'breadcrumb "Sessions" links to the list');

// Direct deep links (each loads its own page).
const DEEP = [
  ['/admin-portal/content', 'Content'],
  ['/admin-portal/content/artists', 'Artists'],
  ['/admin-portal/content/artists/ananya-rao', 'Ananya Rao'],
  ['/admin-portal/content/gallery', 'Gallery'],
  ['/admin-portal/content/gallery/demo-sunset-baithak', 'Sunset Baithak'],
  ['/admin-portal/content/tv', 'Tangy TV'],
  ['/admin-portal/content/tv/demo-monsoon-sessions-trailer', 'Monsoon Sessions — trailer'],
  ['/admin-portal/content/diary', 'Diary'],
  ['/admin-portal/content/diary/demo-lanterns-at-chowmahalla', 'Lanterns at Chowmahalla'],
  ['/admin-portal/content/announcements', 'Announcements'],
  ['/admin-portal/content/media', 'Media library'],
  ['/admin-portal/events', 'Events'],
  [`/admin-portal/events/${D(310)}`, 'Courtyard Live: Friday Edition'],
  [`/admin-portal/events/${D(301)}/tickets`, 'Chair seating'],
  [`/admin-portal/events/${D(310)}/checkin`, 'Courtyard Live: Friday Edition'],
  ['/admin-portal/bookings', 'TS-DEMO-'],
  [`/admin-portal/bookings/${D(560)}`, 'TS-DEMO-560'],
  ['/admin-portal/payments', 'Payments'],
  ['/admin-portal/payments/webhooks', 'Razorpay webhook deliveries'],
  ['/admin-portal/waitlist', 'Meera Kulkarni'],
  ['/admin-portal/attendees', 'Attendees'],
  ['/admin-portal/tasks', 'Test the gate scanner'],
  [`/admin-portal/people/sponsors/${D(120)}`, 'Saffron Tea Co. (demo)'],
  [`/admin-portal/people/vendors/${D(130)}`, 'Kulhad Chai Cart (demo)'],
  [`/admin-portal/people/venue-hosts/${D(140)}`, 'Chowmahalla Courtyard (demo)'],
  [`/admin-portal/volunteers/${D(150)}`, 'Aisha Begum'],
  [`/admin-portal/messages/${D(601)}`, 'ribbon mic'],
  ['/admin-portal/notifications', 'Notifications'],
  ['/admin-portal/notifications/settings', 'Preferences'],
  ['/admin-portal/reports', 'Reports'],
];
for (const [path, text] of DEEP) {
  await p.goto(BASE + path);
  const ok = await seen(p.getByText(text).first(), 12000);
  check(ok && url(p) === path, `deep link ${path} loads its page ("${text}")`);
}
await p.goto(`${BASE}/admin-portal/bookings/${D(560)}`);
await seen(p.locator('[data-detail-page]'));
check((await p.locator('main').innerText()).includes('Priya Nair') && /3\s*\/\s*5|3 of 5/i.test(await p.locator('main').innerText()), 'the 5-person booking shows 3/5 checked in');

// Invalid resources.
for (const [path, text, back] of [
  ['/admin-portal/content/sessions/does-not-exist', 'Session not found', 'Back to sessions'],
  ['/admin-portal/content/tv/does-not-exist', 'Video not found', 'Back to videos'],
  ['/admin-portal/content/artists/does-not-exist', 'Artist not found', 'Back to artists'],
  [`/admin-portal/bookings/${D(999999)}`, 'Booking not found', 'Back to bookings'],
  [`/admin-portal/people/sponsors/${D(999999)}`, 'Sponsor not found', 'Back to sponsors'],
]) {
  await p.goto(BASE + path);
  check(await seen(p.getByText(text).first()) && await seen(p.getByRole('link', { name: back })), `invalid ${path} → "${text}" with "${back}"`);
}
await p.goto(`${BASE}/admin-portal/events/${D(999999)}`);
check(await seen(p.getByText(/event (doesn.t exist|not found)|not found/i).first()), 'an unknown event id shows not found');
await p.goto(`${BASE}/admin-portal/no-such-section`);
check(await seen(p.getByText(/not found|doesn.t exist/i).first()), 'an unknown admin URL shows not found');

// Legacy links redirect to the new URLs.
for (const [from, to] of [
  [`/admin-portal/events/${D(301)}?tab=tickets`, `/admin-portal/events/${D(301)}/tickets`],
  [`/admin-portal/bookings?booking=${D(560)}`, `/admin-portal/bookings/${D(560)}`],
  ['/admin-portal/bookings?tab=payments', '/admin-portal/payments'],
  ['/admin-portal/content?tab=tv', '/admin-portal/content/tv'],
  ['/admin-portal/ops/waitlist', '/admin-portal/waitlist'],
  ['/admin/content/sessions', '/admin-portal/content/sessions'],
  [`/admin-portal/messages?c=${D(601)}`, `/admin-portal/messages/${D(601)}`],
]) {
  await p.goto(BASE + from);
  const ok = await p.waitForURL((u) => u.pathname + u.search === to, { timeout: 10000 }).then(() => true, () => false);
  check(ok, `legacy ${from} → ${to}`);
}

// Dashboard cards lead to real pages.
await p.goto(`${BASE}/admin-portal`);
await seen(p.locator('[data-metrics]'));
const cards = await p.locator('[data-metrics] a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
check(cards.length >= 10 && cards.every((h) => h && h.startsWith('/admin-portal')), `every dashboard metric is a link (${cards.length})`);
await p.locator('[data-metrics] a[href="/admin-portal/waitlist"]').click();
check(await p.waitForURL(/\/admin-portal\/waitlist$/).then(() => true, () => false) && await seen(p.getByText('Meera Kulkarni').first()), 'dashboard "Waitlist" card → the waitlist page');
await p.goto(`${BASE}/admin-portal/payments`);
check(await seen(p.getByText('TS-DEMO-').first()), 'payments ledger lists demo payments');
await shot(p, 'routing-02-waitlist');

// Event tabs are URLs.
await p.goto(`${BASE}/admin-portal/events/${D(310)}`);
await p.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Bookings', exact: true }).click();
check(await p.waitForURL(new RegExp(`/admin-portal/events/${D(310)}/bookings$`)).then(() => true, () => false), 'event tab click changes the URL (…/bookings)');
await p.goBack();
check(await p.waitForURL(new RegExp(`/admin-portal/events/${D(310)}$`)).then(() => true, () => false), 'back returns to the event overview');

// ---------------------------------------------------------------- keyboard & dialogs
await p.goto(`${BASE}/admin-portal/bookings`);
await seen(p.getByText('TS-DEMO-').first());
await p.keyboard.press('Tab');
check(await p.evaluate(() => document.activeElement?.textContent?.trim()) === 'Skip to content', 'the first Tab stop is "Skip to content"');
const compBtn = p.getByRole('button', { name: 'Complimentary' });
await compBtn.focus();
await p.keyboard.press('Enter');
const dialog = p.getByRole('dialog', { name: 'Complimentary booking' });
check(await seen(dialog) && await dialog.evaluate((d) => d.contains(document.activeElement)), 'opening a dialog moves focus into it');
for (let i = 0; i < 25; i++) await p.keyboard.press('Tab');
check(await dialog.evaluate((d) => d.contains(document.activeElement)), 'Tab stays inside the dialog (focus trap)');
await p.keyboard.press('Shift+Tab');
check(await dialog.evaluate((d) => d.contains(document.activeElement)), 'Shift+Tab stays inside too');
await p.keyboard.press('Escape');
check(!(await dialog.count()) && await p.evaluate(() => document.activeElement?.textContent?.includes('Complimentary')), 'Escape closes it and focus returns to the button that opened it');

// ---------------------------------------------------------------- mobile admin navigation
const m = await launch({ mobile: true });
await otpLogin(m.page, 'ops@demo.tangy.local');
await m.page.getByRole('button', { name: /open navigation|menu/i }).first().click();
await m.page.getByRole('link', { name: 'Content', exact: true }).first().click();
await m.page.waitForURL(/\/admin-portal\/content$/).catch(() => {});
await m.page.getByRole('link', { name: /Tangy TV/ }).first().click();
check(await m.page.waitForURL(/\/admin-portal\/content\/tv$/).then(() => true, () => false), 'mobile: the content overview links to its sections');
const over = await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check(over <= 1, `mobile: no sideways scroll on /admin-portal/content/tv (+${over}px)`);
await m.page.goto(`${BASE}/admin-portal/content/sessions/heritage-after-dark`);
check(await seen(m.page.getByRole('heading', { name: 'Heritage After Dark' })) && (await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'mobile: session detail fits the screen');
await shot(m.page, 'routing-03-mobile-session');
// Admin pages at the three phone widths: no sideways scroll, a page heading.
const ADMIN_MOBILE = ['/admin-portal', '/admin-portal/events', `/admin-portal/events/${D(310)}`, `/admin-portal/events/${D(301)}/tickets`,
  '/admin-portal/bookings', `/admin-portal/bookings/${D(560)}`, '/admin-portal/payments', '/admin-portal/waitlist',
  '/admin-portal/content', '/admin-portal/content/diary', '/admin-portal/content/diary/demo-lanterns-at-chowmahalla',
  `/admin-portal/people/sponsors/${D(120)}`, `/admin-portal/messages/${D(601)}`];
for (const [w, h] of [[390, 844], [375, 812], [412, 915]]) {
  await m.page.setViewportSize({ width: w, height: h });
  let bad = [];
  for (const path of ADMIN_MOBILE) {
    await m.page.goto(BASE + path);
    await m.page.locator('main h1').first().waitFor({ timeout: 10000 }).catch(() => {});
    await m.page.waitForTimeout(300);
    const r = await m.page.evaluate(() => ({ over: document.documentElement.scrollWidth - window.innerWidth, h1: document.querySelectorAll('main h1').length }));
    if (r.over > 1 || r.h1 < 1) bad.push(`${path} (+${r.over}px, h1 ${r.h1})`);
  }
  check(bad.length === 0, `admin at ${w}×${h}: ${ADMIN_MOBILE.length} pages fit with a heading${bad.length ? ` — ${bad.join(', ')}` : ''}`);
}

// ---------------------------------------------------------------- roles without access
const s = await launch();
await otpLogin(s.page, 'desk@demo.tangy.local');
for (const path of ['/admin-portal/content/sessions', '/admin-portal/bookings', `/admin-portal/bookings/${D(560)}`, '/admin-portal/payments', '/admin-portal/waitlist', '/admin-portal/users', `/admin-portal/people/sponsors/${D(120)}`]) {
  await s.page.goto(BASE + path);
  check(await seen(s.page.getByText(/don.t have permission|No access/i).first()), `staff: ${path} is forbidden`);
}
const v = await launch();
await otpLogin(v.page, 'saffron.tea@demo.tangy.local', '/join/login');
await v.page.goto(`${BASE}/admin-portal/content/sessions`);
check(await seen(v.page.getByText(/No access|doesn.t have access/i).first()), 'sponsor: the admin console is refused');

// ---------------------------------------------------------------- partner portal sections are URLs
await v.page.goto(`${BASE}/sponsor/dashboard`);
await v.page.getByRole('link', { name: /^Messages$/i }).first().click();
check(await v.page.waitForURL(/\/sponsor\/dashboard\/messages$/).then(() => true, () => false), 'sponsor portal: Messages has its own URL');
await v.page.reload();
check(await seen(v.page.getByText('Banner logo files').first()), 'refresh keeps the section; demo thread listed');
await v.page.getByText('Banner logo files').first().click();
check(await v.page.waitForURL(new RegExp(`/sponsor/dashboard/messages/${D(602)}$`)).then(() => true, () => false), 'opening a thread gives it its own URL');
await v.page.goto(`${BASE}/sponsor/dashboard?tab=documents`);
check(await v.page.waitForURL(/\/sponsor\/dashboard\/documents$/).then(() => true, () => false), 'old ?tab= portal links redirect');
await v.page.goBack();
await shot(v.page, 'routing-04-sponsor-messages');
const ar = await launch();
await otpLogin(ar.page, 'ananya.rao@demo.tangy.local', '/artist/login');
await ar.page.goto(`${BASE}/artist/dashboard/requirements`);
check(await seen(ar.page.getByText('Technical rider').first()), 'artist portal: /artist/dashboard/requirements deep link shows the demo requirement');

// ---------------------------------------------------------------- public routes
const g = await launch({ mobile: true });
for (const [path, text] of [
  ['/sessions/heritage-after-dark', 'Chair seating'],
  ['/sessions', 'Heritage After Dark'],
  ['/artists', 'Ananya Rao'],
  ['/artists/zoya-qadri', 'Zoya Qadri'],
  ['/gallery/demo-sunset-baithak', 'Sunset Baithak'],
  ['/diary/demo-what-the-rain-brought', 'What the rain brought'],
  ['/terms', 'Draft — not yet reviewed'],
  ['/privacy', 'Draft — not yet reviewed'],
  ['/refund-policy', 'Draft — not yet reviewed'],
  ['/404', 'isn’t here'],
]) {
  await g.page.goto(BASE + path);
  check(await seen(g.page.getByText(text).first()), `public ${path} ("${text}")`);
}
await g.page.goto(`${BASE}/sessions/heritage-after-dark`);
await g.page.getByRole('button', { name: /sign in to book/i }).click();
const login = g.page.getByRole('dialog', { name: /sign in to book this session/i });
check(await seen(login) && await login.evaluate((d) => d.contains(document.activeElement)), 'public sign-in dialog: labelled, and focus moves into it');
await g.page.keyboard.press('Escape');
check(!(await login.count()), 'Escape closes the sign-in dialog');
await g.page.goto(`${BASE}/book/heritage-after-dark`);
check(await g.page.waitForURL(/\/sessions\/heritage-after-dark$/).then(() => true, () => false), '/book/:id redirects to /sessions/:id');
await g.page.goto(`${BASE}/sessions/monsoon-sessions`);
check(await seen(g.page.locator('[data-waitlist-panel]')), 'sold-out demo session shows the waitlist');
await g.page.goto(`${BASE}/sessions/indie-under-the-banyan`);
check(await seen(g.page.getByText(/Session not found/i).first()), 'a draft session is not public');
await g.page.goto(`${BASE}/diary/demo-dawn-concerts-why`);
check(await seen(g.page.locator('[data-not-found]')), 'a draft diary post is not public');
// Live seats: another booking lands while the page is open (0029 realtime signal).
await g.page.goto(`${BASE}/sessions/rhythm-at-the-stepwell`);
const seats = g.page.locator('[data-seats-left]');
check(await seen(seats) && /4 SEATS LEFT/i.test(await seats.innerText()), `almost sold out: ${await seats.innerText().catch(() => '?')}`);
await seen(g.page.locator('[data-seats-left][data-live="true"]'), 10000);
sql(`insert into bookings (registration_code, event_id, attendee_name, attendee_email, quantity, amount, tier, status, source, attendee_names)
     values ('TS-RT-LIVE', '${D(302)}', 'Live Test', 'live@tangy.test', 3, 0, 'gen', 'pending', 'complimentary', array['A','B','C'])`);
check(await g.page.waitForFunction(() => /1 SEAT LEFT/i.test(document.querySelector('[data-seats-left]')?.textContent || ''), null, { timeout: 15000 }).then(() => true, () => false),
  'a booking elsewhere updates the seat count without a reload (4 → 1)');
sql("update bookings set status = 'cancelled' where registration_code = 'TS-RT-LIVE'");
check(await g.page.waitForFunction(() => /4 SEATS LEFT/i.test(document.querySelector('[data-seats-left]')?.textContent || ''), null, { timeout: 15000 }).then(() => true, () => false),
  'a cancellation releases the seats live (1 → 4)');
sql("delete from bookings where registration_code = 'TS-RT-LIVE'");
await g.page.goto(`${BASE}/sessions/heritage-after-dark`);
check(await seen(g.page.locator('[data-ticket-types-public]').getByText('Patron pass')), 'ticket types and prices are shown before sign-in');

// Private media (0029): a published album's uploaded cover is served through a
// signed URL; a draft's upload can't be fetched or signed by visitors.
await g.page.goto(`${BASE}/gallery`);
const cover = g.page.locator('[data-album-card]', { hasText: 'Rhythm at the Stepwell' }).locator('img');
check(await seen(cover) && /\/object\/sign\/content-media\//.test(await cover.getAttribute('src')), 'a published album cover loads through a short-lived signed URL');
const probeBefore = g.errors.length;
const probe = await g.page.evaluate(async (anon) => {
  const pub = await fetch('http://127.0.0.1:54321/storage/v1/object/public/content-media/diary/de300000-demo/dawn-draft-cover.jpg');
  const sign = await fetch('http://127.0.0.1:54321/storage/v1/object/sign/content-media/diary/de300000-demo/dawn-draft-cover.jpg', {
    method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
  return { pub: pub.status, sign: sign.status };
}, process.env.ANON_KEY);
expected.push(...g.errors.splice(probeBefore).map((e) => `visitor probing a draft's media: ${e}`));
check(probe.pub >= 400 && probe.sign >= 400, `a draft's media is not reachable by visitors (public URL ${probe.pub}, sign ${probe.sign})`);
const adminSign = await p.evaluate(async (anon) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const token = JSON.parse(localStorage.getItem(key)).access_token;
  const r = await fetch('http://127.0.0.1:54321/storage/v1/object/sign/content-media/diary/de300000-demo/dawn-draft-cover.jpg', {
    method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
  return r.status;
}, process.env.ANON_KEY).catch(() => 'closed');
check(adminSign === 200, `a content editor can preview the draft's media (${adminSign})`);

const footerLinks = await g.page.locator('footer a[href="/terms"], footer a[href="/privacy"], footer a[href="/refund-policy"]').count();
check(footerLinks === 3, `footer links to terms, privacy and refund policy (${footerLinks})`);

for (const [label, x] of [['admin', a], ['mobile', m], ['staff', s], ['sponsor', v], ['artist', ar], ['public', g]]) { track(label, x.errors); await x.browser.close(); }
console.log('\nEXPECTED REFUSALS:\n' + (expected.length ? expected.join('\n') : '(none)'));
console.log('\nERRORS:\n' + (allErrors.length ? allErrors.join('\n') : '(none)'));
if (allErrors.length) process.exitCode = 1;
