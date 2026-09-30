import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

// Operations platform (0018): partner portals, partner↔admin messaging,
// notifications, requirements, logistics, event announcements, temporary
// volunteer check-in (grant → scan → revoke → denied), isolation and live
// permission changes. Every account signs in through the real Email OTP flow.

const text = async (page, sel = 'body') => (await page.locator(sel).innerText()).replace(/\s+/g, ' ');
const until = (p, ms = 12000) => p.waitFor({ timeout: ms }).then(() => true, () => false);
const unread = async (page) => Number((await page.locator('[data-unread-count]').first().getAttribute('data-unread-count').catch(() => '0')) || 0);
const allErrors = [];
const expected = [];
// The local stack runs without Realtime (websocket 503); the app falls back to polling.
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket/.test(e)).map((e) => `${label}: ${e}`));

async function signIn(email, path, opts) {
  const s = await launch(opts);
  await otpLogin(s.page, email, path);
  return s;
}

// ---------------------------------------------------------------- sessions
const admin = await signIn('manager@tangy.test', '/admin-portal');
await admin.page.getByRole('heading', { name: /operations/i }).waitFor({ timeout: 15000 });
const artist = await signIn('artist@tangy.test', '/artist/login');
await artist.page.waitForURL('**/artist/dashboard', { timeout: 15000 });

// ---------------------------------------------------------------- A. messaging
{
  const p = artist.page;
  await p.getByRole('tab', { name: 'Messages' }).click();
  check(await until(p.getByText('No messages yet').first()), 'artist: empty messages state');
  await p.getByRole('button', { name: 'New message' }).click();
  const dlg = p.getByRole('dialog').last();
  const opts = await dlg.getByRole('combobox').first().locator('option').allInnerTexts();
  await dlg.getByRole('combobox').first().selectOption({ label: opts.find((o) => o.includes('Tangy Sessions Vol. 5')) });
  await dlg.getByLabel('Subject').fill('Soundcheck timing');
  await dlg.getByLabel('Message *').fill('Can we move soundcheck to 4:30 PM?');
  await dlg.getByRole('button', { name: 'Send' }).click();
  check(await until(p.locator('[data-messages-panel]').getByText('Can we move soundcheck to 4:30 PM?')), 'artist sends a message to Tangy');
  await shot(p, 'p01-artist-message');
}
{
  const p = admin.page;
  await p.reload();
  await p.getByRole('heading', { name: /operations/i }).waitFor();
  check((await unread(p)) >= 1, 'admin bell shows the new-message notification');
  const nav = await text(p, 'nav[aria-label="Admin navigation"]');
  check(/Messages\s*1/.test(nav), 'admin nav: Messages badge = 1 awaiting reply');
  await p.goto(BASE + '/admin-portal/messages');
  await p.getByRole('button', { name: /Aria Artist/ }).first().click();
  check(await until(p.getByText('Can we move soundcheck to 4:30 PM?')), 'admin opens the artist thread');
  await p.getByLabel('Message', { exact: true }).fill('Yes — soundcheck moved to 4:30 PM.');
  await p.getByLabel('Message', { exact: true }).press('Enter');
  check(await until(p.locator('[data-messages-panel]').getByText('Yes — soundcheck moved to 4:30 PM.')), 'admin replies');
  await shot(p, 'p02-admin-inbox');
}
{
  const p = artist.page;
  await p.reload();
  // The artist had the thread open while the reply arrived, so polling marks
  // it read (mark_conversation_read) — the notification must still exist.
  await p.getByRole('tab', { name: 'Notifications', exact: true }).first().click();
  check(await until(p.locator('[data-notifications]').getByText('New message from Tangy').first()), 'artist notification center lists the reply');
  await p.getByRole('tab', { name: 'Messages', exact: true }).first().click();
  await p.getByRole('button', { name: /Soundcheck timing/ }).first().click();
  check(await until(p.getByRole('region', { name: 'Conversation' }).getByText('Yes — soundcheck moved to 4:30 PM.')), 'artist sees the reply');
  check(await until(p.locator('[data-messages-panel]').getByText('Read', { exact: false }).last()), 'artist sees their message was read');
}

// ---------------------------------------------------------------- B. requirements + schedule
const evtId = (await api(admin.page, 'GET', '/rest/v1/events?slug=eq.vol-5-local&select=id')).data?.[0]?.id;
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${evtId}?tab=requirements`);
  const from = p.getByLabel('Requirement recipient');
  await from.locator('option', { hasText: 'Aria Artist' }).waitFor({ state: 'attached' });
  await from.selectOption({ label: (await from.locator('option').allInnerTexts()).find((o) => o.startsWith('Aria Artist')) });
  await p.getByLabel("What's needed").fill('Tech rider');
  await p.getByRole('button', { name: 'Request' }).click();
  check(await until(p.getByText('Requirement sent')), 'admin requests a tech rider from the artist');

  await p.goto(`${BASE}/admin-portal/events/${evtId}?tab=schedule`);
  await p.getByRole('button', { name: 'Edit' }).first().click();
  const d = p.getByRole('dialog').last();
  const today = new Date().toLocaleDateString('en-CA');
  await d.getByLabel('Call time').fill(`${today}T17:00`);
  await d.getByLabel('Performance starts').fill(`${today}T20:00`);
  await d.getByLabel('Performance ends').fill(`${today}T21:30`);
  await d.getByLabel('Hospitality').fill('Green room B, dinner at 6');
  await d.getByRole('button', { name: 'Save' }).click();
  check(await until(p.getByText('Artist logistics saved')), 'admin sets artist call/performance times');
  // Vendor instructions (second table)
  await p.locator('table').nth(1).getByRole('row', { name: /Chai Collective/ }).getByRole('button', { name: 'Edit' }).click();
  const v = p.getByRole('dialog').last();
  await v.getByLabel('Operational instructions').fill('Loading bay opens 2 PM — use gate 3');
  await v.getByRole('button', { name: 'Save' }).click();
  check(await until(p.getByText('Timings saved')), 'admin sets vendor instructions');
  await shot(p, 'p03-admin-schedule');
}
{
  const p = artist.page;
  await p.goto(BASE + '/artist/dashboard?tab=overview');
  const next = p.getByRole('region', { name: 'Next event' });
  check(await until(next), 'artist overview: next performance card');
  const t = await text(p, 'section[aria-label="Next event"]');
  check(/Next performance/i.test(t) && /8:00\s*pm/i.test(t) && /Call time/i.test(t), `artist sees performance + call time (${t.slice(0, 120)})`);
  await next.getByRole('button', { name: 'View event' }).click();
  check(await until(p.getByText('Green room B, dinner at 6')), 'artist sees private hospitality in the event drawer');
  await p.keyboard.press('Escape');
  await p.getByRole('tab', { name: 'Requirements' }).click();
  await p.getByLabel('Response to Tech rider').fill('16 channels, 2 vocal mics, DI for harmonium');
  await p.getByRole('button', { name: 'Submit' }).click();
  check(await until(p.getByText('Submitted', { exact: true })), 'artist submits the requirement');
  await shot(p, 'p04-artist-requirements');
}
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${evtId}?tab=requirements`);
  await p.getByRole('button', { name: 'Accept' }).click();
  check(await until(p.getByText('Accepted', { exact: true }).first()), 'admin accepts the requirement');
}

// ---------------------------------------------------------------- C. vendor + announcements
const vendor = await signIn('vendorco@tangy.test', '/join/login');
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/content');
  await p.getByRole('button', { name: 'New announcement' }).click();
  const dlg = p.getByRole('dialog').last();
  await dlg.getByLabel('Title *').fill('E2E Loading bay moved');
  await dlg.getByLabel('Message').fill('Use gate 3 for all deliveries.');
  await dlg.getByLabel('Audience').selectOption('vendor');
  const evOpts = await dlg.getByLabel(/^Event/).locator('option').allInnerTexts();
  await dlg.getByLabel(/^Event/).selectOption({ label: evOpts.find((o) => o.includes('Vol. 5')) });
  await dlg.getByLabel('Status').selectOption('published');
  await dlg.getByRole('button', { name: 'Create' }).click();
  check(await until(p.getByText('Announcement created')), 'admin publishes a vendor notice for Vol. 5');
}
{
  const p = vendor.page;
  await p.goto(BASE + '/vendor/dashboard?tab=events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().click();
  check(await until(p.getByText('Loading bay opens 2 PM — use gate 3')), 'vendor sees their operational instructions');
  await p.keyboard.press('Escape');
  await p.goto(BASE + '/vendor/dashboard?tab=announcements');
  check(await until(p.getByText('E2E Loading bay moved')), 'vendor sees the vendor notice');
  check((await unread(p)) >= 1, 'vendor notified');
  await shot(p, 'p05-vendor-announcements');
  await p.goto(BASE + '/admin-portal');
  check(await until(p.getByText('No access')) && await until(p.getByRole('link', { name: 'My portal' })), 'vendor cannot enter the admin console');
}

// ---------------------------------------------------------------- D. sponsor isolation
const sponsor = await signIn('sponsor@tangy.test', '/join/login');
{
  const p = sponsor.page;
  await p.goto(BASE + '/sponsor/dashboard?tab=announcements');
  await p.waitForTimeout(1500);
  check(!(await text(p)).includes('E2E Loading bay moved'), 'sponsor does not see the vendor notice');
  const conv = (await api(admin.page, 'GET', '/rest/v1/conversations?conversation_type=eq.artist_support&select=id')).data?.[0]?.id;
  const leak = await api(p, 'GET', `/rest/v1/messages?conversation_id=eq.${conv}&select=content`);
  check(Array.isArray(leak.data) && leak.data.length === 0, 'sponsor cannot read the artist thread via API');
  const before = sponsor.errors.length;
  await p.goto(`${BASE}/sponsor/dashboard?tab=messages&c=${conv}`);
  check(await until(p.getByText('Conversation not found.')), 'sponsor deep link to the artist thread is refused');
  expected.push(...sponsor.errors.splice(before).map((e) => `sponsor deep link (refused by conversation_messages): ${e}`));
  const vend = await api(p, 'GET', '/rest/v1/event_assignments?assignee_role=eq.vendor&select=instructions');
  check(Array.isArray(vend.data) && vend.data.length === 0, 'sponsor cannot read vendor instructions via API');
}

// ---------------------------------------------------------------- E. volunteer temporary check-in (phone)
const vol = await signIn('volunteer@tangy.test', '/join/login', { mobile: true });
{
  const p = vol.page;
  await p.goto(BASE + '/volunteer/dashboard?tab=checkin');
  check(await until(p.getByText('No active check-in access')), 'volunteer: no access by default');
  check(!(await text(p, 'nav[role="tablist"]')).includes('Messages'), 'volunteer portal has no private messaging tab');
  await p.getByRole('button', { name: /Request access · Tangy Sessions Vol\. 5/ }).click();
  await p.getByLabel('Message to the event team').fill('I am on the second gate tonight');
  await p.getByRole('button', { name: 'Send request' }).click();
  check(await until(p.getByText(/Request sent for/)), 'volunteer requests check-in access');
  await p.goto(BASE + '/check-in');
  check(await until(p.getByText(/no active access right now/i)), 'volunteer without a grant cannot open the terminal');
}
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/volunteers');
  await p.getByRole('button', { name: 'Grant request' }).click();
  const dlg = p.getByRole('dialog').last();
  check((await text(p, '[role="dialog"]')).includes('volunteer@tangy.test'), 'grant dialog shows the volunteer');
  await dlg.getByLabel('Duration').selectOption('120');
  await dlg.getByRole('button', { name: 'Grant access' }).click();
  check(await until(p.getByText(/Check-in access granted until/)), 'admin grants 2h check-in access');
  await shot(p, 'p06-admin-volunteers');
}
{
  const p = vol.page;
  await p.goto(BASE + '/volunteer/dashboard?tab=checkin');
  check(await until(p.locator('[data-access-state="active"]')), 'volunteer sees ACTIVE access');
  await shot(p, 'p07-volunteer-active');
  await p.getByRole('link', { name: 'Open check-in' }).click();
  check(await until(p.locator('[data-access-window]')), 'terminal shows the access window');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, 'terminal: no horizontal scroll at 390px');
  await p.getByRole('button', { name: 'Manual', exact: true }).click();
  await p.getByPlaceholder('Name, booking code or ticket number').fill('TS-LOCAL002');
  await p.getByRole('button', { name: 'Check in' }).first().click();
  check(await until(p.getByRole('status').getByText('Checked in', { exact: true })), 'volunteer checks a guest in');
  await shot(p, 'p08-volunteer-checkin');
  // Load the next guest while access is still live — after the revoke below,
  // the click must be refused by the server, not by a missing button.
  // (TS-LOCAL001 has two attendees, so it opens the attendee list — same server call.)
  await p.getByPlaceholder('Name, booking code or ticket number').fill('TS-LOCAL001');
  await p.getByRole('button', { name: /Select attendees for TS-LOCAL001/ }).waitFor();
}
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal/volunteers');
  await p.getByRole('button', { name: 'Revoke' }).click();
  await p.getByRole('dialog').last().getByRole('button', { name: 'Revoke access' }).click();
  check(await until(p.getByText('Access revoked')), 'admin revokes access');
}
{
  const p = vol.page;
  await p.getByRole('button', { name: /Select attendees for TS-LOCAL001/ }).click();
  check(await until(p.getByRole('status').getByText('Access expired', { exact: true })), 'after revoke the terminal refuses (server-side)');
  await p.goto(BASE + '/volunteer/dashboard?tab=checkin');
  check(await until(p.getByText('Ended', { exact: true }).first()), 'volunteer sees access ended');
  await shot(p, 'p09-volunteer-ended');
}

// ---------------------------------------------------------------- F. command center
{
  const p = admin.page;
  await p.goto(`${BASE}/admin-portal/events/${evtId}`);
  const cc = p.locator('[data-command-center]');
  check(await until(cc), 'command center renders');
  const t = await text(p, '[data-command-center]');
  check(/artists\s*1\b/i.test(t) && /vendors\s*1\b/i.test(t) && /volunteers\s*1\b/i.test(t) && /sponsors\s*1\b/i.test(t), `command center counts are real (${t.slice(0, 160)})`);
  await shot(p, 'p10-command-center');
}

// ---------------------------------------------------------------- G. live permission change
const root = await signIn('root@tangy.test', '/admin-portal');
{
  const p = root.page;
  await p.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).waitFor({ timeout: 15000 });
  await p.goto(BASE + '/admin-portal/roles');
  const sw = p.getByRole('switch', { name: 'Reports & analytics for staff' });
  await sw.waitFor();
  check((await sw.getAttribute('aria-checked')) === 'false', 'staff starts without reports');
  await sw.click();
  check(await until(p.getByText(/Reports & analytics granted to Staff/)), 'super admin grants reports to staff');
  check((await p.getByRole('switch', { name: 'Role management for admin' }).isDisabled()), 'role management is not delegable');
}
{
  const staff = await signIn('staff@tangy.test', '/admin-portal');
  const p = staff.page;
  await p.getByRole('heading', { name: /hello/i }).waitFor({ timeout: 15000 });
  check((await text(p, 'nav[aria-label="Admin navigation"]')).includes('Reports'), 'granted permission appears in staff nav');
  track('staff', staff.errors);
  await staff.browser.close();
}
{
  const p = root.page;
  await p.getByRole('switch', { name: 'Reports & analytics for staff' }).click();
  check(await until(p.getByText(/Reports & analytics removed from Staff/)), 'super admin removes it again');
}

for (const [label, s] of [['admin', admin], ['artist', artist], ['vendor', vendor], ['sponsor', sponsor], ['volunteer', vol], ['root', root]]) {
  track(label, s.errors);
  await s.browser.close();
}
console.log('\nEXPECTED REFUSALS:\n' + (expected.join('\n') || '(none)'));
console.log('\nERRORS:\n' + (allErrors.join('\n') || '(none)'));
