import { launch, otpLogin, check, BASE } from './lib.mjs';

// Idle timeout (System Settings → auth.admin_idle_timeout_minutes = 60)
{
  const { browser, page } = await launch();
  await page.clock.install();
  await otpLogin(page, 'manager@tangy.test');
  await page.getByRole('heading', { name: /operations/i }).waitFor({ timeout: 15000 });
  await page.clock.fastForward('30:00');
  check(await page.getByRole('heading', { name: /operations/i }).isVisible(), 'still signed in after 30 idle minutes');
  await page.clock.fastForward('31:00');
  const out = await page.getByPlaceholder('you@example.com').waitFor({ timeout: 10000 }).then(() => true, () => false);
  check(out, 'signed out after 61 idle minutes');
  const token = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.endsWith('-auth-token')).length);
  check(token === 0, 'stored auth token cleared');
  check(/inactivity/i.test(await page.locator('body').innerText()), 'sign-in explains the inactivity sign-out');
  await page.goto(BASE + '/admin/events');
  check(await page.getByPlaceholder('you@example.com').waitFor({ timeout: 10000 }).then(() => true, () => false), 'session is really gone (reload shows sign-in)');
  await browser.close();
}

// Tampered / absent session: admin routes require auth
{
  const { browser, page } = await launch();
  await page.goto(BASE + '/admin/users');
  await page.getByPlaceholder('you@example.com').waitFor();
  check(!(await page.locator('body').innerText()).includes('manager@tangy.test'), 'unauthenticated deep link shows sign-in, no data');
  // Wrong OTP is rejected
  await page.getByPlaceholder('you@example.com').fill('manager@tangy.test');
  await page.getByRole('button', { name: /send verification code/i }).click();
  await page.getByLabel('Digit 1 of 6').waitFor();
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill('0');
  await page.getByRole('button', { name: /verify email/i }).click();
  await page.waitForTimeout(2500);
  check(await page.getByLabel('Digit 1 of 6').isVisible(), 'wrong OTP does not sign in');
  await browser.close();
}

// A plain patron account cannot enter the console
{
  const { browser, page } = await launch();
  await otpLogin(page, 'patron@tangy.test');
  await page.waitForTimeout(4000);
  const t = await page.locator('body').innerText();
  check(!/system overview|operations|hello,/i.test(t.split('\n').slice(0, 40).join(' ')) || /permission|not have access|staff only/i.test(t), 'patron is refused console access');
  console.log('  patron sees:', t.replace(/\s+/g, ' ').slice(0, 160));
  await browser.close();
}
