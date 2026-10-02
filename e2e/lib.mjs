import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

export const BASE = process.env.E2E_BASE || 'http://127.0.0.1:5173';
export const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));
const MAIL = 'http://127.0.0.1:54324';

export async function launch({ mobile = false, camera = null } = {}) {
  const args = camera ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${camera}`] : [];
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args });
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }
    : { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  if (camera) await context.grantPermissions(['camera'], { origin: BASE });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes(':54321')) errors.push(`http ${r.status()} ${r.request().method()} ${r.url().replace(/^.*54321/, '')}`); });
  return { browser, context, page, errors };
}

export async function latestCode(email, after) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`).then((r) => r.json());
    const msg = (res.messages || []).find((m) => new Date(m.Created).getTime() >= after);
    if (msg) {
      const full = await fetch(`${MAIL}/api/v1/message/${msg.ID}`).then((r) => r.json());
      const m = (full.Text || '').match(/\b(\d{6})\b/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no OTP email for ${email}`);
}

export async function otpLogin(page, email, path = '/admin-portal') {
  await page.goto(BASE + path);
  await page.getByPlaceholder('you@example.com').fill(email);
  // The local auth server allows 30 sign-ins per 5 minutes per IP; the full
  // runner signs in more often than that, so back off and retry when no code
  // arrives (a rate-limited request sends no email).
  let code = null;
  for (let attempt = 0; !code && attempt < 6; attempt++) {
    if (attempt) {
      console.log(`(otp send refused for ${email} — local auth rate limit; waiting 60s, attempt ${attempt + 1})`);
      await page.waitForTimeout(60000);
      await page.goto(BASE + path);
      await page.getByPlaceholder('you@example.com').fill(email);
    }
    const t0 = Date.now() - 2000;
    await page.getByRole('button', { name: /send verification code/i }).click();
    // Either the code inputs appear (the email was sent) or the form shows an error.
    const sent = await page.getByLabel('Digit 1 of 6').waitFor({ timeout: 15000 }).then(() => true, () => false);
    if (sent) code = await latestCode(email, t0);
  }
  if (!code) throw new Error(`no OTP email for ${email}`);
  await page.getByLabel('Digit 1 of 6').waitFor();
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill(code[i]);
  await page.getByRole('button', { name: /verify email/i }).click();
  // Fail loudly if verification didn't sign us in (e.g. rate limit, wrong code).
  const ok = await page.getByLabel('Digit 1 of 6').waitFor({ state: 'detached', timeout: 15000 }).then(() => true, () => false);
  if (!ok) throw new Error(`OTP sign-in failed for ${email}: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300)}`);
}

export async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: false });
}

export function check(cond, label) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) process.exitCode = 1;
}

// Calls PostgREST directly with the signed-in user's own JWT — i.e. exactly
// what a user could do from devtools, bypassing the UI entirely.
// Local stack keys come from the environment (`supabase status -o env`), never the repo.
const ANON = process.env.ANON_KEY;
if (!ANON) throw new Error('Set ANON_KEY (run: eval "$(npx supabase status -o env)" in your local stack folder)');
export async function api(page, method, path, body) {
  return page.evaluate(async ({ method, path, body, anon }) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
    const token = JSON.parse(localStorage.getItem(key)).access_token;
    const res = await fetch('http://127.0.0.1:54321' + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    });
    let data = null; try { data = await res.json(); } catch { /* empty */ }
    return { status: res.status, data };
  }, { method, path, body, anon: ANON });
}

// A section tab. Since the routing pass, section tabs are real links inside a
// section nav (admin "Sections", portal "Portal sections" / "Dashboard
// sections"); in-page filters and view toggles are still role="tab".
export const SECTION_NAVS = 'nav[aria-label="Sections"], nav[aria-label="Portal sections"], nav[aria-label="Dashboard sections"]';
export function sectionTab(scope, name, opts = {}) {
  return scope.locator(SECTION_NAVS).getByRole('link', { name, ...opts })
    .or(scope.getByRole('tab', { name, ...opts })).first();
}
