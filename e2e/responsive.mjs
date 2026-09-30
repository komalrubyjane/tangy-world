import { chromium } from 'playwright-core';
import { check, BASE, SHOTS } from './lib.mjs';

// Phone sweep of the public pages at the three target sizes: no sideways
// scrolling, exactly one <h1>, every <img> has an alt attribute (empty is
// fine for decoration), every button/link has an accessible name, and the
// page sets its own <title>. Screenshots go to shots/responsive-*.png.

const VIEWPORTS = [[390, 844], [375, 812], [412, 915]];
const PAGES = [
  ['/sessions', 'sessions'],
  ['/sessions/vol-6-local', 'session'],
  ['/sessions/waitlist', 'waitlist'],
  ['/tv', 'tv'],
  ['/tv/damini-bhattacharya-live', 'tv-video'],
  ['/diary', 'diary'],
  ['/gallery', 'gallery'],
  ['/gallery/tangy-sessions', 'album'],
  ['/artists/aria-artist', 'artist'],
  ['/faq', 'faq'],
  ['/contact', 'contact'],
  ['/private-sessions', 'private'],
  ['/join/login', 'login'],
  ['/no-such-page', '404'],
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
for (const [w, h] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${w}px pageerror: ${e.message}`));
  for (const [path, name] of PAGES) {
    await page.goto(BASE + path);
    await page.locator('h1').first().waitFor({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const visible = (el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
      const named = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.querySelector('img[alt]:not([alt=""])')?.alt || '').trim().length > 0
        || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.innerText.trim());
      return {
        over: document.documentElement.scrollWidth - window.innerWidth,
        h1: [...document.querySelectorAll('h1')].filter(visible).length,
        noAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-40)),
        unnamed: [...document.querySelectorAll('button, a[href]')].filter(visible).filter((el) => !named(el)).map((el) => el.outerHTML.slice(0, 80)),
        title: document.title,
      };
    });
    const label = `${w}×${h} ${path}`;
    check(r.over <= 1, `${label}: no sideways scroll${r.over > 1 ? ` (+${r.over}px)` : ''}`);
    check(r.h1 === 1, `${label}: one visible h1 (${r.h1})`);
    check(r.noAlt.length === 0, `${label}: images have alt${r.noAlt.length ? ` — missing: ${r.noAlt.join(', ')}` : ''}`);
    check(r.unnamed.length === 0, `${label}: controls have names${r.unnamed.length ? ` — ${r.unnamed.slice(0, 3).join(' | ')}` : ''}`);
    check(/Tangy Sessions$/.test(r.title) && r.title !== 'Tangy Sessions', `${label}: page title "${r.title}"`);
    if (w === 390) await page.screenshot({ path: `${SHOTS}responsive-${name}.png` });
  }
  await context.close();
}
await browser.close();
console.log('\nERRORS:\n' + (errors.length ? errors.join('\n') : '(none)'));
if (errors.length) process.exitCode = 1;
