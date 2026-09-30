import { launch, otpLogin, shot, check, BASE, sectionTab } from './lib.mjs';

const { browser, page, errors } = await launch();
await page.goto(BASE + '/admin-portal');
await page.getByText('Tangy Admin Portal').waitFor();
await shot(page, '01-login');
check(await page.getByPlaceholder('you@example.com').isVisible(), 'unauthenticated /admin-portal shows sign-in');

await otpLogin(page, 'root@tangy.test');
await page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).waitFor({ timeout: 15000 });
await shot(page, '02-superadmin-dashboard');
const nav = await page.locator('nav[aria-label="Admin navigation"]').innerText();
for (const item of ['Applications', 'Events', 'Bookings', 'Payments', 'Waitlist', 'Users & Roles', 'Audit Logs', 'System Settings', 'Tangy AI', 'Reports'])
  check(nav.includes(item), `super admin nav has ${item}`);
check(await page.getByText('Needs attention').isVisible(), 'dashboard: needs attention panel');
check((await page.locator('main').innerText()).includes('Tangy Sessions Vol. 6'), 'dashboard: upcoming event listed');

// Applications — approve vendor
await page.goto(BASE + '/admin-portal/applications');
await page.getByText('Irani Chai Cart').first().waitFor();
await shot(page, '03-applications');
await page.getByText('Irani Chai Cart').first().click();
await page.getByRole('button', { name: 'Approve' }).click();
await page.getByRole('dialog').last().getByRole('textbox').fill('Great fit — chai for Vol. 5');
await page.getByRole('dialog').last().getByRole('button', { name: 'Approve' }).click();
await page.getByText('Irani Chai Cart approved').waitFor();
await page.waitForTimeout(1200);
await page.goto(BASE + '/admin-portal/applications?status=approved');
await page.getByText('Irani Chai Cart').first().waitFor();
check(true, 'vendor application approved via UI');

// Reject crew with reason
await page.goto(BASE + '/admin-portal/applications?type=crew');
await page.getByText('Cam Crew').first().click();
await page.getByRole('button', { name: 'Reject' }).click();
const rejectBtn = page.getByRole('dialog').last().getByRole('button', { name: 'Reject' });
check(await rejectBtn.isDisabled(), 'reject requires a reason');
await page.getByRole('dialog').last().getByRole('textbox').fill('No sound roles open this season');
await rejectBtn.click();
await page.waitForTimeout(1200);

// Events
await page.goto(BASE + '/admin-portal/events');
await page.getByText('Tangy Sessions Vol. 5').first().waitFor();
await shot(page, '04-events');
await page.getByText('Tangy Sessions Vol. 5').first().click();
await sectionTab(page, 'Overview').waitFor();
await shot(page, '05-event-overview');
for (const tab of ['Details', 'Artists', 'Venue', 'Sponsors', 'Crew & vendors', 'Volunteers', 'Staff team', 'Schedule', 'Tickets', 'Bookings', 'Attendees', 'Check-in', 'Tasks', 'Requirements', 'Announcements', 'Messages', 'Documents', 'Content', 'Reports', 'Activity']) {
  await sectionTab(page, tab, { exact: true }).click();
  await page.waitForTimeout(600);
  const t = await page.locator('main').innerText();
  check(!/Something went wrong|permission to access/i.test(t), `event tab ${tab} renders`);
}
await sectionTab(page, 'Staff team', { exact: true }).click();
await shot(page, '06-event-team');

// Create event
await page.goto(BASE + '/admin-portal/events?new=1');
await page.getByLabel('Event name *').fill('E2E Test Night');
await page.getByLabel('Date *').fill('2026-12-12');
await page.getByRole('button', { name: 'Create event' }).click();
await sectionTab(page, 'Overview').waitFor();
check((await page.locator('h1').innerText()).includes('E2E TEST NIGHT') || (await page.locator('h1').innerText()).toLowerCase().includes('e2e test night'), 'event created and opened');

// Bookings + drawer
await page.goto(BASE + '/admin-portal/bookings');
await page.getByText('TS-LOCAL002').first().waitFor();
await page.getByRole('table').getByText('TS-LOCAL002').click();
await page.getByText('Tickets (1)').waitFor();
await shot(page, '07-booking-drawer');
check(await page.getByRole('button', { name: 'Record refund' }).isVisible(), 'paid booking offers record refund');
await page.keyboard.press('Escape');

// Attendees, reports, audit, settings, users, ai, content, team
for (const [path, text, name] of [
  ['/admin-portal/attendees', 'Anika Rao', '08-attendees'],
  ['/admin-portal/reports', 'Event performance', '09-reports'],
  ['/admin-portal/audit', 'Approved application', '10-audit'],
  ['/admin-portal/settings', 'Allow manual check-in', '11-settings'],
  ['/admin-portal/users', 'manager@tangy.test', '12-users'],
  ['/admin-portal/ai', 'Not connected', '13-ai'],
  ['/admin-portal/content/announcements', 'Gates open 6:15 PM', '14-content'],
  ['/admin-portal/team', 'Staff roster', '15-team'],
  ['/admin-portal/people/venues', 'Bansilalpet Stepwell', '16-venues'],
  ['/admin-portal/check-ins', 'Check-in history', '17-checkins'],
  ['/admin-portal/ops/waitlist', 'Waitlist', '18-ops-waitlist'],
]) {
  await page.goto(BASE + path);
  await page.getByText(text).first().waitFor({ timeout: 10000 }).catch(() => {});
  const ok = (await page.locator('main').innerText()).toLowerCase().includes(text.toLowerCase());
  check(ok, `${path} shows "${text}"`);
  await shot(page, name);
}

// Legacy ?tab= redirect
await page.goto(BASE + '/admin-portal?tab=events');
await page.waitForURL('**/admin-portal/events');
check(true, 'legacy ?tab=events redirects');
await page.goto(BASE + '/admin/events?status=all#top');
await page.waitForURL('**/admin-portal/events?status=all#top');
check(true, 'legacy /admin/* URL redirects to /admin-portal/* keeping query + hash');

// Command palette
await page.goto(BASE + '/admin-portal');
await page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).waitFor();
await page.keyboard.press('Meta+k');
await page.getByPlaceholder('Search events, people, bookings — or jump to a section…').fill('audit');
await shot(page, '19-palette');
await page.keyboard.press('Enter');
await page.waitForURL('**/admin-portal/audit');
check(true, 'command palette navigates');

// Global search (admin_search RPC, permission-scoped)
await page.keyboard.press('Meta+k');
await page.getByPlaceholder('Search events, people, bookings — or jump to a section…').fill('Anika');
await page.getByRole('dialog').getByText(/Anika Rao/).first().waitFor({ timeout: 10000 }).catch(() => {});
check(/Anika Rao/.test(await page.getByRole('dialog').innerText()), 'global search finds a booking/attendee by name');
await page.keyboard.press('Escape');

// Logout
await page.getByRole('button', { name: 'Account menu' }).click();
await page.getByRole('menuitem', { name: 'Sign out' }).click();
await page.getByPlaceholder('you@example.com').waitFor();
check(true, 'logout returns to sign-in');

console.log('\nERRORS:\n' + (errors.join('\n') || '(none)'));
await browser.close();
