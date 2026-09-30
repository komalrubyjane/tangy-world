import { execFileSync } from 'node:child_process';
import { launch, otpLogin, shot, check, api, BASE, sectionTab } from './lib.mjs';

// Content CMS (0028) end to end: a manager drafts and publishes a diary post,
// renames a Tangy TV video and builds a gallery album in Admin → Content; a
// signed-out visitor sees drafts as 404 and published items on /diary, /tv
// and /gallery. Ticket types edited in the event's Tickets tab reach the
// public session page. Staff without content rights get no content nav and
// the database refuses their direct writes. Also: 404 page, FAQ, artist page.

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const text = async (p) => (await p.locator('main, body').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
const allErrors = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(400 POST \/rest\/v1\/diary_posts|401|403|404|406)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));

// A priced session only this suite touches.
sql(`insert into events (slug, name, event_date, venue, capacity, price, status, description)
     values ('e2e-pricing', 'E2E Pricing Night', current_date + 20, 'Taramati Baradari', 40, 700, 'on-sale', 'Pricing check.')
     on conflict (slug) do nothing`);
const PRICING = sql("select id from events where slug = 'e2e-pricing'");

// --- Manager: diary draft ---------------------------------------------------------
const m = await launch();
await otpLogin(m.page, 'manager@tangy.test');
await m.page.goto(`${BASE}/admin-portal/content/diary`);
const seen = (loc) => loc.waitFor({ timeout: 10000 }).then(() => true, () => false);
check(await seen(m.page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Diary', exact: true })), 'manager: Content → Diary is in the sidebar');
check(await seen(m.page.getByRole('link', { name: 'Content', exact: true }).first()), 'manager: nav says "Content"');
await m.page.getByRole('button', { name: /new post/i }).click();
await m.page.getByLabel('Title *').fill('E2E Diary Test');
check(await m.page.getByLabel('URL slug *').inputValue() === 'e2e-diary-test', 'slug is generated from the title');
await m.page.getByRole('button', { name: 'Save' }).click();
check(await m.page.getByText(/published post needs a body|All changes saved|Post saved/i).first().waitFor({ timeout: 8000 }).then(() => true, () => false), 'draft saves without a body');
await m.page.getByLabel('Body *').fill('First paragraph of the e2e post.\n\nSecond paragraph.');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText('All changes saved').waitFor({ timeout: 8000 }).catch(() => {});
check(sql("select status from diary_posts where slug = 'e2e-diary-test'") === 'draft', 'the post is stored as a draft');
await shot(m.page, 'content-01-diary-editor');

// --- Visitor: drafts are invisible --------------------------------------------------
const v = await launch();
await v.page.goto(`${BASE}/diary/e2e-diary-test`);
check(await v.page.locator('[data-not-found]').waitFor({ timeout: 10000 }).then(() => true, () => false), 'visitor: a draft post is a 404');

// --- Manager publishes ---------------------------------------------------------------
await m.page.getByLabel('Publish status').selectOption('published');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText('All changes saved').waitFor({ timeout: 8000 }).catch(() => {});
check(sql("select status || '/' || (published_at is not null) from diary_posts where slug = 'e2e-diary-test'") === 'published/true', 'publishing stamps published_at');

await v.page.goto(`${BASE}/diary`);
await v.page.getByText('E2E Diary Test').first().waitFor({ timeout: 10000 }).catch(() => {});
check((await text(v.page)).includes('E2E Diary Test'), 'visitor: the published post is on /diary');
check(!(await text(v.page)).toUpperCase().includes('WHY WE PLAY INSIDE A STEPWELL'), 'visitor: imported drafts stay hidden');
await v.page.goto(`${BASE}/diary/e2e-diary-test`);
await v.page.locator('[data-diary-post]').waitFor({ timeout: 10000 }).catch(() => {});
check((await text(v.page)).includes('Second paragraph.'), 'visitor: /diary/:slug renders the body');
check((await v.page.title()).startsWith('E2E Diary Test'), 'visitor: the page title is the post title');
await shot(v.page, 'content-02-diary-post');

// --- Tangy TV --------------------------------------------------------------------------
await m.page.goto(`${BASE}/admin-portal/content/tv`);
await m.page.getByText('Field Recording — Vol. 22402').first().click();
await m.page.getByLabel('Title *').fill('E2E Field Recording');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText('All changes saved').waitFor({ timeout: 8000 }).catch(() => {});
await v.page.goto(`${BASE}/tv`);
await v.page.locator('[data-tv-card]').first().waitFor({ timeout: 10000 }).catch(() => {});
check((await text(v.page)).includes('E2E Field Recording'), 'visitor: an admin TV rename is what every visitor sees on /tv');
await v.page.goto(`${BASE}/tv/field-recording-22402`);
check(await v.page.locator('[data-tv-video] video').waitFor({ timeout: 10000 }).then(() => true, () => false), 'visitor: /tv/:slug plays the video');
await shot(v.page, 'content-03-tv');
await m.page.goto(`${BASE}/admin-portal/ops/tv`);
check(await m.page.waitForURL(/\/admin-portal\/content\/tv$/, { timeout: 10000 }).then(() => true, () => false), 'the old ops/tv page redirects to Content → Tangy TV');

// --- Gallery ------------------------------------------------------------------------------
await m.page.goto(`${BASE}/admin-portal/content/gallery`);
await m.page.getByRole('button', { name: /new album/i }).click();
await m.page.getByLabel('Title *').fill('E2E Album');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText('All changes saved').waitFor({ timeout: 8000 }).catch(() => {});
await m.page.getByLabel('Add a photo').fill('/media/gallery/tangy2.jpg');
await m.page.getByRole('button', { name: 'Add photo' }).click();
check(await m.page.getByText(/alt text/i).first().isVisible(), 'a photo without alt text is refused');
await m.page.getByLabel('Alt text *').fill('The stage before the doors open');
await m.page.getByRole('button', { name: 'Add photo' }).click();
await m.page.getByText('Photos (1)').waitFor({ timeout: 8000 }).catch(() => {});
await m.page.getByLabel('Publish status').selectOption('published');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText('All changes saved').waitFor({ timeout: 8000 }).catch(() => {});
await v.page.goto(`${BASE}/gallery/e2e-album`);
const photo = v.page.locator('[data-album-photos] img').first();
check(await photo.waitFor({ timeout: 10000 }).then(() => true, () => false) && (await photo.getAttribute('alt')) === 'The stage before the doors open', 'visitor: the album shows the photo with its alt text');
await v.page.goto(`${BASE}/gallery`);
check(await seen(v.page.locator('[data-album-card]', { hasText: 'E2E Album' })), 'visitor: the album is listed on /gallery');
await shot(v.page, 'content-04-gallery');

// --- Ticket types flow to the session page ----------------------------------------------------
await m.page.goto(`${BASE}/admin-portal/events/${PRICING}?tab=tickets`);
await m.page.locator('[data-ticket-types]').waitFor({ timeout: 10000 });
await m.page.getByRole('button', { name: /edit general admission/i }).click();
await m.page.getByLabel('Price (₹) *').fill('850');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText(/ticket type saved/i).waitFor({ timeout: 8000 }).catch(() => {});
await m.page.getByRole('button', { name: 'Add type' }).click();
await m.page.getByLabel('Name *').fill('Front Row');
await m.page.getByLabel('Code *').fill('front');
await m.page.getByLabel('Price (₹) *').fill('1500');
await m.page.getByLabel('Limit').fill('5');
await m.page.getByRole('button', { name: 'Save' }).click();
await m.page.getByText(/ticket type saved/i).waitFor({ timeout: 8000 }).catch(() => {});
check(sql(`select string_agg(code || ':' || price, ',' order by price) from event_ticket_types where event_id = '${PRICING}'`) === 'gen:850,front:1500', 'admin: price edit and a new type are stored');
check(sql(`select price from events where id = '${PRICING}'`) === '850', 'the session\'s "from" price follows the cheapest type');
await shot(m.page, 'content-05-ticket-types');
await v.page.goto(`${BASE}/sessions/e2e-pricing`);
await v.page.locator('[data-seats-left]').waitFor({ timeout: 10000 }).catch(() => {});
const sessionText = await text(v.page);
check(sessionText.includes('₹850') && sessionText.includes('40 SEATS LEFT'), 'visitor: the session page shows the server price and seats');
check(!/VIP Heritage Pass|Backstage Collective Pass|42\.5K/i.test(sessionText), 'visitor: no hard-coded tiers or fabricated artists on the session page');

// --- Staff without content rights ---------------------------------------------------------------
const s = await launch();
await otpLogin(s.page, 'staff@tangy.test');
await s.page.goto(`${BASE}/admin-portal`);
await s.page.locator('nav').first().waitFor();
await seen(s.page.getByRole('link', { name: 'Announcements', exact: true }).first());
check(!(await s.page.getByRole('link', { name: 'Content', exact: true }).count()), 'staff: no Content section in the nav');
await s.page.goto(`${BASE}/admin-portal/content`);
check(await seen(s.page.getByText(/don.t have permission/i).first()), 'staff: the Content URL is forbidden');
const staffPublish = await api(s.page, 'POST', '/rest/v1/diary_posts', { slug: 'e2e-staff', title: 'Staff post', status: 'published' });
check(staffPublish.status === 400 && /permission to publish/i.test(staffPublish.data?.message || ''), `staff: publishing directly is refused by the database (${staffPublish.status})`);
const staffDraft = await api(s.page, 'POST', '/rest/v1/diary_posts', { slug: 'e2e-staff', title: 'Staff post' });
check(staffDraft.status === 401 || staffDraft.status === 403, `staff: even a draft insert is refused by RLS (${staffDraft.status})`);
const staffDrafts = await api(s.page, 'GET', '/rest/v1/diary_posts?select=slug&status=eq.draft');
check(Array.isArray(staffDrafts.data) && staffDrafts.data.length === 0, 'staff: drafts are not readable');

// --- Public pages ------------------------------------------------------------------------------------
await v.page.goto(`${BASE}/this-page-does-not-exist`);
check(await v.page.locator('[data-not-found]').waitFor({ timeout: 10000 }).then(() => true, () => false) && v.page.url().endsWith('/this-page-does-not-exist'), 'unknown URLs show a 404 page (no silent redirect home)');
await v.page.goto(`${BASE}/faq`);
check(await seen(v.page.getByText('What happens when seats are offered to me?')), '/faq explains the waitlist');
await v.page.goto(`${BASE}/artists/aria-artist`);
check(await v.page.locator('[data-artist-page]').waitFor({ timeout: 10000 }).then(() => true, () => false), '/artists/:slug shows an approved artist');
await v.page.goto(`${BASE}/artists/no-such-artist`);
check(await v.page.locator('[data-not-found]').waitFor({ timeout: 10000 }).then(() => true, () => false), 'an unknown artist slug is a 404');

track('manager', m.errors); track('visitor', v.errors); track('staff', s.errors);
await Promise.all([m.browser.close(), v.browser.close(), s.browser.close()]);
console.log('\nERRORS:\n' + (allErrors.length ? allErrors.join('\n') : '(none)'));
if (allErrors.length) process.exitCode = 1;
