import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

const text = async (page) => (await page.locator('main').innerText()).toLowerCase();
const { browser, page, errors } = await launch();
await otpLogin(page, 'manager@tangy.test');
await page.getByRole('heading', { name: /operations/i }).waitFor({ timeout: 15000 });
await shot(page, 'a01-manager-dashboard');

const nav = await page.locator('nav[aria-label="Admin navigation"]').innerText();
for (const item of ['Dashboard', 'Applications', 'Events', 'Bookings & Payments', 'Attendees', 'Announcements', 'Team', 'Reports', 'Messages', 'Volunteers', 'Artists', 'Sponsors', 'Vendors', 'Venue Hosts'])
  check(nav.includes(item), `manager nav has ${item}`);
for (const item of ['Users & Roles', 'Audit Logs', 'System Settings', 'Tangy AI', 'Roles & Permissions'])
  check(!nav.includes(item), `manager nav hides ${item}`);
for (const path of ['/admin/users', '/admin/settings', '/admin/audit', '/admin/ai', '/admin/roles']) {
  await page.goto(BASE + path);
  await page.waitForTimeout(1200);
  check((await text(page)).includes("you don't have permission to access this section"), `direct URL ${path} is forbidden for manager`);
}

// Event lifecycle: create (draft) → publish → cancel
await page.goto(BASE + '/admin/events?new=1');
await page.getByLabel('Event name *').fill('E2E Manager Night');
await page.getByLabel('Date *').fill('2026-12-20');
await page.getByRole('button', { name: 'Create event' }).click();
await page.getByRole('tab', { name: 'Overview' }).waitFor();
check(/draft/.test(await text(page)), 'new event starts as draft');
for (const [status, label] of [['on-sale', 'published (on sale)'], ['cancelled', 'cancelled']]) {
  await page.getByRole('tab', { name: 'Details', exact: true }).click();
  await page.getByLabel('Status').selectOption(status);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForTimeout(1500);
  const st = await api(page, 'GET', '/rest/v1/events?slug=eq.e2e-manager-night&select=status');
  check(st.data?.[0]?.status === status, `event ${label} (db status ${st.data?.[0]?.status})`);
}

// Team assignment: put staff2 on Vol. 6
await page.goto(BASE + '/admin/events');
await page.getByText('Tangy Sessions Vol. 6').first().click();
await page.getByRole('tab', { name: 'Staff team', exact: true }).click();
const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Assign' }) });
const person = form.getByLabel('Person');
await person.locator('option', { hasText: 'Tara Staff' }).waitFor({ state: 'attached' });
await person.selectOption({ label: 'Tara Staff · Staff' });
await form.getByLabel('Responsibility').fill('Gate check-in');
await form.getByRole('button', { name: 'Assign' }).click();
await page.getByText('Team member assigned').waitFor({ timeout: 8000 }).catch(() => {});
await shot(page, 'a02-assign-staff');
const asg = await api(page, 'GET', '/rest/v1/event_assignments?select=title,assignee_role,events(name)&title=eq.Gate%20check-in');
check(asg.data?.some((a) => a.events?.name === 'Tangy Sessions Vol. 6' && a.assignee_role === 'staff'), 'staff assigned to Vol. 6 via UI');

// Staff announcement for Vol. 6
await page.goto(BASE + '/admin/content');
await page.getByRole('button', { name: 'New announcement' }).click();
const dlg = page.getByRole('dialog').last();
await dlg.getByLabel('Title *').fill('E2E Vol 6 load-in 4pm');
await dlg.getByLabel('Message').fill('Crew call at 4pm');
await dlg.getByLabel('Audience').selectOption('staff');
const evOpts = await dlg.getByLabel(/^Event/).locator('option').allInnerTexts();
await dlg.getByLabel(/^Event/).selectOption({ label: evOpts.find((o) => o.includes('Vol. 6')) });
await dlg.getByLabel('Status').selectOption('published');
await dlg.getByRole('button', { name: 'Create' }).click();
await page.getByText('Announcement created').waitFor({ timeout: 8000 });
check(true, 'staff announcement created');
const ann = await api(page, 'GET', '/rest/v1/announcements?title=eq.E2E%20Vol%206%20load-in%204pm&select=author_id,event_id');
check(ann.data?.[0]?.author_id && ann.data?.[0]?.event_id, 'announcement has author + event');

// Bookings visible, audit/settings/roles are not
let r = await api(page, 'GET', '/rest/v1/bookings?select=id');
check(Array.isArray(r.data) && r.data.length > 0, 'manager can read bookings');
r = await api(page, 'GET', '/rest/v1/audit_logs?select=id&limit=3');
check(Array.isArray(r.data) && r.data.length === 0, 'manager cannot read audit_logs');
const staff = await api(page, 'GET', '/rest/v1/profiles?email=eq.staff@tangy.test&select=id,role');
r = await api(page, 'PATCH', `/rest/v1/profiles?id=eq.${staff.data?.[0]?.id}`, { role: 'admin' });
const after = await api(page, 'GET', '/rest/v1/profiles?email=eq.staff@tangy.test&select=role');
check(after.data?.[0]?.role === 'staff', `manager cannot promote staff via API (status ${r.status})`);
r = await api(page, 'POST', '/rest/v1/rpc/update_system_setting', { p_key: 'checkin.allow_manual', p_value: false });
check(r.status >= 400, `manager cannot change system settings (status ${r.status}: ${r.data?.message})`);

console.log('\nERRORS:\n' + (errors.filter((e) => !/\b(401|403|400)\b|permission|row-level/i.test(e)).join('\n') || '(none)'));
await browser.close();

// Staff2 now sees the Vol. 6 assignment + announcement
{
  const { browser, page } = await launch();
  await otpLogin(page, 'staff2@tangy.test');
  await page.getByRole('heading', { name: /hello/i }).waitFor({ timeout: 15000 });
  await page.goto(BASE + '/admin/my-events');
  await page.waitForTimeout(1500);
  check((await text(page)).includes('vol. 6'), 'assigned staff2 sees Vol. 6 in My Events');
  await page.goto(BASE + '/admin/announcements');
  await page.waitForTimeout(1500);
  const t = await text(page);
  check(t.includes('e2e vol 6 load-in') && !t.includes('gates open 6:15'), 'staff2 sees Vol. 6 announcement, not Vol. 5\'s');
  await browser.close();
}
