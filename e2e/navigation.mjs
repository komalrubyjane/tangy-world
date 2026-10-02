// Every Navbar destination is a real page with its own URL (src/config/siteNav.js).
//
// Desktop (1440): for each dropdown item — start on the parent page, open the
// dropdown, click the item, check the URL and the page's <h1>, check the
// parent menu is highlighted, reload, Back (to the start page), Forward.
// Mobile (375 / 390 / 412): the index menu reaches the same URLs.
// Also: no Navbar link is an #anchor, old URLs redirect, unknown sub-pages 404,
// and breadcrumbs lead back to the section page.
import { launch, check, BASE } from './lib.mjs';
import { NAV_SECTIONS, sectionFor } from '../src/config/siteNav.js';

const path = (page) => new URL(page.url()).pathname;
const h1 = async (page) => (await page.locator('h1').first().innerText({ timeout: 15000 })).replace(/\s+/g, ' ').trim();
const settle = (page) => page.waitForLoadState('domcontentloaded').then(() => page.locator('h1').first().waitFor({ timeout: 15000 }));
// After a client-side navigation the URL changes before the next (lazy) page
// renders, so wait for the destination's own <h1>.
const waitHeading = async (page, text) => {
  await page.waitForFunction((t) => [...document.querySelectorAll('h1')].some((h) => h.innerText.toUpperCase().includes(t)), text.toUpperCase(), { timeout: 15000 }).catch(() => {});
  return h1(page);
};
const waitPath = (page, expected) => page.waitForURL((u) => (expected instanceof RegExp ? expected.test(u.pathname) : u.pathname === expected), { timeout: 15000 });

const desk = await launch();
const { page } = desk;

// --- Navbar links are real links, never #anchors ------------------------------
await page.goto(BASE + '/');
const hrefs = await page.locator('[data-nav-section] a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
check(hrefs.length >= NAV_SECTIONS.reduce((n, s) => n + s.items.length + 1, 0), `the desktop Navbar renders every section and item as a link (${hrefs.length})`);
check(hrefs.every((h) => h.startsWith('/') && !h.includes('#')), `no Navbar destination is an #anchor (${hrefs.filter((h) => h.includes('#')).join(', ') || 'none'})`);

// --- Desktop: every dropdown item -------------------------------------------------
for (const section of NAV_SECTIONS) {
  for (const item of section.items) {
    const label = `${section.title} → ${item.label}`;
    // Start on the section page (or the home page for the section page itself;
    // the artist app's pages don't carry the site Navbar).
    const start = item.path === section.path || section.path === '/artist' ? '/' : section.path;
    await page.goto(BASE + start);
    await settle(page);
    const menu = page.locator(`[data-nav-section="${section.title}"]`);
    await menu.hover();
    await menu.getByRole('link', { name: item.label, exact: true }).click();
    const expected = item.protected ? /^\/artist\/(dashboard|login)$/ : item.path;
    await waitPath(page, expected);
    const heading = item.protected ? await h1(page) : await waitHeading(page, item.heading);
    check(item.protected || heading.toUpperCase().includes(item.heading), `${label}: ${path(page)} shows "${heading}"`);
    if (!item.protected) {
      // The artist app (/artist…) has its own navbar; the site Navbar is checked elsewhere.
      // The menu of the section this URL belongs to is highlighted (an item
      // listed under two menus, e.g. Previous Sessions, highlights its home).
      const home = sectionFor(item.path).title;
      const homeMenu = page.locator(`[data-nav-section="${home}"]`);
      if (await homeMenu.count()) {
        const current = await homeMenu.locator('a').first().getAttribute('data-active');
        check(current === 'true', `${label}: the ${home} menu is highlighted`);
      }
      await page.reload();
      check(path(page) === item.path && (await waitHeading(page, item.heading)) === heading, `${label}: reload keeps the page`);
    }
    await page.goBack();
    await waitPath(page, start);
    check(path(page) === start, `${label}: Back returns to ${start}`);
    await page.goForward();
    await waitPath(page, expected);
    check(item.protected || (await waitHeading(page, item.heading)) === heading, `${label}: Forward returns to the page`);
  }
}

// --- Breadcrumbs lead back to the section page ---------------------------------------
for (const [url, parent] of [['/sessions/calendar', '/sessions'], ['/about/team', '/about'], ['/private/corporate', '/private-sessions'], ['/crew/production', '/crew']]) {
  await page.goto(BASE + url);
  await settle(page);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  check(await crumbs.locator('[aria-current="page"]').isVisible(), `${url}: breadcrumb marks the current page`);
  await crumbs.getByRole('link').first().click();
  await waitPath(page, parent);
  check(path(page) === parent, `${url}: the breadcrumb parent opens ${parent}`);
}

// --- Section pages link to their sub-pages with real links --------------------------
for (const section of NAV_SECTIONS.filter((s) => ['About', 'Sessions', 'Archive', 'Crew', 'Private'].includes(s.title))) {
  await page.goto(BASE + section.path);
  await settle(page);
  const sub = page.locator(`[data-section-nav="${section.title}"] a`);
  const subHrefs = await sub.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  check(section.items.every((i) => subHrefs.includes(i.path)), `${section.path} links to every ${section.title} page (${subHrefs.join(', ')})`);
}

// --- Old URLs and unknown sub-pages ------------------------------------------------------
for (const [from, to] of [['/sessions/upcoming', '/sessions'], ['/blogs', '/diary'], ['/apply/crew', '/crew/apply'], ['/volunteer', '/crew/volunteer'], ['/diary/behind-the-scenes', '/diary']]) {
  await page.goto(BASE + from);
  await waitPath(page, to);
  check(path(page) === to, `old URL ${from} → ${to}`);
}
for (const url of ['/about/founders-of-nothing', '/archive/not-a-page', '/crew/not-a-page', '/contact/not-a-page']) {
  await page.goto(BASE + url);
  await page.locator('[data-not-found]').waitFor({ timeout: 15000 });
  check(true, `${url} shows the not-found page`);
}

// --- Page titles -------------------------------------------------------------------------
for (const [url, title] of [['/sessions/concert-culture', 'Concert Culture'], ['/sessions/calendar', 'Session'], ['/private/corporate', 'Corporate Events'], ['/about/chronology', 'Chronology'], ['/crew/stage-operations', 'Stage Operations']]) {
  await page.goto(BASE + url);
  await settle(page);
  const t = await page.title();
  check(t.toLowerCase().includes(title.toLowerCase()) && /Tangy Sessions/.test(t), `${url} has its own title ("${t}")`);
}

const deskErrors = desk.errors.filter((e) => !/http 4\d\d|Failed to load resource/.test(e));
check(deskErrors.length === 0, `desktop: no page errors (${deskErrors.slice(0, 3).join(' | ')})`);
await desk.browser.close();

// --- Mobile index menu ---------------------------------------------------------------------
for (const width of [375, 390, 412]) {
  const m = await launch({ mobile: true });
  await m.page.setViewportSize({ width, height: 844 });
  // Every item at 390; a representative set at the other widths.
  const items = NAV_SECTIONS.flatMap((s) => s.items.map((i) => [s, i]))
    .filter(([s, i]) => width === 390 || ['/sessions/calendar', '/sessions/waitlist', '/private/corporate', '/about/chronology', '/archive/past-memories', '/diary/journal'].includes(i.path) || (s.title === 'Sessions'));
  for (const [section, item] of items) {
    if (item.protected) continue;
    const start = item.path === section.path || section.path === '/artist' ? '/' : section.path;
    await m.page.goto(BASE + start);
    await settle(m.page);
    await m.page.getByRole('button', { name: /index/i }).click();
    const panel = m.page.locator('#archive-index-panel');
    await panel.getByRole('button', { name: `Show ${section.title} pages` }).click();
    await panel.getByRole('link', { name: item.label, exact: true }).click();
    await waitPath(m.page, item.path);
    const heading = await waitHeading(m.page, item.heading);
    check(heading.toUpperCase().includes(item.heading), `${width}px: ${section.title} → ${item.label} opens ${item.path} ("${heading}")`);
    check(await m.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: ${item.path} has no sideways scrolling`);
    if (item.path === '/sessions/calendar') {
      await m.page.goBack();
      await waitPath(m.page, start);
      check(path(m.page) === start, `${width}px: Back from ${item.path} returns to ${start}`);
    }
  }
  const mErrors = m.errors.filter((e) => !/http 4\d\d|Failed to load resource/.test(e));
  check(mErrors.length === 0, `${width}px: no page errors (${mErrors.slice(0, 3).join(' | ')})`);
  await m.browser.close();
}
