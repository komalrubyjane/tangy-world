// The event ↔ artist workflow end to end (0034), on the demo dataset:
// create an event with several artists (availability from each artist's own
// calendar: available / tentative / busy / unavailable), publish → line-up
// notified, session request → accept / decline, date change → notified and
// calendars move, availability update → admin sees it, admin artist calendar,
// cancellation; Super Admin custom notification and private messaging; role
// change → notified, new dashboard, old access gone; homepage diary (two
// entries, no scroll hijack) and Tangy Calendar (live event data); security
// refusals; phones and keyboard.
import { execFileSync } from 'node:child_process';
import { launch, otpLogin, check, api, BASE } from './lib.mjs';

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const until = (loc, timeout = 15000) => loc.first().waitFor({ timeout }).then(() => true, () => false);
const gone = (loc, timeout = 15000) => loc.first().waitFor({ state: 'detached', timeout }).then(() => true, () => false);
const d = (n) => `de300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ANANYA = d(401), KABIR = d(402), CHARMINAR = d(403), ZOYA = d(404);
const U = { ananya: d(110), kabir: d(111), zoya: d(113), director: d(103), ops: d(101), desk: d(102) };
const notes = (uid, type, since) => Number(sql(`select count(*) from notifications where user_id = '${uid}' and type = '${type}'${since ? ` and created_at >= '${since}'` : ''}`));
const day = (n) => sql(`select (current_date + ${n})::text`);
const D = day(40), D2 = day(41), DH = day(1);
const NOW = sql('select now()');

// --- Setup: a clean slate for this suite's own records -----------------------------------------
sql(`delete from events where slug like 'e2e-wf-%'`);
sql(`delete from messages where content like 'E2E%' and conversation_id in (select id from conversations where conversation_type = 'artist_private')`);
sql(`update profiles set role = 'staff' where id = '${U.desk}'`);
// The four artists' answers on D: Ananya available, Zoya tentative, Kabir unavailable, Charminar busy (booked elsewhere).
sql(`set session_replication_role = replica; insert into artist_availability (artist_id, date, status, note) values
  ('${ANANYA}', '${D}', 'available', null), ('${ZOYA}', '${D}', 'tentative', 'Holding for a family event'), ('${KABIR}', '${D}', 'unavailable', 'Touring in Pune'),
  ('${ANANYA}', '${D2}', 'available', null)
  on conflict (artist_id, date) do update set status = excluded.status, note = excluded.note`);
sql(`insert into events (slug, name, event_date, venue, capacity, price, status) values ('e2e-wf-other', 'E2E Other Night', '${D}', 'Elsewhere', 50, 500, 'on-sale')`);
const OTHER = sql(`select id from events where slug = 'e2e-wf-other'`);
sql(`insert into event_artists (event_id, artist_id) values ('${OTHER}', '${CHARMINAR}')`);

const ops = await launch();
await otpLogin(ops.page, 'ops@demo.tangy.local');

// --- 1. Create an event; the date drives availability ----------------------------------------------
await ops.page.goto(BASE + '/admin-portal/events/new');
await ops.page.getByLabel('Event name *').fill('E2E WF Night');
await ops.page.getByLabel('URL slug').fill('e2e-wf-night');
await ops.page.getByLabel('Category').selectOption('concert');
check(await ops.page.getByRole('button', { name: 'Add artist' }).isDisabled(), 'artists wait for a date');
await ops.page.getByLabel('Date *').fill(D);
await ops.page.getByLabel('Location (as shown to guests)').fill('Stepwell (E2E)');
await ops.page.getByRole('button', { name: 'Add artist' }).click();
const picker = ops.page.getByRole('dialog');
await picker.locator('[data-artist-row]').first().waitFor();
const rowState = async (name) => picker.locator(`[data-artist-row="${name}"] [data-availability]`).getAttribute('data-availability');
check(await rowState('Ananya Rao') === 'available', 'Ananya shows as available (from her own calendar)');
check(await rowState('Zoya Qadri') === 'tentative', 'Zoya shows as tentative');
check(await rowState('The Charminar Collective') === 'busy', 'The Charminar Collective shows as busy (booked that day)');
check(/Booked: E2E Other Night/.test(await picker.locator('[data-artist-row="The Charminar Collective"] [data-availability-detail]').innerText()), '… with the clashing booking');
check(await rowState('Kabir Sethi') === 'unavailable', 'Kabir shows as unavailable');
check(await picker.getByLabel(/Select The Charminar Collective/).isDisabled(), 'a busy artist cannot be selected');
check(await picker.locator('[data-availability-group]').first().getAttribute('data-availability-group') === 'available', 'available artists are listed first');
await picker.locator('[data-filter="busy"]').click();
check(await gone(picker.locator('[data-artist-row="Ananya Rao"]')) && await until(picker.locator('[data-artist-row="The Charminar Collective"]')), 'the Busy filter shows only busy artists');
await picker.locator('[data-filter="all"]').click();
const everyone = await picker.locator('[data-artist-row]').count();
await picker.getByRole('searchbox').fill('kochi');
check(await gone(picker.locator('[data-artist-row="Ananya Rao"]')) && await picker.locator('[data-artist-row]').count() < everyone
  && (await picker.locator('[data-artist-row]').allInnerTexts()).every((t) => /Kochi/i.test(t)), 'search narrows by city');
await picker.getByRole('searchbox').fill('sarod');
check(await until(picker.locator('[data-artist-row="Rafiq Ansari"]')) && (await picker.locator('[data-artist-row]').count()) < everyone, 'search finds by instrument');
await picker.getByRole('searchbox').fill('');
await picker.getByRole('button', { name: /View Zoya Qadri's calendar/ }).click();
const drawer = ops.page.getByRole('dialog', { name: 'Zoya Qadri' });
check(await until(drawer.locator('[data-artist-calendar]')), 'an artist\'s full calendar opens in a drawer (the shared calendar)');
await drawer.getByRole('button', { name: 'Close' }).click();
await picker.getByLabel('Select Ananya Rao').check();
await picker.getByLabel('Select Zoya Qadri').check();
await picker.getByRole('button', { name: 'Add selected artists' }).click();
const cardAnanya = ops.page.locator('[data-lineup-card="Ananya Rao"]');
const cardZoya = ops.page.locator('[data-lineup-card="Zoya Qadri"]');
check(await until(cardAnanya) && await until(cardZoya), 'both artists appear as removable cards');
await cardAnanya.getByRole('button', { name: 'Add to line-up' }).click();
await cardZoya.getByRole('button', { name: 'Add to line-up' }).click();
await cardAnanya.getByLabel('Performance type for Ananya Rao').fill('Live set');
await cardAnanya.getByLabel('Set start for Ananya Rao').fill('19:00');
await cardAnanya.getByLabel('Set end for Ananya Rao').fill('19:45');
await cardZoya.getByLabel('Set start for Zoya Qadri').fill('19:30');
await cardZoya.getByLabel('Set end for Zoya Qadri').fill('20:15');
await ops.page.getByRole('button', { name: 'Create event' }).click();
check(await until(ops.page.getByText('Overlaps another set')), 'overlapping sets are caught before saving');
await cardZoya.getByLabel('Set start for Zoya Qadri').fill('20:00');
await cardZoya.getByLabel('Set end for Zoya Qadri').fill('20:45');
check(/Nothing|told .*when you publish/.test(await ops.page.locator('[data-notification-summary]').innerText()), 'the editor says nothing is sent while it is a draft');
await ops.page.getByRole('button', { name: 'Create event' }).click();
await ops.page.waitForURL(/\/admin-portal\/events\/[0-9a-f-]{36}$/);
const EV = sql(`select id from events where slug = 'e2e-wf-night'`);
check(/^[0-9a-f-]{36}$/.test(EV), 'the event is created');
check(sql(`select string_agg(coalesce(a.stage_name, a.name) || ':' || d.performance_order, ',' order by d.performance_order) from event_artists ea join artists a on a.id = ea.artist_id join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id where ea.event_id = '${EV}'`) === 'Ananya Rao:1,Zoya Qadri:2',
  'the event stores both artist assignments with their order');
check(sql(`select to_char(performance_start at time zone 'Asia/Kolkata', 'HH24:MI') from event_artist_details where event_id = '${EV}' and artist_id = '${ANANYA}'`) === '19:00', '… and set times in the event\'s zone');
check(notes(U.ananya, 'assignment.new', NOW) === 0, 'no lineup notification for a draft');

// --- 2. Publish → the line-up is told ---------------------------------------------------------------
await ops.page.getByRole('button', { name: 'Publish' }).click();
await ops.page.getByRole('button', { name: 'Publish & open sales' }).click();
await ops.page.getByText('Event published').waitFor();
check(notes(U.ananya, 'assignment.new', NOW) === 1 && notes(U.zoya, 'assignment.new', NOW) === 1, 'publishing notifies both artists');
check(/Your performance: 7:00 PM – 7:45 PM\. Do your best\./.test(sql(`select body from notifications where user_id = '${U.ananya}' and type = 'assignment.new' and created_at >= '${NOW}'`)), '… with their performance time');

// --- 3. Line-up on the event page, a request to Kabir (unavailable → his choice) ------------------------
await ops.page.goto(`${BASE}/admin-portal/events/${EV}/artists`);
const lineup = ops.page.locator('[data-event-lineup]');
check(await until(lineup.locator('[data-lineup-artist="Ananya Rao"]')) && /7:00/.test(await lineup.locator('[data-lineup-artist="Ananya Rao"]').innerText()), 'the event page lists the line-up with set times');
await ops.page.getByRole('button', { name: 'Add artists' }).click();
const pick2 = ops.page.getByRole('dialog');
check(await pick2.getByLabel(/Select Ananya Rao/).isDisabled(), 'artists already on the event cannot be added twice');
await pick2.getByLabel('Select Kabir Sethi').check();
await pick2.getByRole('button', { name: 'Continue' }).click();
await ops.page.getByRole('dialog', { name: 'Add 1 artist' }).getByRole('button', { name: 'Send requests' }).click();
await ops.page.getByText(/1 session request sent/).waitFor();
const REQ = sql(`select id from assignment_requests where session_id = '${EV}' and artist_id = '${KABIR}' and status = 'pending'`);
check(/^[0-9a-f-]{36}$/.test(REQ) && notes(U.kabir, 'booking.requested', NOW) === 1, 'Kabir gets the session request');
check(await until(lineup.locator('[data-lineup-artist="Kabir Sethi"]').getByText('Pending')), 'the event shows Kabir as pending');

const kabir = await launch();
await otpLogin(kabir.page, 'kabir.sethi@demo.tangy.local', '/artist/login');
await kabir.page.goto(BASE + '/artist/notifications');
await kabir.page.locator('[data-notification="booking.requested"]').first().click();
await kabir.page.waitForURL(`**/artist/requests/${REQ}`);
check(true, 'the request notification opens the request');
await kabir.page.getByRole('button', { name: 'Accept' }).click();
await kabir.page.getByText(/Accepted — the session is now in your calendar/).waitFor();
check(sql(`select count(*) from event_artists where event_id = '${EV}' and artist_id = '${KABIR}'`) === '1', 'accepting puts Kabir on the line-up');
check(notes(U.ops, 'booking.accepted', NOW) >= 1, 'the admin is told it was accepted');
// A second request Kabir declines (sent through the same server function).
sql(`insert into events (slug, name, event_date, venue, capacity, price, status) values ('e2e-wf-second', 'E2E Second Night', '${D2}', 'Courtyard', 50, 500, 'on-sale')`);
const SECOND = sql(`select id from events where slug = 'e2e-wf-second'`);
const sent = await api(ops.page, 'POST', '/rest/v1/rpc/save_event_lineup', { p_event_id: SECOND, p_items: [{ artist_id: KABIR, mode: 'request' }] });
check(sent.status === 200, 'a second request is sent');
const REQ2 = sql(`select id from assignment_requests where session_id = '${SECOND}' and artist_id = '${KABIR}'`);
await kabir.page.goto(`${BASE}/artist/requests/${REQ2}`);
await kabir.page.getByRole('button', { name: 'Decline…' }).click();
await kabir.page.getByLabel(/Reason/).fill('Already travelling.');
await kabir.page.getByRole('button', { name: 'Decline request' }).click();
await kabir.page.getByText(/Declined — the team has been told/).waitFor();
check(sql(`select status from assignment_requests where id = '${REQ2}'`) === 'declined' && notes(U.ops, 'booking.declined', NOW) >= 1, 'Kabir declines the other; the admin is told');
await kabir.browser.close();

// --- 4. The artist's calendar; a date change moves it -------------------------------------------------
const ananya = await launch();
await otpLogin(ananya.page, 'ananya.rao@demo.tangy.local', '/artist/login');
await ananya.page.goto(`${BASE}/artist/calendar?view=agenda`);
check(await until(ananya.page.locator('[data-cal-entry="confirmed"]').filter({ hasText: 'E2E WF Night' })), 'the published event is on the artist\'s calendar');
await ops.page.goto(`${BASE}/admin-portal/events/${EV}/details`);
await ops.page.getByLabel('Date *').fill(D2);
await ops.page.getByRole('button', { name: 'Save changes' }).click();
await ops.page.getByText('Event saved').waitFor();
check(notes(U.ananya, 'event.date_changed', NOW) === 1 && /^New date: /.test(sql(`select body from notifications where user_id = '${U.ananya}' and type = 'event.date_changed' and created_at >= '${NOW}'`)), 'a date change notifies the artist with the new date');
check(notes(U.kabir, 'event.date_changed', NOW) === 1, '… every artist on the line-up');
await ananya.page.goto(`${BASE}/artist/notifications`);
await ananya.page.locator('[data-notification="event.date_changed"]').first().click();
await ananya.page.waitForURL(`**/artist/sessions/${EV}`);
check(true, 'the update notification opens the session');
await ananya.page.goto(`${BASE}/artist/calendar?view=week&date=${D2}`);
check(await until(ananya.page.locator(`[data-day="${D2}"] [data-cal-entry="confirmed"]`).filter({ hasText: 'E2E WF Night' })), 'the artist\'s calendar shows the new date');

// --- 5. The artist updates availability; the admin sees it ---------------------------------------------
const MARK = day(45);
await ananya.page.goto(`${BASE}/artist/availability`);
await ananya.page.locator('[data-availability-grid]').waitFor();
const monthsAhead = (new Date(`${MARK}T00:00:00`).getFullYear() - new Date().getFullYear()) * 12 + new Date(`${MARK}T00:00:00`).getMonth() - new Date().getMonth();
for (let i = 0; i < monthsAhead; i++) await ananya.page.getByRole('button', { name: 'Next month' }).click();
await ananya.page.locator(`[data-day="${MARK}"]`).click();
await ananya.page.getByLabel('Status').selectOption('unavailable');
await ananya.page.getByLabel('Note (optional)').fill('Travelling that day.');
await ananya.page.getByRole('button', { name: 'Save', exact: true }).click();
await ananya.page.getByText(/Saved 1 day as unavailable/).waitFor();
check(sql(`select status || ':' || note from artist_availability where artist_id = '${ANANYA}' and date = '${MARK}'`) === 'unavailable:Travelling that day.', 'the artist marks a day unavailable with a note');
check(await until(ananya.page.locator('[data-last-updated]').filter({ hasText: /Today/ })), 'the page says when availability was last updated');
await ops.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/availability`);
check(await until(ops.page.locator('[data-availability-marks]').getByText('Travelling that day.')), 'the admin sees the updated availability');
const adminView = await api(ops.page, 'POST', '/rest/v1/rpc/find_available_artists', { p_date: MARK });
check(adminView.data.find((r) => r.artist_id === ANANYA)?.status === 'unavailable', 'the event selector would show her unavailable that day');
await ops.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/calendar`);
await ops.page.getByRole('button', { name: 'week' }).click();
const weekOf = async (target) => { for (let i = 0; i < 12 && !(await ops.page.locator(`[data-day="${target}"]`).count()); i++) await ops.page.getByRole('button', { name: 'Next week' }).click(); };
await weekOf(D2);
check(await until(ops.page.locator(`[data-day="${D2}"] [data-cal-entry="confirmed"]`).filter({ hasText: 'E2E WF Night' })), 'the admin artist calendar shows the booking');
await ops.page.getByRole('button', { name: 'month' }).click();
check(await until(ops.page.locator('[data-artist-tab="calendar"] [data-calendar-view="month"]')), 'the admin artist page has the calendar (month view)');
for (const tab of ['sessions', 'availability', 'media', 'application', 'messages', 'notifications']) {
  await ops.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/${tab}`);
  check(await until(ops.page.locator(`[data-artist-tab="${tab}"]`)), `the artist page has ${tab} at its own URL`);
}
await ops.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/sessions`);
check(await until(ops.page.locator('[data-upcoming-sessions]').getByText('E2E WF Night')), 'the artist page lists upcoming sessions');
await ops.page.goto(`${BASE}/admin-portal/calendar?month=${D2.slice(0, 7)}&day=${D2}`);
check(await until(ops.page.locator(`[data-cal-event="e2e-wf-night"]`)) && /Ananya Rao/.test(await ops.page.locator('[data-cal-event="e2e-wf-night"]').innerText()), 'the admin calendar shows the event with its artists');
check(await until(ops.page.locator(`[data-calendar-day="${D2}"] [data-artist-picker]`)), 'the admin calendar shows who is available that day');

// --- 6. Cancellation --------------------------------------------------------------------------------------
await ops.page.goto(`${BASE}/admin-portal/events/${EV}`);
await ops.page.getByRole('button', { name: 'Cancel event' }).click();
await ops.page.getByRole('dialog').getByRole('button', { name: 'Cancel event' }).click();
await ops.page.getByText('Event cancelled').waitFor();
check(notes(U.ananya, 'event.cancelled', NOW) === 1 && notes(U.zoya, 'event.cancelled', NOW) === 1, 'cancelling notifies the line-up');
check(sql(`select count(*) from event_artists where event_id = '${EV}'`) === '3', 'the line-up is kept as history');
await ananya.page.goto(`${BASE}/artist/calendar?view=week&date=${D2}`);
check(await until(ananya.page.locator(`[data-day="${D2}"] [data-cal-entry="cancelled"]`).filter({ hasText: 'E2E WF Night' })), 'the artist\'s calendar marks it cancelled');

// --- 7. Custom notification (Super Admin only) -------------------------------------------------------------
const dir = await launch();
await otpLogin(dir.page, 'director@demo.tangy.local');
await dir.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/notifications`);
const form = dir.page.locator('[data-custom-notification]');
await form.getByLabel('Title').fill('Important update');
await form.getByLabel('Message').fill('Please review your performance schedule for October.');
await form.getByLabel('Link (optional)').fill('/artist/calendar');
await form.getByRole('button', { name: 'Send' }).click();
check(await until(dir.page.locator('[data-custom-notification-result]').getByText(/Delivered in-app/)), 'a Super Admin sends a custom notification (and is told honestly about email)');
await ananya.page.goto(`${BASE}/artist/notifications`);
check(await until(ananya.page.locator('[data-notification="admin.message"]').getByText('Important update')), 'the artist sees it in their notification centre');
await ops.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/notifications`);
check(await ops.page.locator('[data-custom-notification]').count() === 0, 'an Admin has no custom-notification form');
check((await api(ops.page, 'POST', '/rest/v1/rpc/send_custom_notification', { p_user_id: U.ananya, p_title: 'x', p_body: 'y' })).status >= 400, '… and the server refuses an Admin');
check((await api(ananya.page, 'POST', '/rest/v1/rpc/send_custom_notification', { p_user_id: U.zoya, p_title: 'x', p_body: 'y' })).status >= 400, 'an artist cannot send arbitrary notifications');

// --- 8. Private Super Admin ↔ artist messaging -------------------------------------------------------------
await dir.page.goto(`${BASE}/admin-portal/people/artists/${ANANYA}/messages`);
const composer = dir.page.locator('[data-artist-composer]');
check(/not end-to-end encrypted/.test(await dir.page.locator('[data-artist-tab="messages"]').innerText()), 'the composer says how the conversation is protected (not E2EE)');
await composer.getByLabel('Subject').fill('E2E private');
await composer.getByLabel('Message').fill('E2E: can you confirm your rider?');
await composer.getByRole('button', { name: 'Send message' }).click();
await dir.page.waitForURL(/\/admin-portal\/messages\/[0-9a-f-]{36}$/);
const CONV = dir.page.url().split('/').pop();
check(sql(`select conversation_type from conversations where id = '${CONV}'`) === 'artist_private', 'the Super Admin messages the artist privately (continuing their open private thread)');
check(sql(`select count(*) from conversations where conversation_type = 'artist_private' and external_user_id = '${U.ananya}' and status <> 'closed'`) === '1', '… one private thread per Super Admin and artist, not a new one per message');
await ananya.page.goto(`${BASE}/artist/notifications`);
await ananya.page.locator('[data-notification="message.new"]').first().click();
await ananya.page.waitForURL(`**/artist/messages/${CONV}`);
check(await until(ananya.page.getByText('E2E: can you confirm your rider?')), 'the artist opens it from the notification');
await ananya.page.getByLabel('Message', { exact: true }).fill('E2E reply: rider sent.');
await ananya.page.getByRole('button', { name: 'Send message' }).click();
await ananya.page.getByText('E2E reply: rider sent.').first().waitFor();
check(sql(`select count(*) from messages where conversation_id = '${CONV}' and content = 'E2E reply: rider sent.' and sender_id = '${U.ananya}'`) === '1', 'the artist replies');
check(sql(`select link from notifications where user_id = '${U.director}' and type = 'message.new' order by created_at desc limit 1`) === `/admin-portal/messages/${CONV}`, 'the Super Admin is notified, linking to the conversation');
await dir.page.goto(`${BASE}/admin-portal/messages/${CONV}`);
check(await until(dir.page.getByText('E2E reply: rider sent.')), 'the Super Admin reads the reply');
check((await api(ops.page, 'GET', `/rest/v1/messages?conversation_id=eq.${CONV}&select=id`)).data.length === 0, 'another admin cannot read the private conversation');
check((await api(ops.page, 'POST', '/rest/v1/rpc/conversation_messages', { p_conversation_id: CONV })).status >= 400, '… nor open it through the API');
const zoya = await launch();
await otpLogin(zoya.page, 'zoya.qadri@demo.tangy.local', '/artist/login');
check((await api(zoya.page, 'GET', `/rest/v1/messages?conversation_id=eq.${CONV}&select=id`)).data.length === 0, 'another artist cannot read it');

// --- 9. Security: artists ---------------------------------------------------------------------------------
const otherAvail = await api(ananya.page, 'POST', '/rest/v1/artist_availability', { artist_id: ZOYA, date: day(50), status: 'unavailable' });
check(otherAvail.status >= 400, 'an artist cannot edit another artist\'s availability');
check((await api(ananya.page, 'POST', '/rest/v1/rpc/save_event_lineup', { p_event_id: SECOND, p_items: [{ artist_id: ANANYA }] })).status >= 400, 'an artist cannot change line-ups');
check((await api(ananya.page, 'POST', '/rest/v1/rpc/find_available_artists', { p_date: D })).status >= 400, 'an artist cannot browse other artists\' availability');
check((await api(ananya.page, 'GET', `/rest/v1/artist_applications?select=id,user_id`)).data.every((r) => r.user_id === U.ananya), 'an artist sees only their own application');
await api(ananya.page, 'PATCH', `/rest/v1/profiles?id=eq.${U.ananya}`, { role: 'admin' });
check(sql(`select role from profiles where id = '${U.ananya}'`) === 'artist', 'an artist cannot change their own role');
await ananya.page.goto(BASE + '/admin-portal');
check(await until(ananya.page.getByText(/don.t have permission|No access|not have access/i)), 'an artist cannot open the admin console');

// --- 10. Roles: staff → admin → staff, live ------------------------------------------------------------------
const desk = await launch();
await otpLogin(desk.page, 'desk@demo.tangy.local');
await desk.page.goto(BASE + '/admin-portal');
await desk.page.locator('nav[aria-label="Admin navigation"]').waitFor();
check(await desk.page.locator('nav[aria-label="Admin navigation"]').getByRole('link', { name: 'Calendar' }).count() === 0, 'as staff, desk has no event calendar');
check((await api(desk.page, 'POST', '/rest/v1/rpc/admin_set_user_role', { p_user_id: U.desk, p_role: 'admin', p_reason: 'self' })).status >= 400, 'staff cannot change roles (not even their own)');
check((await api(desk.page, 'POST', '/rest/v1/rpc/send_custom_notification', { p_user_id: U.ananya, p_title: 'x', p_body: 'y' })).status >= 400, 'staff cannot send custom notifications');
check((await api(ops.page, 'POST', '/rest/v1/rpc/admin_set_user_role', { p_user_id: U.desk, p_role: 'super_admin', p_reason: 'x' })).status >= 400, 'an Admin cannot grant Super Admin');
const ROLE_AT = sql('select now()');
await dir.page.goto(`${BASE}/admin-portal/users/${U.desk}`);
await dir.page.getByLabel('Role').selectOption('admin');
await dir.page.getByRole('button', { name: 'Change role' }).click();
await dir.page.getByRole('dialog').getByLabel('Reason').fill('E2E promotion');
await dir.page.getByRole('dialog').getByRole('button', { name: 'Change role' }).click();
await dir.page.getByText('Role updated').waitFor();
check(sql(`select role from profiles where id = '${U.desk}'`) === 'admin', 'the Super Admin changes the role server-side');
check(sql(`select count(*) from audit_logs where action = 'user.role_changed' and resource_id = '${U.desk}' and actor_id = '${U.director}' and metadata ->> 'from' = 'staff' and metadata ->> 'to' = 'admin' and created_at >= '${ROLE_AT}'`) === '1',
  'the change is audited (who, whom, old, new)');
check(/Previous role: Staff · New role: Admin/.test(sql(`select body from notifications where user_id = '${U.desk}' and type = 'role.changed' order by created_at desc limit 1`)), 'the person is told their previous and new role');
await desk.page.evaluate(() => window.dispatchEvent(new Event('focus')));
check(await until(desk.page.locator('nav[aria-label="Admin navigation"]').getByRole('link', { name: 'Calendar' })), 'without signing out, the open session moves to the Admin dashboard and navigation');
await desk.page.goto(BASE + '/admin-portal/notifications');
check(await until(desk.page.getByText('Your Tangy role has been updated')), 'the role-change notification is in their notification centre');
await desk.page.goto(BASE + '/admin-portal/calendar');
check(await until(desk.page.locator('[data-admin-calendar]')), 'the new role\'s pages open');
await dir.page.reload();
await dir.page.getByLabel('Role').selectOption('staff');
await dir.page.getByRole('button', { name: 'Change role' }).click();
await dir.page.getByRole('dialog').getByLabel('Reason').fill('E2E back to staff');
await dir.page.getByRole('dialog').getByRole('button', { name: 'Change role' }).click();
await dir.page.getByText('Role updated').waitFor();
check((await api(desk.page, 'POST', '/rest/v1/rpc/admin_calendar', { p_from: D, p_to: D })).status >= 400, 'after the demotion the server refuses admin data at once');
await desk.page.evaluate(() => window.dispatchEvent(new Event('focus')));
check(await gone(desk.page.locator('nav[aria-label="Admin navigation"]').getByRole('link', { name: 'Calendar' })), '… and the open session loses the Admin navigation');
await desk.page.goto(BASE + '/admin-portal/calendar');
check(await until(desk.page.getByText(/don.t have permission/i)), 'the old role\'s pages are closed');
await desk.browser.close();
sql(`update profiles set role = 'staff' where id = '${U.desk}'`);

// --- 11. Homepage: diary stays put, calendar reads live events ------------------------------------------------
sql(`insert into events (slug, name, event_date, venue, capacity, price, status) values ('e2e-wf-home', 'E2E Homepage Night', '${DH}', 'E2E Courtyard', 50, 500, 'draft')`);
const HOME = sql(`select id from events where slug = 'e2e-wf-home'`);
const v = await launch();
await v.page.goto(BASE + '/', { waitUntil: 'networkidle' });
await v.page.locator('[data-home-calendar]').scrollIntoViewIfNeeded();
await v.page.locator('[data-home-calendar] [data-home-calendar-event]').first().waitFor();
check(await v.page.locator('[data-home-calendar-event="e2e-wf-home"]').count() === 0, 'a draft is not on the homepage calendar');
const firstCal = await v.page.locator('[data-home-calendar-event]').first().getAttribute('data-home-calendar-event');
check(sql(`select count(*) from events where slug = '${firstCal}' and status in ('on-sale', 'sold-out')`) === '1', 'the homepage calendar is drawn from published events');
await api(ops.page, 'PATCH', `/rest/v1/events?id=eq.${HOME}`, { status: 'on-sale' });
await v.page.reload({ waitUntil: 'networkidle' });
await v.page.locator('[data-home-calendar]').scrollIntoViewIfNeeded();
check(await until(v.page.locator('[data-home-calendar-event="e2e-wf-home"]')), 'a newly published event appears on the homepage calendar');
check(await until(v.page.locator('[data-calendar-all][href="/sessions/calendar"]')), 'View full calendar → /sessions/calendar');
await v.page.goto(BASE + '/', { waitUntil: 'networkidle' });
for (let i = 0; i < 80 && !(await v.page.locator('#diary .desktop-leaf-0').isVisible().catch(() => false)); i++) {
  await v.page.mouse.wheel(0, 600);
  await v.page.waitForTimeout(120);
}
check(await v.page.locator('#diary').count() === 1 && await v.page.locator('#diary .desktop-leaf-0').count() === 1, 'the homepage diary section is the Tangy field journal (one diary)');
for (let i = 0; i < 12; i++) { await v.page.mouse.wheel(0, 600); await v.page.waitForTimeout(100); }
check(new URL(v.page.url()).pathname === '/', 'scrolling through the diary keeps you on the homepage');
check(await v.page.locator('#sessions .grid > *').count() > 0, 'the homepage shows upcoming sessions');
await v.page.locator('#diary a[href="/diary"]').click();
await v.page.waitForURL('**/diary');
check(true, 'the diary links on to the full Diary (/diary)');
await v.page.goto(BASE + '/diary/journal', { waitUntil: 'networkidle' });
check(await until(v.page.locator('#diary .desktop-leaf-0, #diary [class*="leaf"]')), '/diary/journal has its own copy of the journal');
await v.browser.close();

// --- 11a. Homepage session cards appear with normal motion, even on a slow load ----------
// (Every other suite runs with reduced motion, which shows reveal elements at once and hid this.)
{
  const nm = await launch();
  const ctx = await nm.browser.newContext({ viewport: { width: 1698, height: 988 }, reducedMotion: 'no-preference' });
  await ctx.route('**/rest/v1/events*', async (route) => { await new Promise((r) => setTimeout(r, 4000)); await route.continue(); });
  const pg = await ctx.newPage();
  await pg.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1200);
  const top = await pg.evaluate(() => document.getElementById('sessions').getBoundingClientRect().top + scrollY);
  for (let i = 0; i < 80 && (await pg.evaluate(() => scrollY)) < top - 100; i++) { await pg.mouse.wheel(0, 300); await pg.waitForTimeout(100); }
  await pg.locator('#sessions .reveal-paper').first().waitFor({ timeout: 20000 });
  await pg.waitForTimeout(2500);
  const ops = await pg.evaluate(() => [...document.querySelectorAll('#sessions .reveal-paper')].map((c) => Number(getComputedStyle(c).opacity)));
  check(ops.length > 0 && ops.every((o) => o === 1), `homepage session cards become visible after a slow load (opacities ${ops.join(',')})`);
  await nm.browser.close();
}

// --- 11b. A session's own page background ---------------------------------------------------------
await ops.page.goto(`${BASE}/admin-portal/events/${SECOND}/details`);
const bgField = ops.page.locator('[data-background-field]');
await bgField.getByRole('button', { name: 'Colour' }).click();
await bgField.getByRole('button', { name: 'Indigo night' }).click();
check(await ops.page.waitForFunction(() => getComputedStyle(document.querySelector('[data-background-preview-layer]')).backgroundColor === 'rgb(30, 36, 64)', null, { timeout: 5000 }).then(() => true, () => false), 'the editor previews the chosen background');
await bgField.locator('input[type="color"]').fill('#f5f0e1');
await ops.page.getByRole('button', { name: 'Save changes' }).click();
check(await until(ops.page.getByText(/Pick a darker colour/)), 'a light colour is refused (the cream text must stay readable)');
await bgField.getByRole('button', { name: 'Indigo night' }).click();
await ops.page.getByRole('button', { name: 'Save changes' }).click();
await ops.page.getByText('Event saved').waitFor();
check(sql(`select page_background from events where id = '${SECOND}'`) === '#1E2440', 'the session stores its own background');
const pub = await launch();
await pub.page.goto(`${BASE}/sessions/e2e-wf-second`);
await pub.page.locator('[data-page-background="#1E2440"]').waitFor();
check(await pub.page.locator('[data-session-backdrop]').evaluate((el) => getComputedStyle(el).backgroundColor) === 'rgb(30, 36, 64)', 'the session and booking page use it');
await pub.page.goto(`${BASE}/sessions/heritage-after-dark`);
await pub.page.locator('[data-page-background="cover"]').waitFor();
check(await pub.page.waitForFunction(() => /url\(/.test(getComputedStyle(document.querySelector('[data-session-backdrop]')).backgroundImage)).then(() => true, () => false), 'a session can use its cover image as the background');
await pub.page.goto(`${BASE}/sessions/demo-stepwell-strings`);
await pub.page.locator('[data-page-background="#183126"]').waitFor();
check(await pub.page.locator('[data-session-backdrop]').evaluate((el) => getComputedStyle(el).backgroundColor) === 'rgb(24, 49, 38)', 'each session has its own background (Stepwell Strings: green)');
await pub.page.goto(`${BASE}/sessions/rhythm-at-the-stepwell`);
await pub.page.locator('[data-page-background="default"]').waitFor();
check(await pub.page.locator('[data-page-background="default"]').evaluate((el) => el.classList.contains('theme-sessions') && /textures\//.test(getComputedStyle(el).backgroundImage))
  && await pub.page.locator('[data-session-backdrop]').evaluate((el) => getComputedStyle(el).backgroundImage === 'none' && getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)'),
  'a session without a chosen background uses the site\'s textured background');
check(await pub.page.locator('[data-session-hero] h1').count() === 1 && await pub.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the session page has its hero and no sideways scrolling');
await pub.page.goto(`${BASE}/sessions`);
check(await pub.page.locator('.theme-sessions').first().evaluate((el) => /textures\//.test(getComputedStyle(el).backgroundImage)), 'the Sessions pages use the site\'s textured background too');
await pub.browser.close();
check((await api(ops.page, 'PATCH', `/rest/v1/events?id=eq.${SECOND}`, { page_background: 'red;background:url(x)' })).status >= 400, 'the database refuses anything but a colour, the cover or an image link');

// --- 12. Phones and keyboard ---------------------------------------------------------------------------------
await ops.page.goto(BASE + '/admin-portal/events/new');
await ops.page.getByLabel('Date *').fill(D);
await ops.page.getByRole('button', { name: 'Add artist' }).focus();
await ops.page.keyboard.press('Enter');
check(await until(ops.page.getByRole('dialog').locator('[data-artist-picker]')), 'the artist selector opens from the keyboard');
await ops.page.getByRole('dialog').getByLabel('Select Ananya Rao').focus();
await ops.page.keyboard.press('Space');
check(await ops.page.getByRole('dialog').getByLabel('Select Ananya Rao').isChecked(), 'artists are chosen with the keyboard');
await ops.page.keyboard.press('Escape');
check(await gone(ops.page.getByRole('dialog').locator('[data-artist-picker]')), 'Escape closes the selector');
const pages = {
  ops: ['/admin-portal/events/new', `/admin-portal/events/${SECOND}/artists`, `/admin-portal/people/artists/${ANANYA}/calendar`, '/admin-portal/calendar', `/admin-portal/messages/${CONV}`, '/admin-portal/notifications'],
  ananya: ['/artist/calendar', '/artist/availability', '/artist/dashboard', '/artist/messages', '/artist/notifications'],
  visitor: ['/'],
};
for (const width of [375, 390, 412, 768, 1440]) {
  for (const [who, list] of Object.entries(pages)) {
    const ctx = who === 'ops' ? ops : who === 'ananya' ? ananya : await launch();
    await ctx.page.setViewportSize({ width, height: 900 });
    for (const path of list) {
      await ctx.page.goto(BASE + path, { waitUntil: 'networkidle' });
      if (path === '/admin-portal/events/new') {
        await ctx.page.getByLabel('Date *').fill(D);
        await ctx.page.getByRole('button', { name: 'Add artist' }).click();
        await ctx.page.getByRole('dialog').locator('[data-artist-row]').first().waitFor();
      }
      check(await ctx.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: ${path} has no sideways scrolling`);
    }
    if (who === 'visitor') await ctx.browser.close();
  }
}

sql(`delete from events where slug like 'e2e-wf-%'`);
await Promise.all([ops, ananya, dir, zoya].map((x) => x.browser.close()));
