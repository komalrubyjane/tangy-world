// Development-only role selector (src/admin/dev/). Needs two `vite` dev
// servers against the LOCAL stack — see e2e/README.md:
//   DEV_MOCK_BASE   no SUPABASE_SERVICE_ROLE_KEY  → mock-only identities
//   DEV_LOCAL_BASE  with the local service key    → real local sessions
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const SHOTS = fileURLToPath(new URL('./shots/devmode/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
let failures = 0;
const check = (c, l) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${l}`); if (!c) failures++; };
const FORBID = "you don't have permission to access this section";

const EXPECT = {
  super_admin: {
    label: 'Super Admin', heading: /good (morning|afternoon|evening)/i,
    nav: ['Dashboard', 'Applications', 'Events', 'Bookings & Payments', 'Attendees', 'Users & Roles', 'Content', 'Reports', 'Audit Logs', 'System Settings', 'Tangy AI', 'Messages', 'Volunteers', 'Roles & Permissions'],
    hidden: [], allowed: ['/admin-portal/users', '/admin-portal/audit', '/admin-portal/settings', '/admin-portal/ai', '/admin-portal/events', '/admin-portal/applications', '/admin-portal/bookings', '/admin-portal/reports'], blocked: [],
  },
  admin: {
    label: 'Admin / Manager', heading: /good (morning|afternoon|evening)/i,
    nav: ['Dashboard', 'Applications', 'Events', 'Bookings & Payments', 'Attendees', 'Content', 'Team', 'Reports', 'Messages', 'Volunteers'],
    hidden: ['Users & Roles', 'Audit Logs', 'System Settings', 'Tangy AI', 'Roles & Permissions'],
    allowed: ['/admin-portal/events', '/admin-portal/applications', '/admin-portal/bookings', '/admin-portal/attendees', '/admin-portal/reports', '/admin-portal/team'],
    blocked: ['/admin-portal/users', '/admin-portal/audit', '/admin-portal/settings', '/admin-portal/ai'],
  },
  staff: {
    label: 'Staff', heading: /hello/i,
    nav: ['Dashboard', 'My Events', 'Attendees', 'QR Check-in', 'Check-in History', 'Event Tasks', 'Announcements', 'Event Info'],
    hidden: ['Applications', 'Bookings & Payments', 'Users & Roles', 'Audit Logs', 'System Settings', 'Tangy AI', 'Reports', 'Team', 'Messages', 'Volunteers', 'Roles & Permissions'],
    allowed: ['/admin-portal/my-events', '/admin-portal/attendees', '/admin-portal/check-ins', '/admin-portal/tasks', '/admin-portal/announcements', '/admin-portal/event-info'],
    blocked: ['/admin-portal/users', '/admin-portal/audit', '/admin-portal/settings', '/admin-portal/ai', '/admin-portal/applications', '/admin-portal/bookings', '/admin-portal/events', '/admin-portal/reports'],
  },
};

async function run(base, modeName) {
  console.log(`\n######## ${modeName} (${base})`);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const main = async () => (await page.locator('main').innerText().catch(() => '')).toLowerCase();

  const selector = page.locator('[data-dev-role-selector]');
  await page.goto(base + '/demo-admin');
  await page.waitForURL('**/admin-portal');
  check(await selector.waitFor({ timeout: 10000 }).then(() => true, () => false), `${modeName}: /demo-admin redirects to the role selector`);
  const body0 = await page.locator('body').innerText();
  check(/DEMO \/ DEVELOPMENT MODE/i.test(body0) && /Select a role to preview/.test(body0), `${modeName}: selector shows dev indicator + prompt`);
  check(!/TEAM PREVIEW/i.test(body0), `${modeName}: legacy demo admin is not the entry`);
  for (const t of ['Super Admin', 'Admin / Manager', 'Staff']) check(await page.getByRole('region', { name: t, exact: true }).isVisible(), `${modeName}: selector card ${t}`);
  await page.screenshot({ path: `${SHOTS}${modeName}-00-selector.png`, fullPage: true });
  await page.getByRole('region', { name: 'Artist', exact: true }).getByRole('button', { name: 'Open portal' }).click();
  if (modeName === 'mock') {
    check(await page.getByText(/Partner portals need a local Supabase session/).waitFor({ timeout: 10000 }).then(() => true, () => false), 'mock: partner portal refuses cleanly without a local session');
  } else {
    await page.waitForURL('**/artist/dashboard', { timeout: 15000 });
    check(await page.getByRole('tab', { name: 'Messages' }).waitFor({ timeout: 10000 }).then(() => true, () => false), 'local: artist portal opens with a real session');
    check(await page.getByText(/local test account/i).first().isVisible(), 'local: dev strip on the portal');
    await page.getByRole('button', { name: 'Change role' }).click();
    await page.waitForURL('**/admin-portal');
  }
  await page.locator('[data-dev-role-selector]').waitFor();
  await page.getByRole('button', { name: 'Sign in with a real account instead' }).click();
  check(await page.getByPlaceholder('you@example.com').waitFor({ timeout: 5000 }).then(() => true, () => false), `${modeName}: real email sign-in still reachable`);
  await page.reload();
  await selector.waitFor();

  for (const [role, e] of Object.entries(EXPECT)) {
    await selector.waitFor({ timeout: 10000 });
    await page.getByRole('region', { name: e.label, exact: true }).getByRole('button', { name: 'Enter dashboard' }).click();
    const ok = await page.getByRole('heading', { name: e.heading }).first().waitFor({ timeout: 15000 }).then(() => true, () => false);
    check(ok, `${role}: lands on its dashboard`);
    const strip = await page.locator('[data-dev-mode-strip]').innerText().catch(() => '');
    const want = modeName === 'local' ? /local test account/i : /no real account — no database changes/i;
    check(/development mode/i.test(strip) && /previewing as/i.test(strip) && strip.toLowerCase().includes(e.label.toLowerCase()) && want.test(strip), `${role}: dev banner shows role (${strip.replace(/\s+/g, ' ').slice(0, 90)})`);
    const dash = (await main());
    if (modeName === 'mock') check(!/irani chai|tangy sessions vol\.|anika rao/.test(dash), `${role}: no demo/fake data in mock mode`);
    if (modeName === 'local' && role !== 'staff') check(await page.locator('main').getByText(/Tangy Sessions Vol\./).first().waitFor({ timeout: 10000 }).then(() => true, () => false), `${role}: real local data on dashboard`);
    await page.screenshot({ path: `${SHOTS}${modeName}-${role}-dashboard.png` });

    const nav = await page.locator('nav[aria-label="Admin navigation"]').innerText();
    check(e.nav.every((n) => nav.includes(n)), `${role}: nav has ${e.nav.length} expected items`);
    const leaked = e.hidden.filter((n) => nav.split('\n').some((line) => line.trim() === n));
    check(leaked.length === 0, `${role}: nav hides admin-only items${leaked.length ? ' (leaked: ' + leaked + ')' : ''}`);

    for (const p of e.allowed) {
      await page.goto(base + p); await page.waitForTimeout(900);
      const t = await main();
      check(!t.includes(FORBID) && (modeName === 'mock' || !/something went wrong|do not have access/i.test(t)), `${role}: ${p} accessible${modeName === 'local' ? ' with data loading cleanly' : ''}`);
    }
    for (const p of e.blocked) {
      await page.goto(base + p); await page.waitForTimeout(900);
      check((await main()).includes(FORBID), `${role}: direct URL ${p} blocked`);
    }
    // persistence
    await page.goto(base + '/admin-portal'); await page.reload();
    check(await page.getByRole('heading', { name: e.heading }).first().waitFor({ timeout: 15000 }).then(() => true, () => false), `${role}: survives page refresh`);
    const who = await page.locator('body').innerText().catch(() => '');
    check(who.includes(`Tangy ${role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Staff'}`), `${role}: header shows the dev identity`);
    if (role !== 'staff') {
      await page.goto(base + '/admin-portal/reports');
      await page.getByRole('button', { name: 'Change role' }).click();
      check(await selector.waitFor({ timeout: 10000 }).then(() => true, () => false) && page.url().endsWith('/admin-portal'), `${role}: Change role returns to the selector at /admin-portal`);
    }
  }

  // staff: QR check-in terminal opens for the mock identity
  await page.goto(base + '/check-in'); await page.waitForTimeout(2500);
  const ci = (await page.locator('body').innerText()).toLowerCase();
  check(!ci.includes('you@example.com') && /check-in/.test(ci), 'staff: /check-in opens (not the sign-in form)');
  await page.screenshot({ path: `${SHOTS}${modeName}-staff-checkin.png` });

  // literal paths from the request (not console routes)
  for (const p of ['/users', '/audit-logs', '/settings']) {
    await page.goto(base + p); await page.waitForTimeout(1200);
    const t = (await page.locator('body').innerText()).toLowerCase();
    check(!/users & roles|audit logs|system settings/.test(t.slice(0, 2000)) || t.includes(FORBID), `staff: ${p} exposes no admin module (${t.includes('404') || t.includes('not found') ? 'site 404' : 'other page'})`);
  }

  // sign out leaves dev mode for good (back to the selector, not the console)
  await page.goto(base + '/admin-portal');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await selector.waitFor();
  await page.reload();
  check(await selector.waitFor({ timeout: 8000 }).then(() => true, () => false), 'sign out + refresh shows the role selector');

  console.log('page errors:', errors.join(' | ') || '(none)');
  await browser.close();
}

await run(process.env.DEV_MOCK_BASE || 'http://127.0.0.1:5173', 'mock');
await run(process.env.DEV_LOCAL_BASE || 'http://127.0.0.1:5174', 'local');
console.log(`\nfailures: ${failures}`);
process.exitCode = failures ? 1 : 0;
