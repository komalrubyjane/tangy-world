// The artist workflow end to end (0033): apply → draft → resume → submit →
// review → information requested → resubmit → approve → notified → portal →
// session request → viewed → accept → calendar / upcoming → team confirms;
// search / filter, a declined and a withdrawn application; every portal page
// by URL with one Artist navigation, Back / Forward; a request completed on
// the day, a confirmed booking cancelled, one declined with a reason; mobile
// navigation; and what an artist must never be able to do.
import { execFileSync } from 'node:child_process';
import { launch, otpLogin, check, api, BASE, SECTION_NAVS } from './lib.mjs';

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const EMAIL = 'artist-applicant@tangy.test';
const until = (loc, timeout = 15000) => loc.first().waitFor({ timeout }).then(() => true, () => false);
const gone = (loc, timeout = 15000) => loc.first().waitFor({ state: 'detached', timeout }).then(() => true, () => false);
const others0 = () => sql(`select id from artist_applications where user_id = (select id from auth.users where email = '${EMAIL}')`);
const appStatus = (email = EMAIL) => sql(`select status from artist_applications where user_id = (select id from auth.users where email = '${email}')`);
const notes = (email, type) => sql(`select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = '${email}' and n.type = '${type}'`);
// The shortest complete application, straight through to submission.
async function applyAndSubmit(page, { name, stage, city, genre, instagram, venues }) {
  await page.goto(BASE + '/artist/apply');
  await page.getByLabel('Full name *').fill(name);
  await page.getByLabel('Stage / artist name *').fill(stage);
  await page.getByLabel('City *').fill(city);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/step=2/);
  await page.locator('[data-chips="artist_type"]').getByRole('button', { name: 'Solo Artist' }).click();
  await page.locator('[data-chips="primary_genre"]').getByRole('button', { name: genre }).click();
  await page.getByLabel('Short bio *').fill(`${stage} plays ${genre.toLowerCase()} for small rooms and open courtyards.`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/step=3/);
  await page.getByLabel('Previous venues').fill(venues);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/step=4/);
  await page.getByLabel('Instagram', { exact: true }).fill(instagram);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/step=5/);
  await page.locator('[data-video-url]').fill('https://vimeo.com/76979871');
  await page.locator('[data-media-consent]').check();
  for (const step of [6, 7, 8]) {
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL(new RegExp(`step=${step}`));
  }
  await page.locator('[data-accuracy]').check();
  await page.getByRole('button', { name: 'Submit application' }).click();
  await page.waitForURL('**/artist/application');
}

// --- 1. Apply, save a draft, come back, submit ------------------------------------------
const a = await launch();
await otpLogin(a.page, EMAIL, '/artist/apply');
await a.page.goto(BASE + '/artist/apply');
await a.page.getByLabel('Full name *').waitFor();
await a.page.getByLabel('Full name *').fill('Esha Test');
await a.page.getByLabel('Stage / artist name *').fill('Esha E2E');
await a.page.getByLabel('City *').fill('Hyderabad');
await a.page.getByRole('button', { name: 'Continue' }).click();
await a.page.waitForURL(/step=2/);
await a.page.locator('[data-chips="artist_type"]').getByRole('button', { name: 'Solo Artist' }).click();
await a.page.locator('[data-chips="primary_genre"]').getByRole('button', { name: 'Folk' }).click();
await a.page.locator('[data-chips="instruments"]').getByRole('button', { name: 'Guitar' }).click();
await a.page.getByLabel('Short bio *').fill('Folk songs from the Deccan, sung with one guitar and a lot of patience.');
await a.page.getByRole('button', { name: 'Continue' }).click();
await a.page.waitForURL(/step=3/);
await a.page.getByRole('button', { name: 'Save draft' }).click();
await a.page.locator('[data-save-state]').filter({ hasText: 'Saved' }).waitFor();
check(appStatus() === 'draft', 'the application is saved as a draft');
await a.page.reload();
await a.page.getByRole('heading', { name: 'Experience' }).waitFor();
check(/step=3/.test(a.page.url()), 'after a reload the draft resumes at the same step');
await a.page.goto(BASE + '/artist/apply?step=2');
check(await a.page.getByLabel('Short bio *').inputValue() === 'Folk songs from the Deccan, sung with one guitar and a lot of patience.', 'saved answers come back');
await a.page.goto(BASE + '/artist/apply?step=5');
await a.page.getByRole('button', { name: 'Continue' }).click();
check(await until(a.page.getByText(/Add your performance video/)), 'the performance video is required');
await a.page.locator('[data-video-url]').fill('https://evil.example.com/video.mp4');
await a.page.getByRole('button', { name: 'Continue' }).click();
check(await until(a.page.getByText(/Only YouTube or Vimeo/)), 'unsafe video links are refused');
await a.page.locator('[data-video-url]').fill('https://www.youtube.com/watch?v=e2eDemo0001');
await a.page.locator('[data-media-consent]').check();
await a.page.getByRole('button', { name: 'Continue' }).click();
await a.page.waitForURL(/step=6/);
await a.page.getByRole('button', { name: 'Continue' }).click();
await a.page.waitForURL(/step=7/);
await a.page.getByRole('button', { name: 'Continue' }).click();
await a.page.waitForURL(/step=8/);
const reviewText = await a.page.locator('[data-review]').innerText();
check(/Esha E2E/.test(reviewText) && /Folk/.test(reviewText) && /youtube/.test(reviewText), `the review step shows every answer (${reviewText.slice(0, 160).replace(/\s+/g, ' ')})`);
await a.page.getByRole('button', { name: 'Submit application' }).click();
check(await until(a.page.getByText(/confirm that the information is accurate/i)), 'submitting needs the accuracy confirmation');
await a.page.locator('[data-accuracy]').check();
await a.page.getByRole('button', { name: 'Submit application' }).click();
await a.page.waitForURL('**/artist/application');
check(await until(a.page.locator('[data-application-status="submitted"]')), 'the application is submitted and the status page says so');

// --- 2. The team reviews and asks for more ---------------------------------------------
const m = await launch();
await otpLogin(m.page, 'manager@tangy.test');
await m.page.goto(BASE + '/admin-portal/artists/applications?status=submitted');
await m.page.getByText('Esha E2E').first().click();
await m.page.waitForURL(/\/admin-portal\/artists\/applications\/[0-9a-f-]{36}$/);
check(await until(m.page.locator('[data-video-preview]')), 'the reviewer previews the performance video in the application');
const appUrl = m.page.url();
await m.page.getByRole('button', { name: 'Start review' }).click();
await m.page.getByText('Marked under review').waitFor();
check(appStatus() === 'under_review', 'the reviewer starts the review');
await m.page.getByRole('button', { name: 'Request information' }).click();
const dlg = m.page.getByRole('dialog');
await dlg.getByLabel('Technical rider required').check();
await dlg.getByLabel('Message to the artist').fill('Please add your technical needs.');
await dlg.getByLabel(/Internal note/).fill('E2E internal: promising.');
await dlg.getByRole('button', { name: 'Send request' }).click();
await m.page.getByText(/Information requested/).waitFor();
check(appStatus() === 'needs_information', 'the reviewer requests information');

// --- 3. The artist updates and resubmits -----------------------------------------------
await a.page.goto(BASE + '/artist/application');
check(await until(a.page.getByText('Technical rider required')), 'the artist sees exactly what is needed');
check(await a.page.getByText('E2E internal').count() === 0, 'the internal note is not shown to the artist');
const peek = await api(a.page, 'GET', '/rest/v1/application_reviews?select=notes');
check(Array.isArray(peek.data) && peek.data.length === 0, 'internal notes are not readable through the API either');
await a.page.goto(BASE + '/artist/apply?step=6');
await a.page.getByLabel('Technical notes / rider').fill('One vocal mic, one DI for the guitar.');
await a.page.goto(BASE + '/artist/apply?step=8');
await a.page.locator('[data-accuracy]').check();
await a.page.getByRole('button', { name: 'Resubmit application' }).click();
await a.page.waitForURL('**/artist/application');
check(appStatus() === 'submitted', 'the artist resubmits');
check(sql("select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = 'manager@tangy.test' and n.type = 'application.resubmitted'") === '1', 'the team is told about the resubmission');

// --- 4. Approval ------------------------------------------------------------------------
await m.page.goto(appUrl);
await m.page.getByRole('button', { name: 'Approve artist' }).click();
await m.page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
await m.page.getByText(/Artist approved/).waitFor();
check(appStatus() === 'approved' && sql(`select role from profiles where email = '${EMAIL}'`) === 'artist', 'approval provisions the artist role server-side');
check(sql(`select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = '${EMAIL}' and n.type = 'application.approved'`) === '1', 'the artist is notified of the approval');
await a.page.goto(BASE + '/artist/dashboard');
check(await until(a.page.locator('[data-artist-dashboard]')), 'the approved artist opens their portal');
check(await a.page.locator('[data-nav-section]').count() === 0, 'the portal has its own navigation — not the site Navbar');

// --- 4b. Search, filter, decline, withdraw --------------------------------------------------
const R = 'artist-applicant-2@tangy.test', W = 'artist-applicant-3@tangy.test';
const r = await launch();
await otpLogin(r.page, R, '/artist/apply');
await applyAndSubmit(r.page, { name: 'Ravi Menon', stage: 'Ravi E2E', city: 'Kochi', genre: 'Jazz', instagram: '@ravi.e2e', venues: 'Kashi Art Cafe, Fort Kochi' });
check(appStatus(R) === 'submitted', 'a second applicant submits');
await m.page.goto(BASE + '/admin-portal/artists/applications');
await m.page.getByRole('searchbox').fill('Kochi');
await m.page.getByText('Ravi E2E').first().waitFor();
check(await gone(m.page.getByText('Esha E2E')), 'reviewers search applications by city');
await m.page.getByRole('searchbox').fill('');
await m.page.getByRole('group', { name: 'Show' }).getByRole('button', { name: /^Approved/ }).click();
await m.page.waitForURL(/status=approved/);
await m.page.getByText('Esha E2E').first().waitFor();
check(await gone(m.page.getByText('Ravi E2E')), 'reviewers filter applications by status (as a URL)');
await m.page.goto(BASE + '/admin-portal/artists/applications?status=submitted');
await m.page.getByText('Ravi E2E').first().click();
await m.page.waitForURL(/\/admin-portal\/artists\/applications\/[0-9a-f-]{36}$/);
await m.page.locator('[data-application-actions]').waitFor();
const detail = await m.page.locator('main').innerText();
check(/@ravi\.e2e/.test(detail) && /Kashi Art Cafe/.test(detail) && await until(m.page.locator('iframe[title^="Performance video"]')),
  'the reviewer inspects Instagram, experience and the video');
await m.page.getByRole('button', { name: 'Reject' }).click();
const rej = m.page.getByRole('dialog');
await rej.getByLabel(/Internal reason/).fill('E2E internal: not the right fit for the stepwell.');
await rej.getByLabel(/Message to the artist/).fill('Thank you — we are not able to programme this right now.');
await rej.getByRole('button', { name: 'Reject' }).click();
await m.page.getByText(/Application decl/).waitFor();
check(appStatus(R) === 'rejected', 'the reviewer declines the application');
check(notes(R, 'application.rejected') === '1', 'the applicant is told about the decision');
await r.page.goto(BASE + '/artist/application');
check(await until(r.page.locator('[data-application-status="rejected"]')) && await until(r.page.getByText('not able to programme this right now')),
  'the applicant sees the decision and the team’s message');
check(await r.page.getByText('E2E internal').count() === 0, 'the internal reason is not shown to the applicant');
check(await r.page.getByRole('button', { name: 'Withdraw application' }).count() === 0, 'a decided application cannot be withdrawn');
await r.browser.close();
const w = await launch();
await otpLogin(w.page, W, '/artist/apply');
await applyAndSubmit(w.page, { name: 'Noor Ali', stage: 'Noor E2E', city: 'Lucknow', genre: 'Ghazal', instagram: '@noor.e2e', venues: 'Sheroes Hangout' });
await w.page.getByRole('button', { name: 'Withdraw application' }).click();
await w.page.locator('[data-application-status="withdrawn"]').waitFor();
check(appStatus(W) === 'withdrawn', 'an applicant withdraws a submitted application');
await w.browser.close();
await m.page.goto(BASE + '/admin-portal/artists/applications?status=withdrawn');
check(await until(m.page.getByText('Noor E2E')) && await gone(m.page.getByText('Ravi E2E')), 'withdrawn applications have their own filter');
await m.page.getByText('Noor E2E').first().click();
await m.page.locator('[data-application-actions]').waitFor();
check(await m.page.getByRole('button', { name: /Approve artist|Reject/ }).count() === 0, 'a withdrawn application cannot be decided');

// --- 5. A session request: view, accept, calendar, confirm ---------------------------------
const vol6 = sql("select id from events where slug = 'vol-6-local'");
await m.page.goto(`${BASE}/admin-portal/events/${vol6}?tab=artists`);
await m.page.getByLabel('Approved artist').selectOption({ label: 'Esha Test' });
await m.page.getByLabel('Performance type').fill('Acoustic set');
await m.page.getByLabel('Set length (minutes)').fill('45');
await m.page.getByLabel('Fee offer (₹)').fill('15000');
await m.page.getByRole('button', { name: 'Send request' }).click();
await m.page.getByText(/Request sent/).waitFor();
const reqId = sql(`select r.id from assignment_requests r join artists ar on ar.id = r.artist_id where ar.email = '${EMAIL}' and r.session_id = '${vol6}'`);
check(/^[0-9a-f-]{36}$/.test(reqId), 'the team sends a session request');
await a.page.goto(BASE + '/artist/requests');
await a.page.locator(`[data-request="${reqId}"]`).click();
await a.page.waitForURL(`**/artist/requests/${reqId}`);
await a.page.reload();
await a.page.locator(`[data-request-page="${reqId}"]`).waitFor();
check(true, 'the request opens by deep link and survives a reload');
await a.page.waitForTimeout(800);
check(sql(`select viewed_at is not null from assignment_requests where id = '${reqId}'`) === 't', 'opening the request marks it viewed');
await a.page.getByRole('button', { name: 'Accept' }).click();
await a.page.getByText(/Accepted — the session is now in your calendar/).waitFor();
check(sql(`select status from assignment_requests where id = '${reqId}'`) === 'accepted', 'the artist accepts');
check(sql("select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = 'manager@tangy.test' and n.type = 'booking.accepted'") >= '1', 'the team is notified');
await a.page.goto(BASE + '/artist/sessions');
check(await until(a.page.locator(`[data-artist-session="${vol6}"]`)), 'the session appears in Upcoming');
await a.page.goto(BASE + '/artist/calendar?view=agenda');
check(await until(a.page.locator('[data-cal-entry="confirmed"]').filter({ hasText: 'Tangy Sessions Vol. 6' })), 'the calendar shows the session');
await m.page.reload();
await m.page.getByRole('button', { name: 'Confirm' }).first().click();
await m.page.getByText(/Confirmed — the artist/).waitFor();
check(sql(`select status from assignment_requests where id = '${reqId}'`) === 'confirmed', 'the team confirms');

// --- Deep links: every portal page opens directly and survives a reload ---------------------
const conv = await api(a.page, 'POST', '/rest/v1/rpc/start_partner_conversation', { p_subject: 'E2E question', p_body: 'Hello from the E2E artist.', p_event_id: null });
const convId = typeof conv.data === 'string' ? conv.data : conv.data?.id;
const mediaId = sql("select id from artist_media where artist_id = (select id from artists where email = 'ananya.rao@demo.tangy.local') limit 1");
for (const [path, text] of [['/artist/documents', 'DOCUMENTS'], ['/artist/messages', 'MESSAGES'], ['/artist/notifications', 'NOTIFICATIONS'],
  [`/artist/sessions/${vol6}`, 'TANGY SESSIONS VOL. 6'], [`/artist/messages/${convId}`, 'MESSAGES']]) {
  await a.page.goto(BASE + path);
  await a.page.reload();
  check(await until(a.page.locator('main h1').filter({ hasText: new RegExp(text, 'i') })), `${path} opens by deep link`);
}
// Every portal page: its own URL, survives a reload, one Artist navigation —
// no admin navigation, no site Navbar, no secondary section bar.
const PORTAL = ['dashboard', 'sessions', 'calendar', 'requests', 'availability', 'profile', 'media', 'messages', 'notifications', 'documents', 'settings'];
for (const p of PORTAL) {
  await a.page.goto(`${BASE}/artist/${p}`);
  await a.page.reload();
  await a.page.locator('main h1').first().waitFor();
  const nav = a.page.locator('nav[aria-label="Artist portal"]:visible');
  const ok = new URL(a.page.url()).pathname === `/artist/${p}`
    && await nav.count() === 1 && await nav.getByRole('link').count() === PORTAL.length
    && await a.page.locator('nav[aria-label="Admin navigation"]').count() === 0
    && await a.page.locator(`[data-nav-section], ${SECTION_NAVS}`).count() === 0;
  check(ok, `/artist/${p}: own URL after reload, Artist navigation only`);
}
const side = a.page.locator('nav[aria-label="Artist portal"]:visible');
await a.page.goto(BASE + '/artist/dashboard');
await side.getByRole('link', { name: 'Sessions' }).click();
await a.page.waitForURL('**/artist/sessions');
await side.getByRole('link', { name: 'Calendar' }).click();
await a.page.waitForURL('**/artist/calendar');
await a.page.goBack();
await a.page.waitForURL('**/artist/sessions');
await a.page.goBack();
await a.page.waitForURL('**/artist/dashboard');
await a.page.goForward();
await a.page.waitForURL('**/artist/sessions');
check(await until(a.page.locator('main h1')), 'Back and Forward move between portal pages');
await m.page.goto(BASE + '/admin-portal/artists');
await m.page.waitForURL('**/admin-portal/people/artists');
check(true, '/admin-portal/artists opens the artist directory');
await m.page.goto(`${BASE}/admin-portal/artists/applications/${others0()}`);
check(await until(m.page.locator('[data-application-actions], [data-internal-review]')), 'an application opens by deep link');
const ananya = await launch();
await otpLogin(ananya.page, 'ananya.rao@demo.tangy.local', '/artist/login');
await ananya.page.goto(`${BASE}/artist/media/${mediaId}`);
check(await until(ananya.page.locator(`[data-media-page="${mediaId}"]`)), 'a media item opens by deep link');
await ananya.browser.close();

// --- 6. Declined, completed and cancelled requests ---------------------------------------------
const sendRequest = async (eventId) => {
  await m.page.goto(`${BASE}/admin-portal/events/${eventId}?tab=artists`);
  await m.page.getByLabel('Approved artist').selectOption({ label: 'Esha Test' });
  await m.page.getByRole('button', { name: 'Send request' }).click();
  await m.page.getByText(/Request sent/).waitFor();
  return sql(`select r.id from assignment_requests r join artists ar on ar.id = r.artist_id where ar.email = '${EMAIL}' and r.session_id = '${eventId}'`);
};
// Vol. 5 is tonight: accepted, then marked completed on the day.
const vol5 = sql("select id from events where slug = 'vol-5-local'");
const req5 = await sendRequest(vol5);
await a.page.goto(`${BASE}/artist/requests/${req5}`);
await a.page.getByRole('button', { name: 'Accept' }).click();
await a.page.getByText(/Accepted — the session is now in your calendar/).waitFor();
await m.page.reload();
await m.page.getByRole('button', { name: 'Mark completed' }).click();
await m.page.getByText('Marked completed').waitFor();
check(sql(`select status from assignment_requests where id = '${req5}'`) === 'completed', 'the team marks a session completed on the day');
// The confirmed Vol. 6 booking is called off: the artist is told and it leaves their calendar.
await m.page.goto(`${BASE}/admin-portal/events/${vol6}?tab=artists`);
await m.page.getByRole('button', { name: 'Cancel', exact: true }).click();
await m.page.getByText('Request cancelled').waitFor();
check(sql(`select status from assignment_requests where id = '${reqId}'`) === 'cancelled', 'the team cancels a confirmed booking');
check(notes(EMAIL, 'booking.cancelled') === '1', 'the artist is told about the cancellation');
await a.page.goto(BASE + '/artist/calendar?view=agenda');
await a.page.locator('main h1').first().waitFor();
await a.page.waitForTimeout(800);
check(await a.page.locator('[data-cal-entry]').filter({ hasText: 'Tangy Sessions Vol. 6' }).count() === 0, 'a cancelled booking leaves the artist calendar');
// Vol. 4: the artist declines with a reason.
const vol4 = sql("select id from events where slug = 'vol-4'");
const req2 = await sendRequest(vol4);
await a.page.goto(`${BASE}/artist/requests/${req2}`);
await a.page.getByRole('button', { name: 'Decline…' }).click();
await a.page.getByLabel(/Reason/).fill('Out of town that day.');
await a.page.getByRole('button', { name: 'Decline request' }).click();
await a.page.getByText(/Declined — the team has been told/).waitFor();
check(sql(`select status || ':' || decline_reason from assignment_requests where id = '${req2}'`) === 'declined:Out of town that day.', 'the artist declines with a reason');
check(sql("select count(*) from notifications n join profiles p on p.id = n.user_id where p.email = 'manager@tangy.test' and n.type = 'booking.declined'") >= '1', 'the team is told about the decline');

// --- 7. What an artist can never do ------------------------------------------------------------
const others = await api(a.page, 'GET', '/rest/v1/artist_applications?select=id,user_id');
check(others.data.length === 1, 'an artist sees only their own application');
const selfApprove = await api(a.page, 'POST', '/rest/v1/rpc/review_artist_application', { p_id: others.data[0].id, p_action: 'approve' });
check(selfApprove.status >= 400, `an artist cannot review applications (${selfApprove.status})`);
const confirmOwn = await api(a.page, 'POST', '/rest/v1/rpc/manage_artist_request', { p_id: req2, p_action: 'confirm' });
check(confirmOwn.status >= 400, `an artist cannot change request statuses (${confirmOwn.status})`);
const roleUp = await api(a.page, 'PATCH', `/rest/v1/profiles?email=eq.${EMAIL}`, { role: 'admin' });
check(roleUp.status >= 400 && sql(`select role from profiles where email = '${EMAIL}'`) === 'artist', 'an artist cannot change their own role');
const otherAvail = await api(a.page, 'GET', '/rest/v1/artist_availability?select=artist_id');
const mine = sql(`select id from artists where email = '${EMAIL}'`);
check(otherAvail.data.every((r) => r.artist_id === mine), 'an artist cannot read other artists’ availability');
await a.page.goto(BASE + '/admin-portal/artists/applications');
check(await until(a.page.getByText(/don.t have permission|No access|not have access/i)), 'admin routes are closed to artists');
await a.browser.close();
await m.browser.close();

// --- 8. Phones: one drawer, real routes -----------------------------------------------------------
for (const width of [375, 390, 412, 768]) {
  const p = await launch({ mobile: true });
  await p.page.setViewportSize({ width, height: 844 });
  await otpLogin(p.page, 'ananya.rao@demo.tangy.local', '/artist/login');
  await p.page.goto(BASE + '/artist/dashboard');
  await p.page.locator('[data-artist-dashboard]').waitFor();
  if (width < 1024) {
    await p.page.getByRole('button', { name: /^Menu/ }).click();
    const drawer = p.page.getByRole('dialog', { name: 'Artist portal menu' });
    await drawer.getByRole('link', { name: 'Calendar' }).click();
    await p.page.waitForURL('**/artist/calendar');
    check(await drawer.count() === 0, `${width}px: the drawer closes after navigating`);
  }
  for (const path of ['/artist/dashboard', '/artist/sessions', '/artist/calendar', '/artist/requests', '/artist/availability', '/artist/profile']) {
    await p.page.goto(BASE + path);
    await p.page.locator('main h1').first().waitFor();
    check(await p.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: ${path} has no sideways scrolling`);
  }
  await p.browser.close();
}
