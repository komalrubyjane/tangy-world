import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

// Partner workspaces from 0020: the artist workspace (dashboard, calendar,
// availability, booking requests, media with signed-URL preview, settings and
// notification preferences), sponsor / vendor / venue host portals (events,
// deliverables, brand assets, requirements, logistics, payments,
// notifications, messages) and the storage / document / message isolation
// between them. Every account signs in through the real Email OTP flow and
// every fixture is created through the admin UI the way the team would.

const text = async (page, sel = 'body') => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');
const until = (p, ms = 12000) => p.waitFor({ timeout: ms }).then(() => true, () => false);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const STORAGE = 'http://127.0.0.1:54321/storage/v1';
// 1×1 PNG — a real image the browser can decode in the preview.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const file = (name) => ({ name, mimeType: 'image/png', buffer: PNG });

const allErrors = [];
const refused = [];
// The local stack runs without Realtime (websocket 503); the app falls back to polling.
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket/.test(e)).map((e) => `${label}: ${e}`));
// Deliberate attacks: the 4xx responses they produce are the expected result,
// so they are reported separately instead of as page errors.
async function attempt(s, label, fn) {
  const before = s.errors.length;
  const out = await fn();
  refused.push(...s.errors.splice(before).map((e) => `${label}: ${e}`));
  return out;
}

async function signIn(email, path, opts) {
  const s = await launch(opts);
  await otpLogin(s.page, email, path);
  return s;
}
const storageFetch = (page, method, path, body) => page.evaluate(async ({ method, url, body, anon }) => {
  const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
  const token = JSON.parse(localStorage.getItem(key)).access_token;
  const res = await fetch(url, { method, body: body ? JSON.stringify(body) : undefined, headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  let data = null; try { data = await res.json(); } catch { /* binary or empty */ }
  return { status: res.status, data };
}, { method, url: STORAGE + path, body, anon: process.env.ANON_KEY });

// ---------------------------------------------------------------- sessions
const admin = await signIn('manager@tangy.test', '/admin-portal');
await admin.page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).waitFor({ timeout: 15000 });
const artist = await signIn('artist@tangy.test', '/artist/login');
await artist.page.waitForURL('**/artist/dashboard', { timeout: 15000 });
const ev5 = (await api(admin.page, 'GET', '/rest/v1/events?slug=eq.vol-5-local&select=id')).data?.[0]?.id;
const ev6 = (await api(admin.page, 'GET', '/rest/v1/events?slug=eq.vol-6-local&select=id,event_date')).data?.[0];

// ================================================================ ARTIST
// ---------------------------------------------------------------- dashboard
{
  const p = artist.page;
  check(await until(p.getByText('YOUR TANGY SESSIONS WORKSPACE')), 'artist dashboard: workspace header');
  const stats = await text(p, 'main');
  check(/UPCOMING SHOWS\s*1\b/.test(stats), `artist dashboard: 1 upcoming show (Vol. 5 today) (${stats.match(/UPCOMING SHOWS\s*\S+/)?.[0]})`);
  check(await until(p.getByText(/PROFILE COMPLETE\s*\d+%/)), 'artist dashboard: server-computed profile completion');
  const tabs = await text(p, 'section[aria-label="Artist workspace"] [role="tablist"]');
  check(['Overview', 'My performances', 'Schedule', 'Requirements', 'Messages', 'Documents', 'Payments', 'Notifications'].every((t) => tabs.toLowerCase().includes(t.toLowerCase())), `artist workspace tabs are complete (${tabs})`);
  check(await until(p.getByRole('region', { name: 'Next event' }).getByText('Tangy Sessions Vol. 5')), 'artist overview: next event is the confirmed performance');
  await shot(p, 'w01-artist-dashboard');
}

// ---------------------------------------------------------------- booking request flow
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${ev6.id}?tab=artists`);
  const sel = p.getByLabel('Approved artist');
  await sel.locator('option', { hasText: 'Aria Artist' }).waitFor({ state: 'attached' });
  await sel.selectOption({ label: 'Aria Artist' });
  await p.getByLabel('Proposed set starts').fill(`${ev6.event_date}T20:00`);
  await p.getByLabel('Proposed set ends').fill(`${ev6.event_date}T21:15`);
  await p.getByLabel('Fee offer (₹)').fill('15000');
  await p.getByLabel('Message to artist').fill('Closing set for Vol. 6?');
  await p.getByRole('button', { name: 'Send request' }).click();
  check(await until(p.getByText('Request sent — the artist answers from their portal')), 'admin sends a booking request for Vol. 6');
}
{
  const p = artist.page;
  await p.goto(BASE + '/artist/dashboard?tab=notifications');
  check(await until(p.locator('[data-notifications]').getByText('Booking request: Tangy Sessions Vol. 6')), 'artist is notified of the booking request');
  await p.goto(BASE + '/artist/requests');
  const req = p.locator('[data-request="Tangy Sessions Vol. 6"]');
  check(await until(req), 'artist requests page lists the request');
  const t = await text(p, '[data-request="Tangy Sessions Vol. 6"]');
  check(/Awaiting your reply/i.test(t) && /15,000/.test(t) && /Closing set for Vol\. 6\?/i.test(t), `request shows status, fee offer and message (${t.slice(0, 200)})`);
  check(/Pending \(1\)/i.test(await text(p, '[aria-label="Filter requests"]')), 'pending filter count = 1');
  await shot(p, 'w02-artist-request');
  await req.getByRole('button', { name: 'Accept' }).click();
  check(await until(p.getByText('Accepted — Tangy Sessions Vol. 6 is on your calendar.')), 'artist accepts the request');
  check(await until(req.getByText('Accepted', { exact: true })), 'accepted request stays in the history');
}
{
  const p = admin.page;
  await p.reload();
  check(await until(p.getByText('Aria Artist').first()) && await until(p.getByRole('region').or(p.locator('main')).getByText(/approved|accepted/i).first()), 'admin sees the request answered');
  const lineup = await api(p, 'GET', `/rest/v1/event_artists?event_id=eq.${ev6.id}&select=artist_id`);
  check(lineup.data?.length === 1, 'accepting put the artist on the Vol. 6 lineup (server-side)');
  const n = await api(p, 'GET', '/rest/v1/notifications?type=eq.booking.accepted&select=link');
  check(n.data?.length >= 1 && n.data.every((x) => x.link.startsWith('/admin-portal/events/')), 'admin notified with a canonical /admin-portal link');
}

// ---------------------------------------------------------------- calendar + availability
{
  const p = artist.page;
  await p.goto(BASE + '/artist/calendar');
  const cal = p.locator('[data-artist-calendar]');
  check(await until(cal.locator('.fc-daygrid')), 'calendar opens in month view on desktop');
  check(await until(cal.locator('.fc-event', { hasText: 'Tangy Sessions Vol. 5' }).first()), 'month view shows the confirmed performance');
  const title0 = await text(p, '[data-artist-calendar] h2');
  await p.getByRole('tab', { name: 'Week' }).click();
  check(await until(cal.locator('.fc-timegrid')) && (await text(p, '[data-artist-calendar] h2')) !== title0, 'week view renders with its own range title');
  await p.getByRole('tab', { name: 'Agenda' }).click();
  check(await until(cal.locator('.fc-list')), 'agenda view renders');
  // Vol. 6 (accepted above) may fall in next month.
  if (!(await cal.locator('.fc-list').innerText()).includes('Tangy Sessions Vol. 6')) await p.getByRole('button', { name: 'Next' }).click();
  check(await until(cal.getByText(/Tangy Sessions Vol\. 6/).first()), 'accepted request now appears as a performance');
  await p.getByRole('tab', { name: 'Month' }).click();
  await p.getByRole('button', { name: 'Today' }).click();

  // Availability on a free day in view (+3 days is always inside the 6-week grid).
  const free = iso(addDays(3));
  await p.getByRole('button', { name: 'Unavailable', exact: true }).click();
  await cal.locator(`td.fc-daygrid-day[data-date="${free}"]`).click();
  check(await until(p.getByRole('status').getByText(`${free} marked unavailable.`)), 'artist marks a day unavailable');
  const row = await api(p, 'GET', `/rest/v1/artist_availability?date=eq.${free}&select=status`);
  check(row.data?.[0]?.status === 'unavailable', 'availability stored server-side');
  check(await until(cal.locator(`td[data-date="${free}"] .tc-avail-unavailable`)), 'calendar shades the unavailable day');
  // A day with a confirmed performance can't be overwritten.
  await cal.locator(`td.fc-daygrid-day[data-date="${iso(new Date())}"]`).click({ position: { x: 5, y: 5 } });
  check(await until(p.getByRole('status').getByText('That date has a confirmed performance — it stays booked.')), 'booked date is protected');
  await p.getByRole('button', { name: 'Clear', exact: true }).click();
  await cal.locator(`td.fc-daygrid-day[data-date="${free}"]`).click();
  check(await until(p.getByRole('status').getByText(`Cleared ${free}.`)), 'artist clears availability');

  // Confirmed performance → event drawer with private details.
  await cal.locator('.fc-event', { hasText: 'Tangy Sessions Vol. 5' }).first().click();
  const drawer = p.getByRole('dialog').last();
  check(await until(drawer.getByText('Your schedule', { exact: true })) && await until(drawer.getByText('Hospitality', { exact: true })), 'performance opens the artist event drawer');
  await shot(p, 'w03-artist-calendar-drawer');
  await p.keyboard.press('Escape');
  check(await p.getByRole('button', { name: 'Export performances (.ics)' }).isEnabled(), 'calendar export is available for upcoming performances');
}

// ---------------------------------------------------------------- profile (public vs private) + avatar
{
  const p = artist.page;
  await p.goto(BASE + '/artist/profile');
  check(await until(p.getByRole('tab', { name: 'Identity' })), 'profile editor opens');
  await p.getByLabel('Stage name').fill('Aria of the Stepwell');
  await p.getByLabel('Phone').fill('+91 90000 00001');
  await p.getByRole('tab', { name: 'Performance' }).click();
  await p.getByLabel('Technical rider').fill('E2E rider: 2 vocal mics, harmonium DI');
  await p.getByRole('button', { name: 'Save profile' }).click();
  check(await until(p.getByRole('status').getByText('Profile saved.')), 'artist saves public + private profile sections');
  const [pub, priv] = await Promise.all([
    api(p, 'GET', '/rest/v1/artists?email=eq.artist@tangy.test&select=stage_name'),
    api(p, 'GET', '/rest/v1/artist_private_profiles?select=phone,technical_rider'),
  ]);
  check(pub.data?.[0]?.stage_name === 'Aria of the Stepwell' && priv.data?.[0]?.phone === '+91 90000 00001' && /E2E rider/.test(priv.data?.[0]?.technical_rider), 'public and private fields stored in their own tables');
  // Avatar upload exercises the artist-avatars ownership policy (0022).
  await p.locator('input[type="file"][accept="image/*"]').setInputFiles(file('e2e-avatar.png'));
  check(await until(p.getByRole('status').getByText('Profile photo updated.')), 'artist uploads a profile photo into their own folder');
  const avatar = (await api(p, 'GET', '/rest/v1/artists?email=eq.artist@tangy.test&select=id,avatar_url')).data?.[0];
  check(avatar?.avatar_url?.includes(`/artist-avatars/${avatar.id}/`) && (await fetch(avatar.avatar_url)).status === 200, 'avatar is served from the public avatars bucket');
  // Anonymous visitors get the public profile only.
  const anon = await fetch(`http://127.0.0.1:54321/rest/v1/public_artists?id=eq.${avatar.id}&select=*`, { headers: { apikey: process.env.ANON_KEY } }).then((r) => r.json());
  check(anon[0]?.stage_name === 'Aria of the Stepwell' && !('email' in anon[0]) && !('phone' in anon[0]), 'public view exposes the stage name, never email/phone');
  const anonPriv = await fetch('http://127.0.0.1:54321/rest/v1/artist_private_profiles?select=phone', { headers: { apikey: process.env.ANON_KEY } });
  const anonRows = anonPriv.ok ? await anonPriv.json() : [];
  check(anonRows.length === 0, `anonymous cannot read private profiles (HTTP ${anonPriv.status})`);
  await p.goto(`${BASE}/artist/profile/${avatar.id}`);
  check(await until(p.getByText('Aria of the Stepwell').first()) && !(await text(p)).includes('+91 90000 00001') && !(await text(p)).includes('E2E rider'), 'public artist page shows no private details');
  await shot(p, 'w06a-artist-profile-public');
}

// ---------------------------------------------------------------- no marketing pop-up on workspace pages
{
  const p = artist.page;
  const overlay = p.getByRole('button', { name: 'Dismiss announcement' });
  await p.evaluate(() => sessionStorage.removeItem('tangy_seen_announcements'));
  for (const path of ['/artist/dashboard', '/artist/calendar', '/artist/media', '/artist/requests', '/artist/settings', '/artist/profile']) {
    await p.goto(BASE + path);
    await p.waitForTimeout(2500);
    check(!(await overlay.count()), `no marketing pop-up on ${path}`);
  }
  // Control: the same (unseen) announcement still appears on the public site.
  await p.goto(BASE + '/artist');
  check(await until(overlay, 8000), 'public artist directory still shows the announcement pop-up');
  await overlay.click();
}

// ---------------------------------------------------------------- media + signed URL preview
let mediaPath;
{
  const p = artist.page;
  await p.goto(BASE + '/artist/media');
  check(await until(p.getByRole('heading', { name: 'Media' })), 'media page opens');
  await p.locator('[data-media-input]').setInputFiles(file('e2e-press-photo.png'));
  const dlg = p.getByRole('dialog').last();
  check(await dlg.getByLabel('Type').inputValue() === 'image', 'media type detected from the file (image → Photo)');
  await dlg.getByLabel('Title').fill('E2E Press photo');
  await dlg.getByLabel('Submit to Tangy for review now').uncheck();
  await dlg.getByRole('button', { name: 'Upload' }).click();
  check(await until(p.getByText('Uploaded. Submit it for review when you are ready.')), 'artist uploads media (kept as draft)');
  const item = p.locator('[data-media="E2E Press photo"]');
  check(await until(item.getByText('Uploaded', { exact: true })), 'media listed as Uploaded');
  mediaPath = (await api(p, 'GET', '/rest/v1/artist_media?title=eq.E2E%20Press%20photo&select=storage_path')).data?.[0]?.storage_path;
  check(!!mediaPath && mediaPath.includes('e2e-press-photo.png'), 'media row points at the private object');

  await item.getByRole('button', { name: 'Archive' }).click();
  check(await until(p.getByText('Archived.', { exact: true })), 'artist archives media');
  await p.getByRole('tab', { name: /Archived/ }).click();
  await item.getByRole('button', { name: 'Restore' }).click();
  check(await until(p.getByText('Restored.', { exact: true })), 'artist restores media');
  await p.getByRole('tab', { name: /Active/ }).click();
  await item.getByRole('button', { name: 'Submit for review' }).click();
  check(await until(item.getByText('Under review')), 'artist submits media for review');

  // Artists can't approve their own media — even through the API.
  const self = await attempt(artist, 'artist self-approve', () => api(p, 'PATCH', `/rest/v1/artist_media?storage_path=eq.${encodeURIComponent(mediaPath)}`, { status: 'approved' }));
  check(self.status >= 400 || (Array.isArray(self.data) && self.data.length === 0), `artist cannot self-approve media (HTTP ${self.status})`);

  await item.getByRole('button', { name: 'Preview E2E Press photo' }).click();
  const img = p.getByRole('dialog').last().locator('img');
  check(await until(img), 'preview modal shows the image');
  const src = await img.getAttribute('src');
  check(/\/storage\/v1\/object\/sign\/artist-media\//.test(src) && /token=/.test(src), 'preview uses a signed URL (never a public one)');
  check(await img.evaluate((el) => el.complete && el.naturalWidth > 0), 'signed URL actually serves the file');
  check((await fetch(src)).status === 200, 'signed URL is fetchable while valid');
  await shot(p, 'w04-artist-media-preview');
  await p.keyboard.press('Escape');
}
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/reviews');
  const row = p.locator('[data-review="E2E Press photo"]');
  check(await until(row), 'curator sees the media in the review queue');
  await row.getByRole('button', { name: 'Preview' }).click();
  check(await until(p.getByRole('dialog').last().locator('img[src*="/object/sign/artist-media/"]')), 'curator previews through a signed URL');
  await p.keyboard.press('Escape');
  await row.getByRole('button', { name: 'Approve' }).click();
  check(await until(row, 8000).then(() => row.waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false)), 'approved media leaves the review queue');
  await p.getByLabel('Status').selectOption({ label: 'All' });
  check(await until(row.getByText('Approved', { exact: true })), 'curator approves the media');
}
{
  const p = artist.page;
  await p.reload();
  check(await until(p.locator('[data-media="E2E Press photo"]').getByText('Approved')), 'artist sees the approval');
  check(!(await p.locator('[data-media="E2E Press photo"]').getByRole('button', { name: /Delete/ }).count()), 'approved media cannot be deleted by the artist');
}

// ---------------------------------------------------------------- settings + notification preferences
{
  const p = artist.page;
  await p.goto(BASE + '/artist/settings');
  const prefs = p.locator('[data-notification-preferences]');
  check(await until(prefs), 'settings shows notification preferences');
  const rows = await text(p, '[data-notification-preferences] tbody');
  check(['Booking requests', 'Schedule changes', 'Messages', 'Documents & media', 'Payments & invoices'].every((l) => rows.includes(l)), 'artist preference categories are listed');
  const sw = p.getByRole('switch', { name: 'Messages email' });
  check((await sw.getAttribute('aria-checked')) === 'true', 'messages email starts on');
  await sw.click();
  check(await until(p.getByRole('status').getByText('Saved')), 'preference saved');
  await p.reload();
  check((await p.getByRole('switch', { name: 'Messages email' }).getAttribute('aria-checked')) === 'false', 'preference persists after reload');
  const stored = await api(p, 'POST', '/rest/v1/rpc/my_notification_preferences', {});
  check(stored.data?.prefs?.messages?.email === false && stored.data?.prefs?.messages?.in_app === true, 'stored server-side (email off, in-app on)');
  await p.getByRole('switch', { name: 'Email notifications' }).click();
  await until(p.getByRole('status').getByText('Saved'));
  check(await p.getByRole('switch', { name: 'Booking requests email' }).isDisabled(), 'master email switch disables per-category email');
  await p.getByRole('switch', { name: 'Email notifications' }).click();
  await p.getByRole('switch', { name: 'Messages email' }).click();
  await until(p.getByRole('status').getByText('Saved'));
  await shot(p, 'w05-artist-settings');
}

// ================================================================ SPONSOR
const sponsor = await signIn('sponsor@tangy.test', '/join/login');
const sponsorId = (await api(sponsor.page, 'GET', '/rest/v1/profiles?email=eq.sponsor@tangy.test&select=id')).data?.[0]?.id;
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard');
  check(await until(p.getByRole('region', { name: 'Next event' }).getByText('Tangy Sessions Vol. 5')), 'sponsor dashboard: next event');
  const tabs = await text(p, '[role="tablist"]');
  check(['Overview', 'My events', 'Messages', 'Documents', 'Brand assets', 'Payments', 'Notifications', 'Deliverables'].every((t) => tabs.toLowerCase().includes(t.toLowerCase())), `sponsor tabs are complete (${tabs})`);
  await p.goto(BASE + '/sponsor/dashboard?tab=events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().click();
  check(await until(p.getByRole('dialog').last().getByText('Title sponsor')), 'sponsor event drawer shows their role');
  await p.keyboard.press('Escape');
  await shot(p, 'w06-sponsor-dashboard');
}
// deliverables
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${ev5}?tab=sponsors`);
  const form = p.locator('form', { has: p.getByLabel('Deliverable') });
  await form.getByLabel('Sponsor').selectOption({ label: 'Saffron Tea Co' });
  await form.getByLabel('Deliverable').fill('E2E Logo on stage banner');
  await form.getByLabel('Due').fill(iso(addDays(1)));
  await form.getByRole('button', { name: 'Add' }).click();
  check(await until(p.getByText('E2E Logo on stage banner')), 'admin adds a sponsor deliverable');
}
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard?tab=deliverables');
  const li = p.locator('li', { hasText: 'E2E Logo on stage banner' });
  check(await until(li) && await until(li.getByText('Pending', { exact: true })), 'sponsor sees the deliverable as pending');
}
{
  const p = admin.page;
  await p.locator('li', { hasText: 'E2E Logo on stage banner' }).getByRole('button', { name: 'Delivered' }).click();
  check(await until(p.locator('li', { hasText: 'E2E Logo on stage banner' }).getByRole('button', { name: 'Reopen' })), 'admin marks it delivered');
}
{
  const p = sponsor.page;
  await p.reload();
  check(await until(p.locator('li', { hasText: 'E2E Logo on stage banner' }).getByText('Delivered', { exact: true })), 'sponsor sees it delivered');
}
// brand assets
let assetPath;
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard?tab=assets');
  await p.getByRole('button', { name: 'Upload' }).click();
  await p.locator('input[type="file"]').setInputFiles(file('e2e-logo.png'));
  const dlg = p.getByRole('dialog').last();
  await dlg.getByLabel('Title').fill('E2E Primary logo');
  await dlg.getByLabel('For event').selectOption({ index: 1 });
  await dlg.getByRole('button', { name: 'Upload' }).click();
  check(await until(p.getByText('Uploaded — Tangy will review it.')), 'sponsor uploads a brand asset');
  check(await until(p.locator('[data-sponsor-assets] li', { hasText: 'E2E Primary logo' }).getByText('Submitted')), 'asset listed as Submitted');
  assetPath = (await api(p, 'GET', '/rest/v1/sponsor_assets?title=eq.E2E%20Primary%20logo&select=storage_path')).data?.[0]?.storage_path;
  check(assetPath?.startsWith(`${sponsorId}/`), 'asset stored under the sponsor’s own folder');
  await shot(p, 'w07-sponsor-assets');
}
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/reviews?tab=assets');
  const row = p.locator('[data-review="E2E Primary logo"]');
  check(await until(row), 'asset appears in the review queue');
  await row.getByRole('button', { name: 'Approve' }).click();
  await row.waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await p.getByLabel('Status').selectOption({ label: 'All' });
  check(await until(row.getByText('Approved', { exact: true })), 'admin approves the brand asset');
}
// payments (invoice lifecycle)
async function createInvoice(p, partner, number, direction, amount) {
  await p.goto(BASE + '/admin-portal/invoices');
  await p.getByRole('button', { name: 'New invoice' }).click();
  const dlg = p.getByRole('dialog').last();
  const opts = await dlg.getByLabel('Partner *').locator('option').allInnerTexts();
  await dlg.getByLabel('Partner *').selectOption({ label: opts.find((o) => o.startsWith(partner)) });
  const evs = await dlg.getByLabel('Event').locator('option').allInnerTexts();
  await dlg.getByLabel('Event').selectOption({ label: evs.find((o) => o.includes('Vol. 5')) });
  await dlg.getByLabel('Direction').selectOption(direction);
  await dlg.getByLabel('Invoice number *').fill(number);
  await dlg.getByLabel('Amount', { exact: true }).fill(String(amount));
  await dlg.getByLabel('Due').fill(iso(addDays(14)));
  await dlg.getByRole('button', { name: 'Save' }).click();
  check(await until(p.getByText('Invoice saved')), `admin drafts invoice ${number}`);
}
await createInvoice(admin.page, 'Saffron Sponsor', 'INV-E2E-S1', 'receivable', 250000);
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard?tab=payments');
  check(await until(p.getByText('No invoices yet')), 'draft invoices are not visible to the partner');
  const leak = await api(p, 'GET', '/rest/v1/partner_invoices?select=invoice_number');
  check(Array.isArray(leak.data) && leak.data.length === 0, 'drafts are hidden at the API too');
}
{
  const p = admin.page;
  await p.getByRole('row', { name: /INV-E2E-S1/ }).getByRole('button', { name: 'Issue' }).click();
  check(await until(p.getByRole('row', { name: /INV-E2E-S1/ }).getByText('Issued')), 'admin issues the invoice');
}
{
  const p = sponsor.page;
  await p.reload();
  const inv = p.locator('[data-invoices] li', { hasText: 'INV-E2E-S1' });
  check(await until(inv), 'sponsor sees the issued invoice');
  const t = await text(p, '[data-invoices]');
  check(/INR 2,50,000|INR 250,000/.test(t) && /Payable by you/i.test(t) && /Issued/i.test(t), `invoice shows amount, direction and status (${t.slice(0, 120)})`);
}
// notifications
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard?tab=notifications');
  const list = p.locator('[data-notifications]');
  check(await until(list.getByText('Brand asset approved: E2E Primary logo')), 'sponsor notified of the asset review');
  check(await until(list.getByText('Invoice issued: INV-E2E-S1')), 'sponsor notified of the invoice');
  await p.getByRole('tab', { name: 'Payments' }).last().click();
  const filtered = await list.getByText('Brand asset approved: E2E Primary logo').waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false);
  check(filtered && await until(list.getByText('Invoice issued: INV-E2E-S1')), 'notification category filter works');
  check(await until(p.locator('[data-notification-preferences]')), 'sponsor has notification preferences');
}
// messages
async function partnerMessage(s, dash, subject, body) {
  const p = s.page;
  await p.goto(`${BASE}${dash}?tab=messages`);
  await p.getByRole('button', { name: 'New message' }).click();
  const dlg = p.getByRole('dialog').last();
  const opts = await dlg.getByRole('combobox').first().locator('option').allInnerTexts();
  await dlg.getByRole('combobox').first().selectOption({ label: opts.find((o) => o.includes('Tangy Sessions Vol. 5')) });
  await dlg.getByLabel('Subject').fill(subject);
  await dlg.getByLabel('Message *').fill(body);
  await dlg.getByRole('button', { name: 'Send' }).click();
  check(await until(p.locator('[data-messages-panel]').getByText(body)), `${dash.split('/')[1]} sends a message to Tangy`);
}
async function adminReply(from, body, reply) {
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/messages');
  await p.getByRole('button', { name: new RegExp(from) }).first().click();
  check(await until(p.getByText(body)), `admin opens the ${from} thread`);
  await p.getByLabel('Message', { exact: true }).fill(reply);
  await p.getByLabel('Message', { exact: true }).press('Enter');
  check(await until(p.locator('[data-messages-panel]').getByText(reply)), `admin replies to ${from}`);
}
async function seesReply(s, dash, subject, reply) {
  const p = s.page;
  await p.goto(`${BASE}${dash}?tab=messages`);
  await p.getByRole('button', { name: new RegExp(subject) }).first().click();
  check(await until(p.getByRole('region', { name: 'Conversation' }).getByText(reply)), `${dash.split('/')[1]} sees the reply`);
}
await partnerMessage(sponsor, '/sponsor/dashboard', 'Banner size', 'What size should the stage banner be?');
await adminReply('Saffron Sponsor', 'What size should the stage banner be?', '3m × 1m, vinyl.');
await seesReply(sponsor, '/sponsor/dashboard', 'Banner size', '3m × 1m, vinyl.');

// ================================================================ VENDOR
const vendor = await signIn('vendorco@tangy.test', '/join/login');
{
  const p = vendor.page;
  await p.goto(BASE + '/vendor/dashboard');
  check(await until(p.getByRole('region', { name: 'Next event' }).getByText('Tangy Sessions Vol. 5')), 'vendor dashboard: next event');
  const tabs = await text(p, '[role="tablist"]');
  check(['My events', 'Requirements', 'Messages', 'Documents', 'Payments', 'Notifications'].every((t) => tabs.toLowerCase().includes(t.toLowerCase())) && !/brand assets/i.test(tabs), `vendor tabs are complete, no sponsor-only tabs (${tabs})`);
}
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${ev5}?tab=schedule`);
  await p.locator('table').nth(1).getByRole('row', { name: /Chai Collective/ }).getByRole('button', { name: 'Edit' }).click();
  const d = p.getByRole('dialog').last();
  await d.getByLabel('Setup').fill(`${iso(new Date())}T14:00`);
  await d.getByLabel('Loading access').fill('E2E Loading bay B from 2 PM');
  await d.getByLabel('On-site contact').fill('Priya · 98xxxxxx01');
  await d.getByRole('button', { name: 'Save' }).click();
  check(await until(p.getByText('Timings saved')), 'admin sets vendor logistics');

  await p.goto(`${BASE}/admin-portal/events/${ev5}?tab=requirements`);
  const from = p.getByLabel('Requirement recipient');
  await from.locator('option', { hasText: 'Chai Collective' }).waitFor({ state: 'attached' });
  await from.selectOption({ label: (await from.locator('option').allInnerTexts()).find((o) => o.startsWith('Chai Collective')) });
  await p.getByLabel("What's needed").fill('FSSAI licence number');
  await p.getByRole('button', { name: 'Request' }).click();
  check(await until(p.getByText('Requirement sent')), 'admin requests a document from the vendor');
}
{
  const p = vendor.page;
  await p.goto(BASE + '/vendor/dashboard?tab=events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().click();
  const drawer = p.getByRole('dialog').last();
  check(await until(drawer.getByText(/Logistics ·/)) && await until(drawer.getByText('E2E Loading bay B from 2 PM')) && await until(drawer.getByText('Priya · 98xxxxxx01')), 'vendor drawer shows logistics and on-site contact');
  check(!(await drawer.getByText('Hospitality').count()), 'vendor drawer never shows artist hospitality');
  await shot(p, 'w08-vendor-drawer');
  await p.keyboard.press('Escape');
  await p.goto(BASE + '/vendor/dashboard?tab=requirements');
  await p.getByLabel('Response to FSSAI licence number').fill('13622011000123');
  await p.getByRole('button', { name: 'Submit' }).click();
  check(await until(p.getByText('Submitted', { exact: true })), 'vendor submits the requirement');
}
await createInvoice(admin.page, 'Chai Collective', 'INV-E2E-V1', 'payable', 18000);
{
  const p = admin.page;
  await p.getByRole('row', { name: /INV-E2E-V1/ }).getByRole('button', { name: 'Issue' }).click();
  await until(p.getByRole('row', { name: /INV-E2E-V1/ }).getByText('Issued'));
  await p.getByRole('row', { name: /INV-E2E-V1/ }).getByRole('button', { name: 'Mark paid' }).click();
  check(await until(p.getByRole('row', { name: /INV-E2E-V1/ }).getByText('Paid')), 'admin issues and pays the vendor invoice');
}
{
  const p = vendor.page;
  await p.goto(BASE + '/vendor/dashboard?tab=payments');
  const t = await until(p.locator('[data-invoices]')) ? await text(p, '[data-invoices]') : '';
  check(/INV-E2E-V1/.test(t) && /Payable to you/i.test(t) && /Paid/i.test(t) && !/INV-E2E-S1/.test(t), `vendor sees only their own paid invoice (${t.slice(0, 120)})`);
  await p.goto(BASE + '/vendor/dashboard?tab=notifications');
  const list = p.locator('[data-notifications]');
  check(await until(list.getByText('Tangy needs: FSSAI licence number')) && await until(list.getByText('Invoice paid: INV-E2E-V1')), 'vendor notified of the requirement and payment');
}
await partnerMessage(vendor, '/vendor/dashboard', 'Power', 'Do we get a 16A socket at the counter?');
await adminReply('Chai Collective', 'Do we get a 16A socket at the counter?', 'Yes — one 16A line at stall 4.');
await seesReply(vendor, '/vendor/dashboard', 'Power', 'Yes — one 16A line at stall 4.');

// ================================================================ VENUE HOST
const venue = await signIn('venue@tangy.test', '/join/login');
{
  const p = venue.page;
  await p.goto(BASE + '/venue/dashboard');
  check(await until(p.getByRole('region', { name: 'Next event' }).getByText('Tangy Sessions Vol. 5')), 'venue host dashboard: hosted event');
  const tabs = await text(p, '[role="tablist"]');
  check(['Upcoming events', 'Messages', 'Documents', 'Notifications'].every((t) => tabs.toLowerCase().includes(t.toLowerCase())), `venue host tabs are complete (${tabs})`);
}
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${ev5}?tab=details`);
  await p.getByLabel('Doors open').fill(`${iso(new Date())}T18:30`);
  await p.getByRole('button', { name: 'Save changes' }).click();
  check(await until(p.getByText('Event saved')), 'admin sets the doors time');
}
{
  const p = venue.page;
  await p.goto(BASE + '/venue/dashboard?tab=events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().click();
  const drawer = p.getByRole('dialog').last();
  check(await until(drawer.getByText(/Logistics ·/)) && await until(drawer.getByText('Doors')) && /6:30\s*pm/i.test(await drawer.innerText()), 'venue host sees doors time in logistics');
  await shot(p, 'w09-venue-drawer');
  await p.keyboard.press('Escape');
  await p.goto(BASE + '/venue/dashboard?tab=notifications');
  check(await until(p.locator('[data-notifications]').getByText('Tangy Sessions Vol. 5 — details changed')), 'venue host notified of the event change');
}
await partnerMessage(venue, '/venue/dashboard', 'Curfew', 'Sound must stop by 10:30 PM.');
await adminReply('Hema Host', 'Sound must stop by 10:30 PM.', 'Noted — last set ends 10:15 PM.');
await seesReply(venue, '/venue/dashboard', 'Curfew', 'Noted — last set ends 10:15 PM.');

// ================================================================ SECURITY
// Documents: one private file for artists only, one for the vendor only.
let artistDocPath;
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${ev5}?tab=documents`);
  const share = async (title, audience, person) => {
    await p.getByLabel('Title').fill(title);
    await p.getByLabel('Shared with').selectOption(audience);
    if (person) {
      const opts = await p.getByLabel('Person').locator('option').allInnerTexts();
      await p.getByLabel('Person').selectOption({ label: opts.find((o) => o.startsWith(person)) });
    }
    await p.getByLabel('Document file').setInputFiles(file(`e2e-${audience}.png`));
    await p.getByRole('button', { name: 'Share document' }).click();
    check(await until(p.getByText('Document shared')), `admin shares "${title}" (${audience})`);
    await p.getByText('Document shared').waitFor({ state: 'detached' }).catch(() => {});
  };
  await share('E2E Stage plot', 'artist');
  await share('E2E Vendor pass', 'user', 'Chai Collective');
  artistDocPath = (await api(p, 'GET', '/rest/v1/event_documents?title=eq.E2E%20Stage%20plot&select=storage_path')).data?.[0]?.storage_path;
  check(artistDocPath?.startsWith(`events/${ev5}/`), 'document stored in the private event-documents bucket');
}
{
  const p = artist.page;
  await p.goto(BASE + '/artist/dashboard?tab=documents');
  check(await until(p.locator('[data-document="E2E Stage plot"]')), 'artist sees the artist-only document');
  check(!(await p.locator('[data-document="E2E Vendor pass"]').count()), 'artist does not see the vendor’s personal document');
  const [tab] = await Promise.all([artist.context.waitForEvent('page'), p.locator('[data-document="E2E Stage plot"]').getByRole('button', { name: 'Open' }).click()]);
  await tab.waitForURL(/\/object\/sign\/event-documents\//, { timeout: 10000 }).catch(() => {});
  check(/\/storage\/v1\/object\/sign\/event-documents\/.*token=/.test(tab.url()), 'document opens through a signed URL');
  await tab.close();
}
{
  const s = vendor; const p = s.page;
  await p.goto(BASE + '/vendor/dashboard?tab=documents');
  check(await until(p.locator('[data-document="E2E Vendor pass"]')), 'vendor sees their personal document');
  check(!(await p.locator('[data-document="E2E Stage plot"]').count()), 'vendor does not see the artist-only document');
  const docs = await api(p, 'GET', '/rest/v1/event_documents?title=eq.E2E%20Stage%20plot&select=id');
  check(Array.isArray(docs.data) && docs.data.length === 0, 'cross-role document row is hidden at the API');
  const signDoc = await attempt(s, 'vendor→artist document', () => storageFetch(p, 'POST', `/object/sign/event-documents/${artistDocPath}`, { expiresIn: 60 }));
  check(signDoc.status >= 400 && !signDoc.data?.signedURL, `vendor cannot sign the artist document (HTTP ${signDoc.status})`);
  const readDoc = await attempt(s, 'vendor→artist document', () => storageFetch(p, 'GET', `/object/authenticated/event-documents/${artistDocPath}`));
  check(readDoc.status >= 400, `vendor cannot download the artist document (HTTP ${readDoc.status})`);
  const signMedia = await attempt(s, 'vendor→artist media', () => storageFetch(p, 'POST', `/object/sign/artist-media/${mediaPath}`, { expiresIn: 60 }));
  check(signMedia.status >= 400 && !signMedia.data?.signedURL, `vendor cannot sign artist media (HTTP ${signMedia.status})`);
  const signAsset = await attempt(s, 'vendor→sponsor asset', () => storageFetch(p, 'POST', `/object/sign/sponsor-assets/${assetPath}`, { expiresIn: 60 }));
  check(signAsset.status >= 400 && !signAsset.data?.signedURL, `vendor cannot sign sponsor brand assets (HTTP ${signAsset.status})`);
  const list = await attempt(s, 'vendor list artist-media', () => storageFetch(p, 'POST', '/object/list/artist-media', { prefix: '', limit: 100 }));
  check(Array.isArray(list.data) ? list.data.length === 0 : list.status >= 400, 'vendor cannot list the artist-media bucket');
  const upload = await attempt(s, 'vendor upload into sponsor folder', () => p.evaluate(async ({ url, anon, sponsorId }) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
    const token = JSON.parse(localStorage.getItem(key)).access_token;
    return (await fetch(`${url}/object/sponsor-assets/${sponsorId}/e2e-planted.png`, { method: 'POST', body: new Blob(['x'], { type: 'image/png' }), headers: { apikey: anon, Authorization: `Bearer ${token}` } })).status;
  }, { url: STORAGE, anon: process.env.ANON_KEY, sponsorId }));
  check(upload >= 400, `vendor cannot plant a file in the sponsor’s folder (HTTP ${upload})`);
}
{
  // Anonymous: private buckets have no public URLs.
  for (const [bucket, path] of [['artist-media', mediaPath], ['sponsor-assets', assetPath], ['event-documents', artistDocPath]]) {
    const r = await fetch(`${STORAGE}/object/public/${bucket}/${path}`);
    check(r.status >= 400, `no public URL for ${bucket} (HTTP ${r.status})`);
  }
  const forged = await fetch(`${STORAGE}/object/sign/artist-media/${mediaPath}?token=forged.token.value`);
  check(forged.status >= 400, `a forged signed-URL token is rejected (HTTP ${forged.status})`);
}
{
  const s = sponsor; const p = s.page;
  // Sponsor ↔ artist media and vendor documents, and the sponsor's own asset.
  const own = await storageFetch(p, 'POST', `/object/sign/sponsor-assets/${assetPath}`, { expiresIn: 60 });
  check(own.status === 200 && !!own.data?.signedURL, 'sponsor can sign their own asset');
  const media = await attempt(s, 'sponsor→artist media', () => storageFetch(p, 'POST', `/object/sign/artist-media/${mediaPath}`, { expiresIn: 60 }));
  check(media.status >= 400, `sponsor cannot sign artist media (HTTP ${media.status})`);
  const docs = await api(p, 'GET', '/rest/v1/event_documents?select=title');
  check(Array.isArray(docs.data) && !docs.data.some((d) => /^E2E (Stage plot|Vendor pass)$/.test(d.title)), 'sponsor sees neither the artist nor the vendor document');
}
{
  // Cross-partner messages: the vendor can't read the sponsor's thread or the venue's.
  const s = vendor; const p = s.page;
  const convs = (await api(admin.page, 'GET', '/rest/v1/conversations?select=id,subject&subject=in.(%22Banner%20size%22,%22Curfew%22)')).data || [];
  check(convs.length === 2, 'admin can see both partner threads');
  for (const c of convs) {
    const rows = await api(p, 'GET', `/rest/v1/messages?conversation_id=eq.${c.id}&select=content`);
    check(Array.isArray(rows.data) && rows.data.length === 0, `vendor cannot read the "${c.subject}" thread via REST`);
    const rpc = await attempt(s, `vendor→${c.subject} thread`, () => api(p, 'POST', '/rest/v1/rpc/conversation_messages', { p_conversation_id: c.id }));
    check(rpc.status >= 400 || (Array.isArray(rpc.data) && rpc.data.length === 0), `vendor cannot read the "${c.subject}" thread via RPC (HTTP ${rpc.status})`);
    const send = await attempt(s, `vendor→${c.subject} send`, () => api(p, 'POST', '/rest/v1/messages', { conversation_id: c.id, content: 'injected' }));
    check(send.status >= 400, `vendor cannot post into the "${c.subject}" thread (HTTP ${send.status})`);
  }
  await p.goto(BASE + '/vendor/dashboard?tab=messages');
  await until(p.getByRole('button', { name: /Power/ }).first());
  const inbox = await text(p, '[data-messages-panel]');
  check(!/Banner size|Curfew/.test(inbox), 'vendor inbox lists only their own thread');
  await p.goto(`${BASE}/vendor/dashboard?tab=messages&c=${convs[0].id}`);
  await attempt(s, 'vendor deep link', () => until(p.getByText('Conversation not found.')));
  check(await p.getByText('Conversation not found.').isVisible(), 'vendor deep link to another partner’s thread is refused');
}

for (const [label, s] of [['admin', admin], ['artist', artist], ['sponsor', sponsor], ['vendor', vendor], ['venue', venue]]) {
  track(label, s.errors);
  await s.browser.close();
}
console.log('\nEXPECTED REFUSALS (deliberate attacks):\n' + (refused.join('\n') || '(none)'));
console.log('\nERRORS:\n' + (allErrors.join('\n') || '(none)'));
