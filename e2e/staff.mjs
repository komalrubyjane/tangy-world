import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';
import { fileURLToPath } from 'node:url';

const CAM = fileURLToPath(new URL('./cam/', import.meta.url));
const text = async (page) => (await page.locator('main').innerText()).toLowerCase();

// ---------- Desktop: staff RBAC ----------
{
  const { browser, page, errors } = await launch();
  await otpLogin(page, 'staff@tangy.test');
  await page.getByRole('heading', { name: /hello/i }).waitFor({ timeout: 15000 });
  await shot(page, 's01-staff-dashboard');
  const t = await text(page);
  check(t.includes("you're working tangy sessions vol. 5 today"), 'staff dashboard: today\'s event');
  check(t.includes('collect radio'), 'staff dashboard: today\'s tasks');
  check(t.includes('gates open 6:15 pm'), 'staff dashboard: event announcement');

  const nav = await page.locator('nav[aria-label="Admin navigation"]').innerText();
  for (const item of ['Dashboard', 'My Events', 'Attendees', 'QR Check-in', 'Check-in History', 'Event Tasks', 'Announcements', 'Event Info'])
    check(nav.includes(item), `staff nav has ${item}`);
  for (const item of ['Applications', 'Bookings & Payments', 'Users & Roles', 'Audit Logs', 'System Settings', 'Reports', 'Tangy AI', 'Team', 'Messages', 'Volunteers', 'Roles & Permissions', 'Vendors'])
    check(!nav.includes(item), `staff nav hides ${item}`);

  for (const path of ['/admin/users', '/admin/settings', '/admin/audit', '/admin/bookings', '/admin/applications', '/admin/reports', '/admin/events', '/admin/messages', '/admin/volunteers', '/admin/roles'])  {
    await page.goto(BASE + path);
    await page.waitForTimeout(1200);
    check((await text(page)).includes("you don't have permission to access this section"), `direct URL ${path} is forbidden for staff`);
  }
  await shot(page, 's02-staff-forbidden');

  await page.goto(BASE + '/admin/my-events');
  await page.getByText('Tangy Sessions Vol. 5').first().waitFor();
  check(!(await text(page)).includes('vol. 6'), 'my events: only assigned event');

  await page.goto(BASE + '/admin/attendees');
  await page.waitForTimeout(2000);
  const at = await text(page);
  check(at.includes('ts-local003') && !at.includes('ts-local005'), 'attendees: only assigned event tickets');
  await shot(page, 's03-staff-attendees');

  await page.goto(BASE + '/admin/tasks');
  await page.getByText('Collect radio').first().waitFor();
  await page.getByLabel('Task status').first().selectOption('done');
  await page.getByText('Task marked done').or(page.getByText(/updated/i)).first().waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, 's04-staff-tasks');

  await page.goto(BASE + '/admin/event-info');
  await page.waitForTimeout(1500);
  check((await text(page)).includes('your role'), 'event info renders for staff');

  // ---- Direct API attacks with the staff user's own JWT ----
  const me = await page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith('-auth-token')))).user.id);
  let r = await api(page, 'PATCH', `/rest/v1/profiles?id=eq.${me}`, { role: 'super_admin' });
  const role = await api(page, 'GET', `/rest/v1/profiles?id=eq.${me}&select=role`);
  check(role.data?.[0]?.role === 'staff', `role escalation via PATCH blocked (status ${r.status})`);
  r = await api(page, 'GET', '/rest/v1/audit_logs?select=id&limit=5');
  check(Array.isArray(r.data) && r.data.length === 0, 'staff cannot read audit_logs via API');
  r = await api(page, 'GET', '/rest/v1/bookings?select=id&limit=5');
  check(Array.isArray(r.data) && r.data.length === 0, 'staff cannot read bookings via API');
  r = await api(page, 'GET', '/rest/v1/system_settings?select=key');
  check(!Array.isArray(r.data) || r.data.length === 0, 'staff cannot read system_settings via API');
  r = await api(page, 'GET', "/rest/v1/attendee_tickets?select=ticket_number&event_name=eq.Tangy%20Sessions%20Vol.%206");
  check(Array.isArray(r.data) && r.data.length === 0, 'staff cannot read another event\'s attendees via API');
  r = await api(page, 'POST', '/rest/v1/rpc/approve_crew_application', { p_id: '00000000-0000-0000-0000-000000000000' });
  check(r.status >= 400 && /permission|not allowed|forbidden|denied/i.test(JSON.stringify(r.data)), `staff cannot call approve RPC (status ${r.status}: ${r.data?.message})`);
  r = await api(page, 'POST', '/rest/v1/checkins', { ticket_id: '00000000-0000-0000-0000-000000000000' });
  check(r.status >= 400, `staff cannot insert checkins directly (status ${r.status})`);

  console.log('\nERRORS (desktop staff):\n' + (errors.filter((e) => !/\b(401|403|400|404)\b|permission denied|row-level/i.test(e)).join('\n') || '(none)'));
  await browser.close();
}

// ---------- Mobile: QR check-in through a fake camera ----------
async function scan(file, label, expectTitle, shotName, { holdMs = 0 } = {}) {
  const { browser, page, errors } = await launch({ mobile: true, camera: CAM + file });
  await otpLogin(page, 'staff@tangy.test', '/check-in');
  const card = page.getByRole('status');
  const ok = await card.getByText(expectTitle, { exact: true }).waitFor({ timeout: 20000 }).then(() => true, () => false);
  await shot(page, shotName);
  check(ok, `${label}: result card shows "${expectTitle}"`);
  const cardText = ok ? await card.innerText() : '';
  if (holdMs) {
    await page.waitForTimeout(holdMs); // ticket stays in front of the camera
    const still = (await card.innerText().catch(() => '')).toLowerCase();
    check(still.startsWith(expectTitle.toLowerCase()), `${label}: result stays "${expectTitle}" while the QR is held in frame (${holdMs / 1000}s)`);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, `${label}: no horizontal scroll at 390px`);
  const errs = errors.filter((e) => !/favicon/.test(e));
  if (errs.length) console.log('  errors:', errs.join(' | '));
  await browser.close();
  return cardText;
}

let b = await scan('valid.y4m', 'valid QR', 'Checked in', 'm01-valid', { holdMs: 6000 });
check(/TS-LOCAL003-01/.test(b) && /by Sam Staff/.test(b), `valid QR: card shows ticket + staff member (${b.replace(/\n/g, ' | ')})`);
b = await scan('valid.y4m', 'same QR again', 'Already checked in', 'm02-already');
check(/First checked in at .* by Sam Staff/.test(b), 'duplicate: shows original check-in time and staff');
await scan('wrong.y4m', 'Vol. 6 QR at Vol. 5', 'Wrong event', 'm03-wrong-event');
await scan('invalid.y4m', 'bogus QR', 'Invalid ticket', 'm04-invalid');

// Manual check-in on mobile
{
  const { browser, page } = await launch({ mobile: true });
  await otpLogin(page, 'staff@tangy.test', '/check-in');
  const manualBtn = page.getByRole('button', { name: 'Manual', exact: true });
  await manualBtn.waitFor({ timeout: 15000 });
  await shot(page, 'm05a-before-manual');
  await manualBtn.click();
  await page.getByPlaceholder('Name, booking code or ticket number').fill('TS-LOCAL001');
  await page.getByRole('button', { name: 'Check in' }).first().click();
  const ok = await page.getByRole('status').getByText('Checked in', { exact: true }).waitFor({ timeout: 10000 }).then(() => true, () => false);
  await shot(page, 'm05-manual');
  check(ok, 'manual check-in succeeds');
  await browser.close();
}
