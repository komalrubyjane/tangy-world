import { execFileSync } from 'node:child_process';
import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

// Server-authoritative waitlist (0027) end to end, on a phone (390×844):
// a sold-out session shows a waitlist instead of checkout; a signed-out
// visitor is asked to sign in and comes back to the session; the patron joins
// and sees their position; direct writes and self-offers are refused; a
// cancellation offers the seats to the patron (notification + held-seat
// banner + checkout, while the session stays sold out for everyone else);
// the admin sees the offer; when the hold lapses the seat is released.

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const seen = (loc, ms = 10000) => loc.waitFor({ timeout: ms }).then(() => true, () => false);
const allErrors = [];
const refused = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));

// A two-seat session, already full (a comp booking holds both seats).
sql(`insert into events (slug, name, event_date, venue, capacity, price, status, description)
     values ('e2e-waitlist', 'E2E Waitlist Night', current_date + 12, 'Bansilalpet Stepwell', 2, 600, 'on-sale', 'A tiny session for the waitlist suite.')
     on conflict (slug) do nothing`);
const EVT = sql("select id from events where slug = 'e2e-waitlist'");
sql(`insert into bookings (registration_code, event_id, attendee_name, attendee_email, quantity, amount, tier, status, source)
     values ('TS-E2EWL', '${EVT}', 'Guest list', 'guests@tangy.test', 2, 0, 'gen', 'confirmed', 'complimentary')`);
const PATRON = sql("select id from profiles where email = 'patron@tangy.test'");

// --- Signed out: waitlist, not checkout --------------------------------------------
const p = await launch({ mobile: true });
await p.page.goto(`${BASE}/sessions/e2e-waitlist`);
check(await seen(p.page.locator('[data-waitlist-panel]')), 'sold out: the session shows a waitlist panel');
check(!(await p.page.locator('[data-checkout-step]').count()), 'sold out: no checkout form');
check(await seen(p.page.getByRole('button', { name: /sign in to join the waitlist/i })), 'signed out: asked to sign in to join');
await shot(p.page, 'waitlist-01-sold-out');

// Sign in the way ProtectedRoute sends people: /join/login?next=…
await otpLogin(p.page, 'patron@tangy.test', `/join/login?next=${encodeURIComponent('/sessions/e2e-waitlist')}`);
check(await p.page.waitForURL(/\/sessions\/e2e-waitlist$/, { timeout: 10000 }).then(() => true, () => false), 'after sign-in the patron is back on the session (next= kept)');

// --- Join ---------------------------------------------------------------------------------
await p.page.getByRole('button', { name: 'More people' }).click();
await p.page.locator('[data-waitlist-join]').click();
check(await seen(p.page.getByText(/position 1/i).first()), 'joining shows position 1');
check(sql(`select status || '/' || quantity from waitlist where event_id = '${EVT}' and user_id = '${PATRON}'`) === 'waiting/2', 'the entry (2 people) is stored against the patron\'s account');
await p.page.reload();
check(await seen(p.page.locator('[data-waitlist-position]')), 'after reload the page shows the patron\'s place');
check(await seen(p.page.locator('[data-waitlist-leave]')), 'and offers "Leave the waitlist"');
await shot(p.page, 'waitlist-02-joined');

// --- Attacks from the browser -------------------------------------------------------------
const before = p.errors.length;
const direct = await api(p.page, 'POST', '/rest/v1/waitlist', { event_id: EVT, name: 'Me', email: 'patron@tangy.test' });
check(direct.status === 401 || direct.status === 403, `direct waitlist insert refused (${direct.status})`);
const selfOffer = await api(p.page, 'PATCH', `/rest/v1/waitlist?user_id=eq.${PATRON}`, { status: 'offered', offered_at: new Date().toISOString(), offer_expires_at: new Date(Date.now() + 864e5).toISOString() });
check(sql(`select status from waitlist where event_id = '${EVT}' and user_id = '${PATRON}'`) === 'waiting', `a patron cannot offer themselves seats (${selfOffer.status})`);
const runOffers = await api(p.page, 'POST', '/rest/v1/rpc/admin_offer_waitlist', { p_event_id: EVT });
check(runOffers.status >= 400, `a patron cannot run the offer engine (${runOffers.status})`);
const twice = await api(p.page, 'POST', '/rest/v1/rpc/join_waitlist', { p_event_id: EVT, p_quantity: 1 });
check(twice.status >= 400 && /ALREADY_WAITLISTED/.test(twice.data?.message || ''), 'joining twice is refused');
refused.push(...p.errors.splice(before));

// --- A seat is released ---------------------------------------------------------------------
sql("update bookings set status = 'cancelled' where registration_code = 'TS-E2EWL'");
check(sql(`select status from waitlist where event_id = '${EVT}' and user_id = '${PATRON}'`) === 'offered', 'a cancellation offers the seats to the head of the queue');
check(sql(`select count(*) from notifications where user_id = '${PATRON}' and type = 'waitlist.offer' and link = '/sessions/e2e-waitlist'`) === '1', 'the patron is notified with a link to the session');
await p.page.reload();
check(await seen(p.page.locator('[data-waitlist-offer]')), 'the patron sees "Seats held for you"');
check(await seen(p.page.locator('[data-checkout-step]')), 'and can check out the held seats');
await shot(p.page, 'waitlist-03-offer');

const v = await launch({ mobile: true });
await v.page.goto(`${BASE}/sessions/e2e-waitlist`);
check(await seen(v.page.locator('[data-waitlist-panel]')), 'everyone else still sees the session as sold out (seats are held)');

await p.page.goto(`${BASE}/dashboard?tab=waitlist`);
const dash = p.page.locator('[data-my-waitlist-entry]').first();
check(await seen(dash) && /Seats held for you/i.test(await dash.innerText()), 'the patron dashboard shows the held seats');

// --- Admin view ----------------------------------------------------------------------------------
const m = await launch();
await otpLogin(m.page, 'manager@tangy.test');
await m.page.goto(`${BASE}/admin-portal/ops/waitlist`);
const row = m.page.getByText('patron@tangy.test').first();
check(await seen(row), 'admin: the waitlist lists the patron');
check(/held until/i.test(await m.page.locator('main').innerText()), 'admin: the entry shows the offer and its hold');
await shot(m.page, 'waitlist-04-admin');

// --- The hold lapses --------------------------------------------------------------------------------
sql(`update waitlist set offer_expires_at = now() - interval '1 minute' where event_id = '${EVT}' and user_id = '${PATRON}'`);
check(sql('select expire_waitlist_offers()') === '1', 'the scheduled job expires the lapsed offer');
check(sql(`select count(*) from notifications where user_id = '${PATRON}' and type = 'waitlist.offer_expired'`) === '1', 'the patron is told the hold ran out');
await v.page.reload();
check(await seen(v.page.getByText(/2 SEATS LEFT/i).first()), 'with nobody else waiting, the released seats go back on sale');

track('patron', p.errors); track('visitor', v.errors); track('manager', m.errors);
await Promise.all([p.browser.close(), v.browser.close(), m.browser.close()]);
console.log('\nEXPECTED REFUSALS:\n' + (refused.length ? refused.join('\n') : '(none)'));
console.log('\nERRORS:\n' + (allErrors.length ? allErrors.join('\n') : '(none)'));
if (allErrors.length) process.exitCode = 1;
