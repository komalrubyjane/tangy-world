import { launch, otpLogin, shot, check, BASE } from './lib.mjs';

// Phone workflows at 390 × 844 (touch, DPR 2): the admin portal, the artist
// workspace and every partner portal, driven the way someone on a phone uses
// them — navigation drawer, search, notifications, tables as cards, dialogs
// and drawers that fit, forms that submit, a message round trip and the QR
// check-in terminal. Every account signs in through the real Email OTP flow.

const W = 390;
const until = (p, ms = 12000) => p.waitFor({ timeout: ms }).then(() => true, () => false);
const allErrors = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket/.test(e)).map((e) => `${label}: ${e}`));

async function signIn(email, path) {
  const s = await launch({ mobile: true });
  await otpLogin(s.page, email, path);
  return s;
}
// No sideways page scroll, and no visible element sticking out past the
// right edge unless it lives inside its own horizontal scroller (tab strips).
async function fits(p, label) {
  await p.waitForTimeout(400);
  const r = await p.evaluate((w) => {
    const pageOverflow = document.documentElement.scrollWidth - window.innerWidth;
    const scroller = (el) => { for (let n = el.parentElement; n; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll|hidden)/.test(s.overflowX) && n !== document.body && n !== document.documentElement) return true; } return false; };
    const bad = [];
    for (const el of document.querySelectorAll('main *, [role="dialog"] *, header *')) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height || getComputedStyle(el).visibility === 'hidden') continue;
      if (b.right > w + 2 && !scroller(el)) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}:${Math.round(b.right)}`);
    }
    return { pageOverflow, bad: bad.slice(0, 4) };
  }, W);
  check(r.pageOverflow <= 1 && r.bad.length === 0, `${label}: fits 390px${r.pageOverflow > 1 ? ` (page +${r.pageOverflow}px)` : ''}${r.bad.length ? ` (${r.bad.join(', ')})` : ''}`);
}
// A dialog/drawer is fully on screen and its buttons can be reached.
async function dialogFits(p, label) {
  const d = p.getByRole('dialog').last();
  await d.waitFor();
  await p.waitForTimeout(350);
  const b = await d.boundingBox();
  const buttons = await d.getByRole('button').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; }));
  const offscreen = buttons.filter(([l, r, w]) => w > 0 && (l < -1 || r > W + 1)).length;
  check(b && b.x >= -1 && b.x + b.width <= W + 1 && offscreen === 0, `${label}: dialog fits and its ${buttons.length} buttons are reachable`);
}
const tapTab = async (p, name) => { const t = p.getByRole('tab', { name, exact: true }).first(); await t.scrollIntoViewIfNeeded(); await t.tap(); };

// ================================================================ ADMIN PORTAL
const admin = await signIn('manager@tangy.test', '/admin-portal');
{
  const p = admin.page;
  check(await until(p.getByRole('heading', { name: /good (morning|afternoon|evening)/i }), 15000), 'admin: signed-in shell on a phone');
  check(!(await p.locator('nav[aria-label="Admin navigation"]').first().isVisible()), 'admin: sidebar is collapsed on mobile');
  check(await until(p.locator('[data-metrics]')), 'admin dashboard: metrics render');
  await fits(p, 'admin dashboard');
  await shot(p, 'm01-admin-dashboard');

  // navigation drawer
  await p.getByRole('button', { name: 'Open navigation' }).tap();
  const nav = p.getByRole('dialog', { name: 'Navigation' });
  check(await until(nav), 'admin: navigation drawer opens');
  const nb = await nav.locator('nav').first().boundingBox();
  check(nb && nb.width <= W * 0.9, `admin: drawer leaves room to dismiss (${Math.round(nb?.width)}px)`);
  await nav.getByRole('link', { name: 'Events', exact: true }).tap();
  await p.waitForURL('**/admin-portal/events');
  check(!(await nav.count()), 'admin: drawer closes after navigating');
  // tables become cards
  const cards = p.locator('main ul.md\\:hidden > li');
  check(await until(cards.first()) && !(await p.locator('main table').first().isVisible()), 'admin events: table renders as cards on mobile');
  await fits(p, 'admin events list');

  // global search → event detail
  await p.getByRole('button', { name: 'Search', exact: true }).tap();
  const palette = p.getByRole('dialog', { name: 'Command menu' });
  check(await until(palette), 'admin: global search opens');
  await dialogFits(p, 'admin search');
  await palette.getByRole('combobox').or(palette.getByLabel('Search the admin portal')).first().fill('Vol. 5');
  const hit = palette.getByRole('option', { name: /Tangy Sessions Vol\. 5/ }).first();
  check(await until(hit), 'admin: search finds the event');
  await hit.tap();
  await p.waitForURL(/\/admin-portal\/events\/[0-9a-f-]{36}/);
  check(await until(p.locator('[data-command-center]')), 'admin: event detail opens from search');
  await fits(p, 'admin event detail');
  await tapTab(p, 'Schedule');
  check(await until(p.getByRole('button', { name: 'Edit' }).first()), 'admin: event tabs scroll and switch (Schedule)');
  await p.getByRole('button', { name: 'Edit' }).first().tap();
  await dialogFits(p, 'admin artist logistics form');
  await p.keyboard.press('Escape');
  await fits(p, 'admin event schedule tab');

  // tasks: list ↔ board, create dialog
  await p.goto(BASE + '/admin-portal/tasks');
  check(await until(p.getByRole('heading', { name: 'Event tasks' })), 'admin tasks page opens');
  await fits(p, 'admin tasks list');
  await p.getByRole('tab', { name: 'Board' }).tap();
  await fits(p, 'admin tasks board');
  await p.getByRole('button', { name: 'New task' }).tap();
  await dialogFits(p, 'admin new task');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Cancel' }).tap();

  for (const [path, heading, label] of [
    ['/admin-portal/volunteers', /volunteer/i, 'admin volunteers'],
    ['/admin-portal/reports', 'Reports', 'admin reports'],
    ['/admin-portal/people/sponsors', 'Artists & partners', 'admin partner management'],
    ['/admin-portal/invoices', 'Partner invoices', 'admin invoices'],
    ['/admin-portal/reviews', 'Media & asset reviews', 'admin reviews'],
  ]) {
    await p.goto(BASE + path);
    check(await until(p.getByRole('heading', { name: heading }).first()) && !/something went wrong/i.test(await p.locator('main').innerText()), `${label}: opens cleanly`);
    await fits(p, label);
  }
  await p.goto(BASE + '/admin-portal/people/sponsors');
  const sponsorCard = p.locator('main ul.md\\:hidden > li', { hasText: 'Saffron' }).first();
  check(await until(sponsorCard), 'admin partner management: sponsor listed as a card');
  await sponsorCard.tap();
  if (await p.getByRole('dialog').count()) { await dialogFits(p, 'admin partner record'); await p.keyboard.press('Escape'); }
  await shot(p, 'm02-admin-partners');
}

// ================================================================ ARTIST
const artist = await signIn('artist@tangy.test', '/artist/login');
{
  const p = artist.page;
  await p.waitForURL('**/artist/dashboard', { timeout: 15000 });
  check(await until(p.getByText('YOUR TANGY SESSIONS WORKSPACE')), 'artist dashboard on a phone');
  check(await p.getByRole('button', { name: 'Dismiss announcement' }).waitFor({ state: 'hidden', timeout: 3000 }).then(() => true, () => false), 'artist: public pop-up from the sign-in page does not follow into the portal');
  await fits(p, 'artist dashboard');
  await shot(p, 'm03-artist-dashboard');

  // mobile menu → calendar (agenda by default on phones)
  await p.getByRole('button', { name: 'Toggle mobile menu' }).tap();
  await p.getByRole('button', { name: /Calendar/ }).first().tap();
  await p.waitForURL('**/artist/calendar');
  const cal = p.locator('[data-artist-calendar]');
  check(await until(cal.locator('.fc-list')), 'artist calendar opens in Agenda view on a phone');
  check(await until(cal.getByText(/Tangy Sessions Vol\. 5/).first()), 'agenda lists the confirmed performance');
  await fits(p, 'artist calendar (agenda)');
  await p.getByRole('tab', { name: 'Month' }).tap();
  check(await until(cal.locator('.fc-daygrid')), 'artist can switch to month view');
  await fits(p, 'artist calendar (month)');
  await p.getByRole('tab', { name: 'Agenda' }).tap();
  await cal.getByText(/Tangy Sessions Vol\. 5/).first().tap();
  await dialogFits(p, 'artist calendar event drawer');
  await shot(p, 'm04-artist-drawer');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Close' }).tap();

  // workspace tabs
  await p.goto(BASE + '/artist/dashboard?tab=events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().tap();
  await dialogFits(p, 'artist events drawer');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Close' }).tap();
  for (const tab of ['Notifications', 'Documents', 'Payments']) {
    await tapTab(p, tab);
    check(await until(p.locator('section[aria-label="Artist workspace"]').getByText(tab, { exact: true }).first()), `artist ${tab.toLowerCase()} tab opens`);
    await fits(p, `artist ${tab.toLowerCase()}`);
  }
  // messages: compose on the phone
  await tapTab(p, 'Messages');
  await p.getByRole('button', { name: 'New message' }).tap();
  await dialogFits(p, 'artist new message');
  const dlg = p.getByRole('dialog').last();
  const opts = await dlg.getByRole('combobox').first().locator('option').allInnerTexts();
  await dlg.getByRole('combobox').first().selectOption({ label: opts.find((o) => o.includes('Tangy Sessions Vol. 5')) });
  await dlg.getByLabel('Subject').fill('Parking');
  await dlg.getByLabel('Message *').fill('Is there parking for a tempo traveller?');
  await dlg.getByRole('button', { name: 'Send' }).tap();
  check(await until(p.getByRole('region', { name: 'Conversation' }).getByText('Is there parking for a tempo traveller?')), 'artist sends a message from the phone');
  await fits(p, 'artist message thread');

  for (const [path, heading, label] of [
    ['/artist/requests', 'Booking requests', 'artist requests'],
    ['/artist/media', 'Media', 'artist media'],
    ['/artist/profile', null, 'artist profile'],
    ['/artist/settings', 'Settings', 'artist settings'],
  ]) {
    await p.goto(BASE + path);
    check(await until(heading ? p.getByRole('heading', { name: heading, exact: true }) : p.getByRole('tab', { name: 'Identity' })), `${label} opens`);
    await fits(p, label);
  }
  await p.goto(BASE + '/artist/media');
  await p.locator('[data-media-input]').setInputFiles({ name: 'e2e-phone.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
  await dialogFits(p, 'artist media upload');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Upload' }).tap();
  check(await until(p.getByText('Uploaded and sent to Tangy for review.')), 'artist uploads media from the phone');
  await p.goto(BASE + '/artist/profile');
  await p.getByRole('tab', { name: 'Performance' }).tap();
  await p.getByLabel('Typical set length (minutes)').fill('75');
  const save = p.getByRole('button', { name: 'Save profile' });
  await save.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const hitsSave = await save.evaluate((el) => { const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el === top || el.contains(top); });
  check(hitsSave, 'artist profile: Save button is reachable (not covered by the dock or launcher)');
  await save.tap();
  check(await until(p.getByRole('status').getByText('Profile saved.')), 'artist saves the profile from the phone');
  await p.goto(BASE + '/artist/settings');
  const sw = p.getByRole('switch', { name: 'Announcements email' });
  await sw.tap();
  check(await until(p.getByRole('status').getByText('Saved')), 'artist toggles a notification preference');
  await sw.tap();
  await shot(p, 'm05-artist-settings');
}

// ---------------------------------------------------------------- admin: notifications + messages on the phone
{
  const p = admin.page;
  await p.goto(BASE + '/admin-portal');
  await p.getByRole('button', { name: /^Notifications/ }).tap();
  const panel = p.getByRole('dialog', { name: 'Notifications' });
  check(await until(panel.getByText(/New message from Aria Artist/)), 'admin bell lists the artist’s message');
  await dialogFits(p, 'admin notification panel');
  await p.keyboard.press('Escape');
  await p.goto(BASE + '/admin-portal/notifications');
  check(await until(p.getByText(/New message from Aria Artist/).first()), 'admin notifications page lists it');
  await fits(p, 'admin notifications page');
  await p.goto(BASE + '/admin-portal/messages');
  await p.getByRole('button', { name: /Aria Artist/ }).first().tap();
  const thread = p.getByRole('region', { name: 'Conversation' });
  check(await until(thread.getByText('Is there parking for a tempo traveller?')), 'admin opens the thread on the phone (list → thread)');
  await p.getByLabel('Message', { exact: true }).fill('Yes — bay 2 behind the stepwell.');
  await p.getByLabel('Message', { exact: true }).press('Enter');
  check(await until(thread.getByText('Yes — bay 2 behind the stepwell.')), 'admin replies from the phone');
  await fits(p, 'admin message thread');
  await p.getByRole('button', { name: 'Back to conversations' }).tap();
  check(await until(p.getByRole('complementary', { name: 'Conversations' })), 'admin returns to the inbox list');
  await shot(p, 'm06-admin-messages');
}
{
  const p = artist.page;
  await p.goto(BASE + '/artist/dashboard?tab=messages');
  await p.getByRole('button', { name: /Parking/ }).first().tap();
  check(await until(p.getByRole('region', { name: 'Conversation' }).getByText('Yes — bay 2 behind the stepwell.')), 'artist reads the reply on the phone');
  await p.getByRole('button', { name: 'Back to conversations' }).tap();
  check(await until(p.getByRole('button', { name: 'New message' })), 'artist returns to the conversation list');
}

// ================================================================ PARTNER PORTALS
async function partner(email, dash, label, extra) {
  const s = await signIn(email, '/join/login');
  const p = s.page;
  await p.goto(BASE + dash);
  check(await until(p.getByRole('region', { name: 'Next event' }).getByText('Tangy Sessions Vol. 5')), `${label}: dashboard on a phone`);
  await fits(p, `${label} dashboard`);
  const strip = p.locator('[role="tablist"]').first();
  const sw = await strip.evaluate((el) => { for (let n = el; n; n = n.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true; } return el.scrollWidth <= el.clientWidth + 1; });
  check(sw, `${label}: tab strip scrolls instead of overflowing`);
  await tapTab(p, label === 'venue host' ? 'Upcoming events' : 'My events');
  await p.getByRole('button', { name: /Tangy Sessions Vol\. 5/ }).first().tap();
  await dialogFits(p, `${label} event drawer`);
  await p.getByRole('dialog').last().getByRole('button', { name: 'Close' }).tap();
  await tapTab(p, 'Notifications');
  check(await until(p.getByRole('tablist', { name: 'Filter notifications' })), `${label}: notifications open`);
  await fits(p, `${label} notifications + preferences`);
  if (extra) await extra(p);
  await shot(p, `m07-${label.replace(/\W+/g, '-')}`);
  return s;
}
const sponsor = await partner('sponsor@tangy.test', '/sponsor/dashboard', 'sponsor', async (p) => {
  await tapTab(p, 'Brand assets');
  await p.getByRole('button', { name: 'Upload' }).tap();
  await p.locator('input[type="file"]').setInputFiles({ name: 'e2e-phone-logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
  await dialogFits(p, 'sponsor asset upload');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Cancel' }).tap();
  for (const t of ['Payments', 'DELIVERABLES']) {
    await p.getByRole('tab', { name: new RegExp(t, 'i') }).first().tap();
    await fits(p, `sponsor ${t.toLowerCase()}`);
  }
});
const vendor = await partner('vendorco@tangy.test', '/vendor/dashboard', 'vendor', async (p) => {
  for (const t of ['Requirements', 'Documents', 'Payments']) { await tapTab(p, t); await fits(p, `vendor ${t.toLowerCase()}`); }
});
const venue = await partner('venue@tangy.test', '/venue/dashboard', 'venue host', async (p) => {
  await tapTab(p, 'Messages');
  await p.getByRole('button', { name: 'New message' }).tap();
  await dialogFits(p, 'venue host new message');
  await p.getByRole('dialog').last().getByRole('button', { name: 'Cancel' }).tap();
});
const vol = await partner('volunteer@tangy.test', '/volunteer/dashboard', 'volunteer', async (p) => {
  await tapTab(p, 'My tasks');
  await fits(p, 'volunteer my tasks');
  await tapTab(p, 'Check-in access');
  check(await until(p.getByText('No active check-in access')), 'volunteer: check-in access tab usable');
  const req = p.getByRole('button', { name: /Request access · Tangy Sessions Vol\. 5/ });
  const rb = await req.boundingBox();
  check(rb && rb.x + rb.width <= W, 'volunteer: request-access button reachable');
  await fits(p, 'volunteer check-in access');
});

// ================================================================ QR CHECK-IN TERMINAL (staff phone)
const staff = await signIn('staff@tangy.test', '/admin-portal');
{
  const p = staff.page;
  await p.getByRole('heading', { name: /hello/i }).waitFor({ timeout: 15000 });
  await fits(p, 'staff dashboard');
  await p.goto(BASE + '/check-in');
  await p.getByRole('button', { name: 'Manual', exact: true }).tap();
  const input = p.getByPlaceholder('Name, booking code or ticket number');
  check(await until(input), 'check-in terminal: manual lookup usable on a phone');
  await input.fill('TS-LOCAL002');
  check(await until(p.getByRole('button', { name: 'Check in' }).first()), 'check-in terminal: guest found, action button visible');
  await fits(p, 'check-in terminal');
  await shot(p, 'm08-checkin');
}

for (const [label, s] of [['admin', admin], ['artist', artist], ['sponsor', sponsor], ['vendor', vendor], ['venue', venue], ['volunteer', vol], ['staff', staff]]) {
  track(label, s.errors);
  await s.browser.close();
}
console.log('\nERRORS:\n' + (allErrors.join('\n') || '(none)'));
